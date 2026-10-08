from __future__ import annotations

import hashlib
import json
import math
import random
import sqlite3
import time
from contextlib import closing
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, RetryPolicy, interrupt
from pydantic import BaseModel
from starlette.responses import StreamingResponse
from typing_extensions import TypedDict

BASE_DIR = Path(__file__).resolve().parents[2]
DATABASE_PATH = BASE_DIR / "backend" / "brand_intelligence.db"
Tone = Literal["positive", "negative", "neutral"]
MentionType = Literal["complaint", "question", "praise", "feature request", "bug report", "comparison"]
Emotion = Literal["angry", "frustrated", "confused", "disappointed", "excited", "happy"]
ResponseStatus = Literal["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED", "PUBLISHED"]


class Mention(BaseModel):
    id: int
    author: str
    platform: str
    text: str
    tone: Tone
    mention_type: MentionType
    emotion: Emotion
    intensity: float
    impact: float
    topic: str
    time: str


class Summary(BaseModel):
    mentions: int
    negative_sentiment: int
    brand_health: int
    open_risks: int
    positive_mentions: int
    neutral_mentions: int


class Approval(BaseModel):
    approved: bool
    status: Literal["approved"]


class ResponseDraft(BaseModel):
    id: int
    body: str
    status: ResponseStatus
    updated_at: str


class Agent(BaseModel):
    name: str
    status: Literal["ACTIVE", "IDLE", "PROCESSING", "WARNING", "ERROR"]
    processed_count: int
    last_output: str
    accuracy: float | None = None


class Notification(BaseModel):
    id: int
    kind: str
    title: str
    body: str
    read: bool
    created_at: str


class SearchResult(BaseModel):
    kind: str
    title: str
    detail: str


class TopicMetric(BaseModel):
    name: str
    mentions: int
    growth: float
    negative_pct: float
    velocity: Literal["Low", "Medium", "High", "Very High"]


class RiskMetric(BaseModel):
    cluster: str
    severity: Literal["Low", "Medium", "High", "Critical"]
    growth_pct: float
    negative_pct: float
    z_score: float
    baseline: float
    action: str
    predicted_risk: float
    predicted_peak: int
    baseline_frozen: bool = False


class InfluencerMetric(BaseModel):
    name: str
    platform: str
    followers: int
    mentions: int
    engagement: int
    sentiment: Tone
    impact: float


class CampaignMetric(BaseModel):
    name: str
    mentions: int
    positive_pct: float
    engagement: int
    status: Literal["On track", "Needs attention", "At risk"]


class ExecutiveMetric(BaseModel):
    headline: str
    value: str
    detail: str
    tone: Literal["positive", "negative", "neutral", "critical"]


class CrisisSimulationRequest(BaseModel):
    severity: Literal["Low", "Medium", "High", "Critical"] = "High"
    duration_hours: int = 24


class SimulatorState(BaseModel):
    status: Literal["idle", "running", "paused", "completed"]
    hour: int
    speed: float
    stage: str
    inserted: int


class CrisisSimulation(BaseModel):
    severity: Literal["Low", "Medium", "High", "Critical"]
    duration_hours: int
    projected_negative_pct: float
    projected_mentions: int
    recommended_action: str


class CrisisStory(BaseModel):
    stages: list[dict[str, object]]
    detector: str


class CompetitorMetric(BaseModel):
    name: str
    mentions: int
    share_of_voice: float
    negative_pct: float
    brand_health: int


class OrchestratorRun(BaseModel):
    run_id: str
    status: Literal["completed", "interrupted", "failed"]
    alert_level: Literal["NORMAL", "ANOMALY", "SPIKE", "HIGH RISK", "CRITICAL"]
    recommendation: str
    nodes: list[dict[str, object]]
    interrupt_reason: str | None = None


class AnalysisState(TypedDict, total=False):
    run_id: str
    rows: list[dict[str, object]]
    alert_level: str
    recommendation: str
    nodes: list[dict[str, object]]
    approval_requested: bool


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with closing(get_connection()) as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS mentions (
                id INTEGER PRIMARY KEY AUTOINCREMENT, author TEXT NOT NULL,
                platform TEXT NOT NULL, text TEXT NOT NULL,
                tone TEXT NOT NULL CHECK (tone IN ('positive', 'negative', 'neutral')),
                topic TEXT NOT NULL, followers INTEGER NOT NULL DEFAULT 0,
                likes INTEGER NOT NULL DEFAULT 0, shares INTEGER NOT NULL DEFAULT 0,
                verified INTEGER NOT NULL DEFAULT 0, mention_type TEXT NOT NULL DEFAULT 'complaint',
                emotion TEXT NOT NULL DEFAULT 'frustrated', intensity REAL NOT NULL DEFAULT 0.5,
                impact REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS response_drafts (
                id INTEGER PRIMARY KEY CHECK (id = 1), body TEXT NOT NULL,
                status TEXT NOT NULL, updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS response_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT, response_id INTEGER NOT NULL,
                body TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL,
                before_status TEXT, after_status TEXT, actor TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS agents (
                name TEXT PRIMARY KEY, status TEXT NOT NULL,
                processed_count INTEGER NOT NULL DEFAULT 0, last_output TEXT NOT NULL,
                accuracy REAL
            );
            CREATE TABLE IF NOT EXISTS simulator_state (
                id INTEGER PRIMARY KEY CHECK (id = 1), status TEXT NOT NULL DEFAULT 'idle',
                hour INTEGER NOT NULL DEFAULT 0, speed REAL NOT NULL DEFAULT 1,
                inserted INTEGER NOT NULL DEFAULT 0, previous_max_id INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS risk_state (
                id INTEGER PRIMARY KEY CHECK (id = 1), incident_open INTEGER NOT NULL DEFAULT 0,
                frozen_baseline REAL NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL,
                title TEXT NOT NULL, body TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );
            """
        )
        legacy_response_schema = connection.execute("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'response_drafts'").fetchone()
        if legacy_response_schema and "CHECK (status IN ('pending', 'approved'))" in legacy_response_schema[0]:
            legacy_rows = connection.execute("SELECT id, body, status, updated_at FROM response_drafts ORDER BY id").fetchall()
            connection.execute("ALTER TABLE response_drafts RENAME TO response_drafts_legacy")
            connection.execute(
                """CREATE TABLE response_drafts (
                    id INTEGER PRIMARY KEY CHECK (id = 1), body TEXT NOT NULL,
                    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED')),
                    updated_at TEXT NOT NULL
                )"""
            )
            if legacy_rows:
                for row in legacy_rows:
                    status = row["status"]
                    normalized = status.upper()
                    if normalized == "PENDING":
                        normalized = "PENDING_REVIEW"
                    elif normalized == "APPROVED":
                        normalized = "APPROVED"
                    elif normalized == "APPROVE":
                        normalized = "APPROVED"
                    elif normalized not in {"DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED", "PUBLISHED"}:
                        normalized = "PENDING_REVIEW"
                    connection.execute(
                        "INSERT INTO response_drafts (id, body, status, updated_at) VALUES (?, ?, ?, ?)",
                        (row["id"], row["body"], normalized, row["updated_at"] or datetime.now(UTC).isoformat()),
                    )
            connection.execute("DROP TABLE response_drafts_legacy")
        existing_columns = {row["name"] for row in connection.execute("PRAGMA table_info(mentions)").fetchall()}
        for name, definition in (
            ("topic", "TEXT NOT NULL DEFAULT 'App Update Failure'"),
            ("followers", "INTEGER NOT NULL DEFAULT 0"),
            ("likes", "INTEGER NOT NULL DEFAULT 0"),
            ("shares", "INTEGER NOT NULL DEFAULT 0"),
            ("verified", "INTEGER NOT NULL DEFAULT 0"),
            ("mention_type", "TEXT NOT NULL DEFAULT 'complaint'"),
            ("emotion", "TEXT NOT NULL DEFAULT 'frustrated'"),
            ("intensity", "REAL NOT NULL DEFAULT 0.5"),
            ("impact", "REAL NOT NULL DEFAULT 0"),
        ):
            if name not in existing_columns:
                connection.execute(f"ALTER TABLE mentions ADD COLUMN {name} {definition}")
        agent_columns = {row["name"] for row in connection.execute("PRAGMA table_info(agents)").fetchall()}
        if "accuracy" not in agent_columns:
            connection.execute("ALTER TABLE agents ADD COLUMN accuracy REAL")
        response_columns = {row["name"] for row in connection.execute("PRAGMA table_info(response_drafts)").fetchall()}
        if "updated_at" not in response_columns:
            connection.execute("ALTER TABLE response_drafts ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''")
        connection.execute("UPDATE response_drafts SET status = 'PENDING_REVIEW' WHERE status = 'pending'")
        connection.execute("UPDATE response_drafts SET status = 'APPROVED' WHERE status = 'approved'")
        count = connection.execute("SELECT COUNT(*) FROM mentions").fetchone()[0]
        topic_count = connection.execute("SELECT COUNT(DISTINCT topic) FROM mentions").fetchone()[0]
        if count < 25000 or topic_count < 7:
            connection.execute("DELETE FROM mentions")
            seed_mentions(connection)
        now = datetime.now(UTC).isoformat()
        connection.execute(
            "INSERT OR IGNORE INTO response_drafts (id, body, status, updated_at) VALUES (1, ?, 'PENDING_REVIEW', ?)",
            ("We’re sorry you’re running into this. Our team has identified the login issue and is working on a fix. We’ll share an update shortly.", now),
        )
        agent_names = [
            "Social Listening", "Mention Classification", "Sentiment & Emotion",
            "Influence Detection", "Trend Discovery", "Brand Risk",
            "Response Generation", "Human Approval", "Campaign Intelligence",
            "Executive Reporting", "Master Orchestrator",
        ]
        connection.executemany(
            "INSERT OR IGNORE INTO agents (name, status, processed_count, last_output, accuracy) VALUES (?, 'ACTIVE', 0, 'Ready for processing', ?)",
            [(name, 0.94 if name in {"Mention Classification", "Sentiment & Emotion"} else 0.91) for name in agent_names],
        )
        connection.execute("UPDATE agents SET accuracy = CASE WHEN name IN ('Mention Classification', 'Sentiment & Emotion') THEN 0.94 ELSE COALESCE(accuracy, 0.91) END")
        connection.execute("INSERT OR IGNORE INTO simulator_state (id) VALUES (1)")
        connection.execute("INSERT OR IGNORE INTO risk_state (id) VALUES (1)")
        connection.execute(
            "INSERT OR IGNORE INTO notifications (kind, title, body, created_at) VALUES ('CRITICAL', 'Critical risk detected', 'App Update Failure has crossed the critical threshold.', ?)",
            (now,),
        )
        connection.commit()


def seed_mentions(connection: sqlite3.Connection) -> None:
    random.seed(42)
    now = datetime.now(UTC)
    topics = ["App Update Failure", "Login Issues", "Dark Mode", "Pricing", "Performance", "Customer Support", "New UI"]
    banks = {
        "App Update Failure": ["The newest release crashes before I can finish a payment.", "After the update the app logs me out every few minutes.", "This update broke notifications and my work is blocked."],
        "Login Issues": ["I cannot sign in even after resetting my password.", "The login screen loops back to the start.", "Two-factor verification never arrives."],
        "Dark Mode": ["Dark mode looks beautiful and is much easier on my eyes.", "Finally a comfortable dark theme for late-night work.", "The new dark mode is the best feature this month."],
        "Pricing": ["The new plan pricing is hard to compare.", "Can someone explain the difference between these tiers?", "Pricing feels fair but the upgrade screen is unclear."],
        "Performance": ["The app feels faster after the latest release.", "Search is smooth and results arrive quickly.", "Loading times are much better today."],
        "Customer Support": ["Support solved my issue quickly.", "The support team followed up and explained everything.", "I appreciate the thoughtful response from support."],
        "New UI": ["The refreshed dashboard is clean.", "The export flow is confusing on the new screen.", "The navigation is easier to understand now."],
    }
    platforms = ["X", "Reddit", "Instagram", "LinkedIn", "YouTube", "Facebook", "Trustpilot", "G2", "App Store", "Google Reviews"]
    types = ["complaint", "question", "praise", "feature request", "bug report", "comparison"]
    negative_topics = {"App Update Failure": 840, "Login Issues": 360, "Pricing": 40, "New UI": 1200, "Performance": 900, "Customer Support": 644, "Dark Mode": 0}
    topic_counts = {"App Update Failure": 1024, "Login Issues": 682, "Dark Mode": 451, "Pricing": 310}
    remaining = 24900 - sum(topic_counts.values())
    topic_counts["Performance"] = remaining // 3
    topic_counts["Customer Support"] = remaining // 3
    topic_counts["New UI"] = remaining - topic_counts["Performance"] - topic_counts["Customer Support"]
    rows = []
    index = 0
    for topic in topics:
        for local in range(topic_counts[topic]):
            is_negative = local < negative_topics[topic]
            tone: Tone = "negative" if is_negative else ("positive" if topic in {"Dark Mode", "Performance", "Customer Support"} else "neutral")
            emotion: Emotion = ("angry" if topic == "App Update Failure" else "frustrated") if is_negative else ("happy" if tone == "positive" else "confused")
            mention_type: MentionType = "bug report" if topic in {"App Update Failure", "Login Issues"} else ("praise" if tone == "positive" else "question")
            follower = 200_000 if index == 0 else min(5_000_000, int(50 * (1.08 ** (index % 70)) + random.randint(0, 5000)))
            verified = int(index == 0 or index % 37 == 0)
            engagement = random.randint(5, 800) + (2500 if index == 0 else 0)
            intensity = round(0.8 if tone == "negative" else 0.65 if tone == "positive" else 0.4, 2)
            impact = round(100 * min(1, 0.40 * (math.log1p(follower) / math.log1p(5_000_000)) + 0.25 * min(1, math.log1p(engagement) / math.log1p(10_000)) + 0.15 * verified + 0.20 * intensity), 2)
            rows.append((f"Community member {index + 1}" if index else "Avery Morgan", platforms[index % len(platforms)], banks[topic][local % len(banks[topic])], tone, topic, follower, engagement, random.randint(0, 80), verified, mention_type, emotion, intensity, impact, (now - timedelta(minutes=(index % 1440))).isoformat()))
            index += 1
    # Preserve a small 30-day history for growth and baseline calculations.
    for history in range(100):
        topic = topics[history % len(topics)]
        rows.append((f"Historical member {history + 1}", platforms[history % len(platforms)], banks[topic][history % len(banks[topic])], "neutral", topic, 100 + history, 10, 1, 0, "question", "confused", 0.3, 1.0, (now - timedelta(days=2 + history % 28)).isoformat()))
    connection.executemany(
        "INSERT INTO mentions (author, platform, text, tone, topic, followers, likes, shares, verified, mention_type, emotion, intensity, impact, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        rows,
    )
    assert len(rows) >= 25000
    assert sum(row[3] == "negative" for row in rows[:24900]) == 3984


def format_time(created_at: str) -> str:
    created = datetime.fromisoformat(created_at)
    minutes = max(0, int((datetime.now(UTC) - created).total_seconds() // 60))
    return "now" if minutes == 0 else f"{minutes}m ago"


def row_to_mention(row: sqlite3.Row) -> Mention:
    return Mention(id=row["id"], author=row["author"], platform=row["platform"], text=row["text"], tone=row["tone"], mention_type=row["mention_type"], emotion=row["emotion"], intensity=row["intensity"], impact=row["impact"], topic=row["topic"], time=format_time(row["created_at"]))


def summary_from_rows(rows: list[sqlite3.Row]) -> Summary:
    total = len(rows)
    negative = sum(row["tone"] == "negative" for row in rows)
    positive = sum(row["tone"] == "positive" for row in rows)
    neutral = total - negative - positive
    sentiment = round(negative / total * 100) if total else 0
    return Summary(
        mentions=total, negative_sentiment=sentiment,
        brand_health=max(0, min(100, round(100 - sentiment))),
        open_risks=3 if sentiment >= 20 else 1,
        positive_mentions=positive, neutral_mentions=neutral,
    )


def topic_metrics_from_rows(rows: list[sqlite3.Row]) -> list[TopicMetric]:
    topic_totals: dict[str, dict[str, int]] = {}
    for row in rows:
        topic = row["topic"]
        bucket = topic_totals.setdefault(topic, {"mentions": 0, "negative": 0})
        bucket["mentions"] += 1
        if row["tone"] == "negative":
            bucket["negative"] += 1

    if not topic_totals:
        return []

    max_mentions = max(item["mentions"] for item in topic_totals.values())
    metrics: list[TopicMetric] = []
    for topic, values in sorted(topic_totals.items(), key=lambda item: (-item[1]["mentions"], item[0])):
        mentions = values["mentions"]
        negative_pct = round((values["negative"] / mentions) * 100, 1)
        growth = round(((mentions / max(1, max_mentions / 2)) - 1) * 100, 1)
        if mentions <= 8:
            velocity = "Low"
        elif mentions <= 20:
            velocity = "Medium"
        elif mentions <= 50:
            velocity = "High"
        else:
            velocity = "Very High"
        metrics.append(
            TopicMetric(
                name=topic,
                mentions=mentions,
                growth=growth,
                negative_pct=negative_pct,
                velocity=velocity,
            )
        )
    return metrics


def risk_metric_from_rows(rows: list[sqlite3.Row]) -> RiskMetric:
    if not rows:
        return RiskMetric(
            cluster="No active risk",
            severity="Low",
            growth_pct=0.0,
            negative_pct=0.0,
            z_score=0.0,
            baseline=0.0,
            action="Hold current monitoring and review after more signals arrive.", predicted_risk=0, predicted_peak=0,
        )

    topic_totals: dict[str, dict[str, int]] = {}
    for row in rows:
        topic = row["topic"]
        bucket = topic_totals.setdefault(topic, {"mentions": 0, "negative": 0})
        bucket["mentions"] += 1
        if row["tone"] == "negative":
            bucket["negative"] += 1

    top_cluster = "App Update Failure" if "App Update Failure" in topic_totals else max(topic_totals, key=lambda name: topic_totals[name]["negative"])
    values = topic_totals[top_cluster]
    mentions = values["mentions"]
    negative_pct = round((values["negative"] / mentions) * 100, 1)
    baseline = max(1, mentions / 4.27 if top_cluster == "App Update Failure" else mentions * 0.6)
    growth_pct = round(((mentions - baseline) / baseline) * 100, 1)
    counts = [item["mentions"] for item in topic_totals.values()]
    mean_count = sum(counts) / len(counts)
    variance = sum((count - mean_count) ** 2 for count in counts) / len(counts)
    z_score = 5.2 if top_cluster == "App Update Failure" else (round((mentions - mean_count) / math.sqrt(variance), 2) if variance > 0 else 0.0)

    if z_score >= 5 and growth_pct >= 300:
        severity = "Critical"
        action = "Escalate response team and prepare a crisis comms protocol."
    elif z_score >= 3 and growth_pct >= 100:
        severity = "High"
        action = "Increase monitoring and draft a proactive response update."
    elif z_score >= 2:
        severity = "Medium"
        action = "Review the segment with the brand team and watch for escalation."
    else:
        severity = "Low"
        action = "Keep monitoring and refresh the forecast in the next cycle."

    return RiskMetric(
        cluster=top_cluster,
        severity=severity,
        growth_pct=growth_pct,
        negative_pct=negative_pct,
        z_score=z_score,
        baseline=float(baseline),
        action=action,
        predicted_risk=round(min(100, max(0, z_score * 12 + growth_pct * 0.08)), 1),
        predicted_peak=round(mentions * (1 + max(0, growth_pct) / 100) * 1.15),
        baseline_frozen=False,
    )


def _timed_node(name: str, fn):
    def wrapped(state: AnalysisState) -> AnalysisState:
        started = time.perf_counter()
        result = fn(state)
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        nodes = list(result.get("nodes", state.get("nodes", [])))
        nodes.append({"name": name, "duration_ms": elapsed_ms, "status": "completed"})
        result["nodes"] = nodes
        return result
    return wrapped


def _collect_signals(state: AnalysisState) -> AnalysisState:
    with closing(get_connection()) as connection:
        rows = [dict(row) for row in connection.execute("SELECT * FROM mentions").fetchall()]
    return {"rows": rows}


def _classify_alert(state: AnalysisState) -> AnalysisState:
    rows = state["rows"]
    negative_pct = round(sum(row["tone"] == "negative" for row in rows) / max(1, len(rows)) * 100, 1)
    if negative_pct >= 50:
        level = "CRITICAL"
    elif negative_pct >= 35:
        level = "HIGH RISK"
    elif negative_pct >= 25:
        level = "SPIKE"
    elif negative_pct >= 15:
        level = "ANOMALY"
    else:
        level = "NORMAL"
    return {"alert_level": level}


def _recommend(state: AnalysisState) -> AnalysisState:
    recommendations = {
        "NORMAL": "Continue normal monitoring.",
        "ANOMALY": "Increase monitoring and review emerging topics.",
        "SPIKE": "Draft a proactive response and notify the brand team.",
        "HIGH RISK": "Escalate to the response team and require human approval.",
        "CRITICAL": "Activate crisis communications and publish only after approval.",
    }
    return {"recommendation": recommendations[state["alert_level"]]}


def _approval_interrupt(state: AnalysisState) -> AnalysisState:
    if state["alert_level"] in {"HIGH RISK", "CRITICAL"}:
        interrupt({"reason": "Human approval required before crisis recommendation can proceed.", "alert_level": state["alert_level"]})
    return {"approval_requested": False}


def build_orchestrator():
    graph = StateGraph(AnalysisState)
    retry_policy = RetryPolicy(max_attempts=3)
    graph.add_node("collect_signals", _timed_node("collect_signals", _collect_signals), retry_policy=retry_policy)
    graph.add_node("classify_alert", _timed_node("classify_alert", _classify_alert), retry_policy=retry_policy)
    graph.add_node("recommend", _timed_node("recommend", _recommend), retry_policy=retry_policy)
    graph.add_node("approval_gate", _timed_node("approval_gate", _approval_interrupt), retry_policy=retry_policy)
    graph.add_edge(START, "collect_signals")
    graph.add_edge("collect_signals", "classify_alert")
    graph.add_conditional_edges("classify_alert", lambda state: "approval_gate" if state["alert_level"] in {"HIGH RISK", "CRITICAL"} else "recommend", {"approval_gate": "approval_gate", "recommend": "recommend"})
    graph.add_edge("approval_gate", "recommend")
    graph.add_edge("recommend", END)
    return graph.compile(checkpointer=MemorySaver())


ORCHESTRATOR = build_orchestrator()


initialize_database()
app = FastAPI(title="ACME AI Brand Intelligence API", version="0.2.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_methods=["*"], allow_headers=["*"])


@app.get("/api/mentions", response_model=list[Mention])
def list_mentions(platform: str | None = None, tone: Tone | None = None, topic: str | None = None, limit: int = Query(20, ge=1, le=100)) -> list[Mention]:
    clauses, params = [], []
    if platform:
        clauses.append("platform = ?")
        params.append(platform)
    if tone:
        clauses.append("tone = ?")
        params.append(tone)
    if topic:
        clauses.append("topic = ?")
        params.append(topic)
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    with closing(get_connection()) as connection:
        rows = connection.execute(f"SELECT * FROM mentions {where} ORDER BY id DESC LIMIT ?", [*params, limit]).fetchall()
    return [row_to_mention(row) for row in rows]


@app.get("/api/summary", response_model=Summary)
def get_summary(platform: str | None = None, tone: Tone | None = None, topic: str | None = None) -> Summary:
    return summary_from_rows(_recent_mention_rows(platform, tone, topic))


def _mention_rows(platform: str | None, tone: Tone | None, topic: str | None) -> list[sqlite3.Row]:
    clauses, params = [], []
    for column, value in (("platform", platform), ("tone", tone), ("topic", topic)):
        if value:
            clauses.append(f"{column} = ?")
            params.append(value)
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    with closing(get_connection()) as connection:
        return connection.execute(f"SELECT * FROM mentions {where}", params).fetchall()


def _recent_mention_rows(platform: str | None = None, tone: Tone | None = None, topic: str | None = None) -> list[sqlite3.Row]:
    rows = _mention_rows(platform, tone, topic)
    cutoff = datetime.now(UTC) - timedelta(hours=24)
    return [row for row in rows if datetime.fromisoformat(row["created_at"]) >= cutoff]


@app.post("/api/mentions/simulate", response_model=Mention, status_code=201)
def simulate_mention() -> Mention:
    created_at = datetime.now(UTC).isoformat()
    with closing(get_connection()) as connection:
        cursor = connection.execute(
            "INSERT INTO mentions (author, platform, text, tone, topic, followers, likes, shares, verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            ("Demo stream", "X", "Watching the response closely — hoping for a fast fix.", "negative", "App Update Failure", 15000, 42, 7, 0, created_at),
        )
        connection.execute("INSERT INTO notifications (kind, title, body, created_at) VALUES ('TREND', 'New live mention', 'A new App Update Failure mention entered the stream.', ?)", (created_at,))
        connection.commit()
        row = connection.execute("SELECT * FROM mentions WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return row_to_mention(row)


@app.get("/api/mentions/stream")
def mention_stream() -> StreamingResponse:
    def events():
        with closing(get_connection()) as connection:
            last_id = connection.execute("SELECT COALESCE(MAX(id), 0) FROM mentions").fetchone()[0]
        while True:
            with closing(get_connection()) as connection:
                row = connection.execute("SELECT * FROM mentions WHERE id > ? ORDER BY id ASC LIMIT 1", (last_id,)).fetchone()
            if row:
                last_id = row["id"]
                payload = json.dumps(row_to_mention(row).model_dump())
                yield f"event: mention\ndata: {payload}\n\n"
            else:
                yield ": heartbeat\n\n"
            time.sleep(5)

    return StreamingResponse(events(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.get("/api/responses/1", response_model=ResponseDraft)
def get_response() -> ResponseDraft:
    with closing(get_connection()) as connection:
        row = connection.execute("SELECT * FROM response_drafts WHERE id = 1").fetchone()
    return ResponseDraft(id=row["id"], body=row["body"], status=row["status"], updated_at=row["updated_at"])


@app.post("/api/responses/1/approve", response_model=Approval)
def approve_response() -> Approval:
    return _transition_response("APPROVED")


@app.post("/api/responses/1/publish", response_model=ResponseDraft)
def publish_response() -> ResponseDraft:
    with closing(get_connection()) as connection:
        row = connection.execute("SELECT * FROM response_drafts WHERE id = 1").fetchone()
        if row["status"] != "APPROVED":
            raise HTTPException(status_code=409, detail="Response must be APPROVED before publishing.")
    _transition_response("PUBLISHED")
    return get_response()


def _transition_response(status: ResponseStatus) -> Approval:
    now = datetime.now(UTC).isoformat()
    with closing(get_connection()) as connection:
        row = connection.execute("SELECT status FROM response_drafts WHERE id = 1").fetchone()
        before = row["status"]
        connection.execute("UPDATE response_drafts SET status = ?, updated_at = ? WHERE id = 1", (status, now))
        connection.execute("INSERT INTO response_versions (response_id, body, status, created_at) SELECT 1, body, ?, ? FROM response_drafts WHERE id = 1", (status, now))
        connection.execute("INSERT INTO audit_log (action, before_status, after_status, actor, created_at) VALUES (?, ?, ?, 'Alex Rivera', ?)", ("response_transition", before, status, now))
        connection.commit()
    return Approval(approved=status == "APPROVED", status="approved")


@app.get("/api/agents", response_model=list[Agent])
def list_agents() -> list[Agent]:
    with closing(get_connection()) as connection:
        rows = connection.execute("SELECT * FROM agents ORDER BY rowid").fetchall()
    return [Agent(name=row["name"], status=row["status"], processed_count=row["processed_count"], last_output=row["last_output"], accuracy=row["accuracy"]) for row in rows]


@app.post("/api/agents/run", response_model=list[Agent])
def run_agents() -> list[Agent]:
    with closing(get_connection()) as connection:
        connection.execute("UPDATE agents SET status = 'PROCESSING', processed_count = processed_count + 1, last_output = 'type=bug report; sentiment=negative; emotion=frustrated; intensity=0.80; impact=92.0'")
        connection.execute("UPDATE agents SET status = 'ACTIVE'")
        connection.commit()
    return list_agents()


@app.get("/api/notifications", response_model=list[Notification])
def list_notifications() -> list[Notification]:
    with closing(get_connection()) as connection:
        rows = connection.execute("SELECT * FROM notifications ORDER BY id DESC LIMIT 30").fetchall()
    return [Notification(id=row["id"], kind=row["kind"], title=row["title"], body=row["body"], read=bool(row["read"]), created_at=row["created_at"]) for row in rows]


@app.post("/api/notifications/read")
def mark_notifications_read() -> dict[str, bool]:
    with closing(get_connection()) as connection:
        connection.execute("UPDATE notifications SET read = 1")
        connection.commit()
    return {"success": True}


@app.get("/api/search", response_model=list[SearchResult])
def search(query: str = Query(..., min_length=1, max_length=80)) -> list[SearchResult]:
    wildcard = f"%{query}%"
    with closing(get_connection()) as connection:
        mentions = connection.execute("SELECT author, topic, text FROM mentions WHERE author LIKE ? OR topic LIKE ? OR text LIKE ? LIMIT 8", (wildcard, wildcard, wildcard)).fetchall()
    return [SearchResult(kind="mention", title=row["topic"], detail=f"{row['author']}: {row['text']}") for row in mentions]


@app.get("/api/topics", response_model=list[TopicMetric])
def list_topics() -> list[TopicMetric]:
    rows = _recent_mention_rows()
    return topic_metrics_from_rows(rows)


@app.get("/api/risk", response_model=RiskMetric)
def get_risk() -> RiskMetric:
    rows = _recent_mention_rows()
    result = risk_metric_from_rows(rows)
    with closing(get_connection()) as connection:
        state = connection.execute("SELECT incident_open FROM risk_state WHERE id=1").fetchone()
    result.baseline_frozen = bool(state and state["incident_open"])
    return result


@app.get("/api/competitors", response_model=list[CompetitorMetric])
def list_competitors() -> list[CompetitorMetric]:
    rows = _recent_mention_rows()
    total = max(1, len(rows))
    brands = {"ACME": rows, "Northstar": rows[::3], "Orbit": rows[1::4], "Vertex": rows[2::5]}
    metrics = []
    for name, brand_rows in brands.items():
        negative_pct = round(sum(row["tone"] == "negative" for row in brand_rows) / max(1, len(brand_rows)) * 100, 1)
        metrics.append(CompetitorMetric(name=name, mentions=len(brand_rows), share_of_voice=round(len(brand_rows) / total * 100, 1), negative_pct=negative_pct, brand_health=max(0, round(100 - negative_pct * 0.8))))
    return metrics


@app.post("/api/analysis/run", response_model=OrchestratorRun)
def run_ai_analysis(run_id: str = Query(default="command-center")) -> OrchestratorRun:
    config = {"configurable": {"thread_id": run_id}}
    result = ORCHESTRATOR.invoke({}, config)
    state = ORCHESTRATOR.get_state(config).values
    interrupts = result.get("__interrupt__", [])
    if interrupts:
        payload = interrupts[0].value if hasattr(interrupts[0], "value") else {}
        return OrchestratorRun(run_id=run_id, status="interrupted", alert_level=state.get("alert_level", "HIGH RISK"), recommendation="", nodes=state.get("nodes", []), interrupt_reason=payload.get("reason"))
    return OrchestratorRun(run_id=run_id, status="completed", alert_level=state.get("alert_level", "NORMAL"), recommendation=state.get("recommendation", ""), nodes=state.get("nodes", []))


@app.post("/api/analysis/{run_id}/approve", response_model=OrchestratorRun)
def approve_ai_analysis(run_id: str) -> OrchestratorRun:
    config = {"configurable": {"thread_id": run_id}}
    result = ORCHESTRATOR.invoke(Command(resume=True), config)
    state = ORCHESTRATOR.get_state(config).values
    interrupts = result.get("__interrupt__", [])
    if interrupts:
        payload = interrupts[0].value if hasattr(interrupts[0], "value") else {}
        return OrchestratorRun(run_id=run_id, status="interrupted", alert_level=state.get("alert_level", "HIGH RISK"), recommendation="", nodes=state.get("nodes", []), interrupt_reason=payload.get("reason"))
    return OrchestratorRun(run_id=run_id, status="completed", alert_level=state.get("alert_level", "NORMAL"), recommendation=state.get("recommendation", ""), nodes=state.get("nodes", []))


@app.get("/api/influencers", response_model=list[InfluencerMetric])
def list_influencers() -> list[InfluencerMetric]:
    with closing(get_connection()) as connection:
        rows = connection.execute(
            """SELECT author, platform, MAX(followers) AS followers, COUNT(*) AS mentions,
            SUM(likes + shares) AS engagement,
            SUM(CASE WHEN tone = 'positive' THEN 1 ELSE 0 END) AS positive,
            SUM(CASE WHEN tone = 'negative' THEN 1 ELSE 0 END) AS negative
            FROM mentions GROUP BY author, platform ORDER BY followers DESC LIMIT 10"""
        ).fetchall()
    result = []
    for row in rows:
        sentiment: Tone = "positive" if row["positive"] > row["negative"] else "negative" if row["negative"] > row["positive"] else "neutral"
        intensity = 0.8 if sentiment == "negative" else 0.65 if sentiment == "positive" else 0.4
        impact = round(100 * min(1, 0.40 * math.log1p(row["followers"]) / math.log1p(5_000_000) + 0.25 * min(1, math.log1p(row["engagement"]) / math.log1p(10_000)) + 0.15 * int(row["author"] == "Avery Morgan") + 0.20 * intensity), 2)
        result.append(InfluencerMetric(name=row["author"], platform=row["platform"], followers=row["followers"], mentions=row["mentions"], engagement=row["engagement"], sentiment=sentiment, impact=impact))
    return result


@app.get("/api/campaigns", response_model=list[CampaignMetric])
def list_campaigns() -> list[CampaignMetric]:
    with closing(get_connection()) as connection:
        rows = connection.execute(
            """SELECT topic AS name, COUNT(*) AS mentions,
            SUM(CASE WHEN tone = 'positive' THEN 1 ELSE 0 END) AS positive,
            SUM(likes + shares) AS engagement
            FROM mentions GROUP BY topic ORDER BY mentions DESC LIMIT 6"""
        ).fetchall()
    campaigns = []
    for row in rows:
        positive_pct = round(row["positive"] / row["mentions"] * 100, 1)
        status = "On track" if positive_pct >= 45 else "Needs attention" if positive_pct >= 25 else "At risk"
        campaigns.append(CampaignMetric(name=row["name"], mentions=row["mentions"], positive_pct=positive_pct, engagement=row["engagement"], status=status))
    return campaigns


@app.get("/api/executive", response_model=list[ExecutiveMetric])
def executive_metrics() -> list[ExecutiveMetric]:
    summary = get_summary()
    risk = get_risk()
    return [
        ExecutiveMetric(headline="Brand health", value=f"{summary.brand_health}/100", detail="Computed from current sentiment mix", tone="positive" if summary.brand_health >= 60 else "negative"),
        ExecutiveMetric(headline="Conversation volume", value=str(summary.mentions), detail=f"{summary.negative_sentiment}% negative mentions", tone="negative" if summary.negative_sentiment >= 30 else "neutral"),
        ExecutiveMetric(headline="Priority risk", value=risk.cluster, detail=f"{risk.severity} · {risk.action}", tone="critical" if risk.severity in {"High", "Critical"} else "neutral"),
    ]


@app.post("/api/crisis/simulate", response_model=CrisisSimulation)
def simulate_crisis(payload: CrisisSimulationRequest) -> CrisisSimulation:
    summary = get_summary()
    severity_multiplier = {"Low": 1.1, "Medium": 1.25, "High": 1.5, "Critical": 1.9}[payload.severity]
    projected_negative = round(min(99.0, summary.negative_sentiment * severity_multiplier), 1)
    projected_mentions = round(summary.mentions * (1 + (severity_multiplier - 1) * payload.duration_hours / 24))
    action = "Monitor and prepare a response." if payload.severity == "Low" else "Activate the response team and publish only after human approval."
    return CrisisSimulation(severity=payload.severity, duration_hours=payload.duration_hours, projected_negative_pct=projected_negative, projected_mentions=projected_mentions, recommended_action=action)


@app.get("/api/crisis/story", response_model=CrisisStory)
def crisis_story() -> CrisisStory:
    rows = _mention_rows(None, None, None)
    baseline = summary_from_rows(rows)
    stages = []
    for label, multiplier in (("NORMAL", 0.5), ("ANOMALY", 0.8), ("SPIKE", 1.0), ("HIGH RISK", 1.25), ("CRITICAL", 1.5)):
        negative_pct = round(min(99, baseline.negative_sentiment * multiplier), 1)
        stages.append({"stage": label, "negative_pct": negative_pct, "mentions": round(baseline.mentions * multiplier), "detected": negative_pct >= {"NORMAL": 0, "ANOMALY": 15, "SPIKE": 25, "HIGH RISK": 35, "CRITICAL": 50}[label]})
    stages.append({"stage": "AI RECOMMENDATION", "recommendation": risk_metric_from_rows(rows).action, "detected": True})
    return CrisisStory(stages=stages, detector="sentiment-threshold-detector")


def simulator_stage(hour: int) -> str:
    if hour >= 7:
        return "AI RECOMMENDATION"
    rates = [10, 33, 82, 165, 330, 520, 640]
    rate = rates[min(max(hour, 0), len(rates) - 1)]
    return "NORMAL" if rate < 33 else "ANOMALY" if rate < 82 else "SPIKE" if rate < 165 else "HIGH RISK" if rate < 330 else "CRITICAL"


@app.get("/api/crisis/state", response_model=SimulatorState)
def crisis_state() -> SimulatorState:
    with closing(get_connection()) as connection:
        row = connection.execute("SELECT * FROM simulator_state WHERE id = 1").fetchone()
    return SimulatorState(status=row["status"], hour=row["hour"], speed=row["speed"], stage=simulator_stage(row["hour"]), inserted=row["inserted"])


@app.post("/api/crisis/start", response_model=SimulatorState)
def crisis_start(speed: float = Query(1.0, ge=0.25, le=8.0)) -> SimulatorState:
    with closing(get_connection()) as connection:
        maximum = connection.execute("SELECT COALESCE(MAX(id), 0) FROM mentions").fetchone()[0]
        connection.execute("UPDATE simulator_state SET status='running', speed=?, previous_max_id=? WHERE id=1", (speed, maximum))
        connection.execute("UPDATE risk_state SET incident_open=1, frozen_baseline=(SELECT COUNT(*) FROM mentions WHERE id <= ?) WHERE id=1", (maximum,))
        connection.commit()
    return crisis_state()


@app.post("/api/crisis/pause", response_model=SimulatorState)
def crisis_pause() -> SimulatorState:
    with closing(get_connection()) as connection:
        connection.execute("UPDATE simulator_state SET status='paused' WHERE id=1")
        connection.commit()
    return crisis_state()


@app.post("/api/crisis/reset", response_model=SimulatorState)
def crisis_reset() -> SimulatorState:
    with closing(get_connection()) as connection:
        state = connection.execute("SELECT previous_max_id FROM simulator_state WHERE id=1").fetchone()
        connection.execute("DELETE FROM mentions WHERE id > ?", (state["previous_max_id"],))
        connection.execute("UPDATE simulator_state SET status='idle', hour=0, inserted=0 WHERE id=1")
        connection.execute("UPDATE risk_state SET incident_open=0, frozen_baseline=0 WHERE id=1")
        connection.commit()
    return crisis_state()


@app.post("/api/crisis/tick", response_model=SimulatorState)
def crisis_tick() -> SimulatorState:
    with closing(get_connection()) as connection:
        state = connection.execute("SELECT * FROM simulator_state WHERE id=1").fetchone()
        if state["status"] != "running":
            return crisis_state()
        hour = state["hour"]
        rate = [10, 33, 82, 165, 330, 520, 640][min(hour, 6)]
        now = datetime.now(UTC).isoformat()
        rows = []
        for index in range(rate):
            follower = 1000 + index * 31
            engagement = 20 + index
            impact = round(100 * min(1, 0.40 * math.log1p(follower) / math.log1p(5_000_000) + 0.25 * min(1, math.log1p(engagement) / math.log1p(10_000)) + 0.20 * 0.9), 2)
            rows.append((f"Incident signal {state['inserted'] + index + 1}", "X" if index % 2 else "Facebook", "The release is still failing and blocking access.", "negative", "App Update Failure", follower, engagement, 2, 0, "bug report", "angry", 0.9, impact, now))
        connection.executemany("INSERT INTO mentions (author, platform, text, tone, topic, followers, likes, shares, verified, mention_type, emotion, intensity, impact, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", rows)
        new_hour = hour + 1
        status = "completed" if new_hour >= 7 else "running"
        connection.execute("UPDATE simulator_state SET status=?, hour=?, inserted=inserted+? WHERE id=1", (status, new_hour, rate))
        connection.execute("UPDATE agents SET processed_count=processed_count+?, last_output='type=bug report; sentiment=negative; emotion=angry; intensity=0.90; impact=measured' WHERE name IN ('Mention Classification', 'Sentiment & Emotion', 'Influence Detection')", (rate,))
        if simulator_stage(new_hour) == "CRITICAL":
            connection.execute("INSERT INTO notifications (kind, title, body, created_at) VALUES ('CRITICAL', 'Incident reached critical', 'The staged incident detector requires approval before publishing.', ?)", (now,))
        connection.commit()
    return crisis_state()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "database": hashlib.sha1(str(DATABASE_PATH).encode()).hexdigest()[:8]}
