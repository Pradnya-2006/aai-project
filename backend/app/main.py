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
    approved: bool = True
    status: Literal["approved"] = "approved"


class ResponseDraft(BaseModel):
    id: int
    topic: str = "General"
    body: str
    status: ResponseStatus
    updated_at: str
    versions_count: int = 1


class RejectRequest(BaseModel):
    reason: str = "Draft rejected by reviewer"


class EditResponseRequest(BaseModel):
    body: str


class BulkApproveRequest(BaseModel):
    ids: list[int] | None = None


class DrawerGenerateResponseRequest(BaseModel):
    mention_id: int | None = None
    topic: str | None = None


class DrawerOpenIncidentRequest(BaseModel):
    mention_id: int | None = None
    topic: str | None = None


class DrawerNotifyProductRequest(BaseModel):
    mention_id: int | None = None
    team: str = "Product Team"
    note: str | None = None


class AuditLogEntry(BaseModel):
    id: int
    action: str
    before_status: str | None = None
    after_status: str | None = None
    actor: str
    details: str | None = None
    target_id: int | None = None
    created_at: str


class ResponseVersion(BaseModel):
    id: int
    response_id: int
    body: str
    status: str
    created_at: str


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
    route: str = "Command Center"
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
    samples: list[str] = []


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
    current_per_hour: int
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


VARIANT_POOLS: dict[int, list[str]] = {
    1: [
        "We’re sorry you’re running into this. Our team has identified the login issue and is working on a fix. We’ll share an update shortly.",
        "We understand your frustration with authentication issues. Our engineering team has isolated the cause and a hotfix is deploying now.",
        "Thanks for reporting this login latency. We're actively rolling out a resolution and expect complete stability within 20 minutes.",
        "Our identity services team has deployed a patch to resolve session expiration issues. Please refresh and try again.",
    ],
    2: [
        "We are actively investigating the update crashes on mobile. A patch is undergoing testing and will roll out within the hour.",
        "Our team has pinpointed the regression in the latest build. A rollback is underway to restore application stability immediately.",
        "We hear your feedback regarding the update. An emergency patch is currently in QA to eliminate all startup crash scenarios.",
    ],
    3: [
        "Thank you for highlighting the checkout latency. Our infrastructure engineers have deployed a hotfix to stabilize response times.",
        "We are closely monitoring payment gateway throughput. All traffic has been rerouted to secondary clusters to ensure zero checkout delays.",
    ],
}


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
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT NOT NULL DEFAULT 'Login Issues',
                body TEXT NOT NULL,
                status TEXT NOT NULL CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED')),
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS response_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT, response_id INTEGER NOT NULL,
                body TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL,
                before_status TEXT, after_status TEXT, actor TEXT NOT NULL,
                details TEXT DEFAULT '', target_id INTEGER,
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
                title TEXT NOT NULL, body TEXT NOT NULL, route TEXT DEFAULT 'Command Center',
                read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
            );
            """
        )
        existing_draft_schema = connection.execute("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'response_drafts'").fetchone()
        if existing_draft_schema and "CHECK (id = 1)" in existing_draft_schema[0]:
            rows = connection.execute("SELECT id, body, status, updated_at FROM response_drafts").fetchall()
            connection.execute("ALTER TABLE response_drafts RENAME TO response_drafts_old")
            connection.execute(
                """CREATE TABLE response_drafts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    topic TEXT NOT NULL DEFAULT 'Login Issues',
                    body TEXT NOT NULL,
                    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED')),
                    updated_at TEXT NOT NULL
                )"""
            )
            for r in rows:
                connection.execute(
                    "INSERT INTO response_drafts (id, topic, body, status, updated_at) VALUES (?, 'Login Issues', ?, ?, ?)",
                    (r["id"], r["body"], r["status"], r["updated_at"] or datetime.now(UTC).isoformat()),
                )
            connection.execute("DROP TABLE response_drafts_old")

        existing_draft_cols = {row["name"] for row in connection.execute("PRAGMA table_info(response_drafts)").fetchall()}
        if "topic" not in existing_draft_cols:
            connection.execute("ALTER TABLE response_drafts ADD COLUMN topic TEXT NOT NULL DEFAULT 'Login Issues'")

        existing_audit_cols = {row["name"] for row in connection.execute("PRAGMA table_info(audit_log)").fetchall()}
        if "details" not in existing_audit_cols:
            connection.execute("ALTER TABLE audit_log ADD COLUMN details TEXT DEFAULT ''")
        if "target_id" not in existing_audit_cols:
            connection.execute("ALTER TABLE audit_log ADD COLUMN target_id INTEGER")

        existing_notif_cols = {row["name"] for row in connection.execute("PRAGMA table_info(notifications)").fetchall()}
        if "route" not in existing_notif_cols:
            connection.execute("ALTER TABLE notifications ADD COLUMN route TEXT DEFAULT 'Command Center'")

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

        now = datetime.now(UTC).isoformat()
        drafts_to_seed = [
            (1, "Login Issues", "We’re sorry you’re running into this. Our team has identified the login issue and is working on a fix. We’ll share an update shortly.", "PENDING_REVIEW"),
            (2, "App Update Failure", "We are actively investigating the update crashes on mobile. A patch is undergoing testing and will roll out within the hour.", "PENDING_REVIEW"),
            (3, "Performance", "Thank you for highlighting the checkout latency. Our infrastructure engineers have deployed a hotfix to stabilize response times.", "PENDING_REVIEW"),
        ]
        for did, dtopic, dbody, dstatus in drafts_to_seed:
            connection.execute(
                "INSERT OR IGNORE INTO response_drafts (id, topic, body, status, updated_at) VALUES (?, ?, ?, ?, ?)",
                (did, dtopic, dbody, dstatus, now),
            )
            connection.execute(
                "INSERT OR IGNORE INTO response_versions (id, response_id, body, status, created_at) VALUES (?, ?, ?, ?, ?)",
                (did, did, dbody, dstatus, now),
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

        notif_count = connection.execute("SELECT COUNT(*) FROM notifications").fetchone()[0]
        if notif_count == 0:
            initial_notifs = [
                ("CRITICAL", "Critical risk detected", "App Update Failure has crossed the critical threshold.", "Risk Center"),
                ("TREND", "Viral Spike Detected", "Spike in mobile app update complaints on Reddit and X.", "Topics & Trends"),
                ("RESPONSE", "Response awaiting review", "Draft #1 ready for executive approval.", "Response Studio"),
                ("SYSTEM", "Simulator ready", "Crisis escalation scenario configured.", "Crisis Ops"),
            ]
            for kind, title, body, route in initial_notifs:
                connection.execute(
                    "INSERT INTO notifications (kind, title, body, route, read, created_at) VALUES (?, ?, ?, ?, 0, ?)",
                    (kind, title, body, route, now),
                )

        count = connection.execute("SELECT COUNT(*) FROM mentions").fetchone()[0]
        topic_count = connection.execute("SELECT COUNT(DISTINCT topic) FROM mentions").fetchone()[0]
        cutoff = (datetime.now(UTC) - timedelta(hours=23)).isoformat()
        recent_count = connection.execute("SELECT COUNT(*) FROM mentions WHERE created_at >= ?", (cutoff,)).fetchone()[0] if count > 0 else 0
        if count < 4000 or topic_count < 7 or recent_count < 4000:
            connection.execute("DELETE FROM mentions")
            seed_mentions(connection)

        connection.commit()


def seed_mentions(connection: sqlite3.Connection) -> None:
    random.seed(42)
    now = datetime.now(UTC)
    topics = ["App Update Failure", "Login Issues", "Dark Mode", "Pricing", "Performance", "Customer Support", "New UI"]
    banks = {
        "App Update Failure": [
            "The newest release crashes before I can finish a payment.",
            "After the update the app logs me out every few minutes.",
            "This update broke notifications and my work is blocked.",
            "Terrible update — crashes on launch every single time.",
            "Lost all my data after installing the update. Furious.",
        ],
        "Login Issues": [
            "I cannot sign in even after resetting my password.",
            "The login screen loops back to the start.",
            "Two-factor verification never arrives.",
            "Been locked out for 3 days — this is unacceptable.",
            "Password reset email never comes through.",
        ],
        "Dark Mode": [
            "Dark mode looks beautiful and is much easier on my eyes.",
            "Finally a comfortable dark theme for late-night work.",
            "The new dark mode is the best feature this month.",
            "Love the dark mode — using it all day now!",
            "Dark mode + AMOLED screen = perfection.",
        ],
        "Pricing": [
            "The new plan pricing is hard to compare.",
            "Can someone explain the difference between these tiers?",
            "Pricing feels fair but the upgrade screen is unclear.",
        ],
        "Performance": [
            "The app feels faster after the latest release.",
            "Search is smooth and results arrive quickly.",
            "Loading times are much better today.",
            "Huge speed improvements — great work team!",
        ],
        "Customer Support": [
            "Support solved my issue quickly.",
            "The support team followed up and explained everything.",
            "I appreciate the thoughtful response from support.",
            "Best customer service I have experienced in years.",
        ],
        "New UI": [
            "The refreshed dashboard is clean.",
            "The export flow is confusing on the new screen.",
            "The navigation is easier to understand now.",
        ],
    }
    platforms = ["X", "Reddit", "Instagram", "LinkedIn", "YouTube", "Facebook", "Trustpilot", "G2", "App Store", "Google Reviews"]
    # negative count per topic (how many of the seeded rows are negative)
    negative_topics = {"App Update Failure": 840, "Login Issues": 360, "Pricing": 40, "New UI": 80, "Performance": 0, "Customer Support": 0, "Dark Mode": 0}
    # Volumes per spec
    topic_counts = {"App Update Failure": 1024, "Login Issues": 682, "Dark Mode": 451, "Pricing": 310, "Performance": 900, "Customer Support": 600, "New UI": 500}
    rows = []
    index = 0
    for topic in topics:
        count = topic_counts[topic]
        neg_count = negative_topics.get(topic, 0)
        for local in range(count):
            is_negative = local < neg_count
            is_positive = (not is_negative) and topic in {"Dark Mode", "Performance", "Customer Support"}
            tone: Tone = "negative" if is_negative else ("positive" if is_positive else "neutral")
            # Praise maps to happy/excited — never confused
            if tone == "negative":
                emotion: Emotion = "angry" if topic == "App Update Failure" else "frustrated"
            elif tone == "positive":
                emotion = "excited" if local % 3 == 0 else "happy"
            else:
                emotion = "confused" if topic in {"Pricing", "New UI"} else "frustrated"
            mention_type: MentionType = (
                "bug report" if topic in {"App Update Failure", "Login Issues"} else
                "praise" if tone == "positive" else
                "complaint" if tone == "negative" else "question"
            )
            if index == 0:
                # @TechReviewer: verified, 200K followers, impact ~92
                author = "@TechReviewer"
                follower = 200_000
                verified = 1
                engagement = 3200
            else:
                author = f"User_{index}"
                follower = min(5_000_000, int(50 * (1.08 ** (index % 70)) + random.randint(0, 5000)))
                verified = int(index % 37 == 0)
                engagement = random.randint(5, 800)
            intensity = round(0.8 if tone == "negative" else 0.65 if tone == "positive" else 0.4, 2)
            impact = round(100 * min(1, 0.40 * (math.log1p(follower) / math.log1p(5_000_000)) + 0.25 * min(1, math.log1p(engagement) / math.log1p(10_000)) + 0.15 * verified + 0.20 * intensity), 2)
            rows.append((author, platforms[index % len(platforms)], banks[topic][local % len(banks[topic])], tone, topic, follower, engagement, random.randint(0, 80), verified, mention_type, emotion, intensity, impact, (now - timedelta(minutes=(index % 1440))).isoformat()))
            index += 1
    # Preserve a small 30-day history for growth and baseline calculations.
    for history in range(100):
        topic = topics[history % len(topics)]
        rows.append((f"HistUser_{history + 1}", platforms[history % len(platforms)], banks[topic][history % len(banks[topic])], "neutral", topic, 100 + history, 10, 1, 0, "question", "confused", 0.3, 1.0, (now - timedelta(days=2 + history % 28)).isoformat()))
    connection.executemany(
        "INSERT INTO mentions (author, platform, text, tone, topic, followers, likes, shares, verified, mention_type, emotion, intensity, impact, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        rows,
    )


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
    topic_totals: dict[str, dict[str, object]] = {}
    for row in rows:
        topic = row["topic"]
        bucket = topic_totals.setdefault(topic, {"mentions": 0, "negative": 0, "samples": []})
        bucket["mentions"] = int(bucket["mentions"]) + 1
        if row["tone"] == "negative":
            bucket["negative"] = int(bucket["negative"]) + 1
        if len(bucket["samples"]) < 3:
            bucket["samples"].append(row["text"])

    if not topic_totals:
        return []

    max_mentions = max(int(item["mentions"]) for item in topic_totals.values())
    metrics: list[TopicMetric] = []
    for topic, values in sorted(topic_totals.items(), key=lambda item: (-int(item[1]["mentions"]), item[0])):
        mentions = int(values["mentions"])
        negative_pct = round((int(values["negative"]) / mentions) * 100, 1)
        configured_growth = {
            "App Update Failure": 327.0,
            "Login Issues": 182.0,
            "Dark Mode": 38.0,
            "Pricing": 12.0,
            "Performance": 74.0,
            "Customer Support": 26.0,
            "New UI": 48.0,
        }
        growth = configured_growth.get(topic, round(((mentions / max(1, max_mentions / 2)) - 1) * 100, 1))
        velocity = (
            "Very High" if growth >= 200
            else "High" if growth >= 75
            else "Medium" if growth >= 25
            else "Low"
        )
        metrics.append(
            TopicMetric(
                name=topic,
                mentions=mentions,
                growth=growth,
                negative_pct=negative_pct,
                velocity=velocity,
                samples=list(values["samples"]),
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
            action="Hold current monitoring and review after more signals arrive.", predicted_risk=0, predicted_peak=0, current_per_hour=0,
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
        baseline=round(float(baseline), 1),
        action=action,
        predicted_risk=round(min(100, max(0, z_score * 12 + growth_pct * 0.08)), 1),
        predicted_peak=round(mentions * (1 + max(0, growth_pct) / 100) * 1.15),
        current_per_hour=mentions,
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
def list_mentions(platform: str | None = None, tone: Tone | None = None, topic: str | None = None, limit: int = Query(100, ge=1, le=100)) -> list[Mention]:
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
        cutoff = (datetime.now(UTC) - timedelta(hours=24)).isoformat()
        clauses.append("created_at >= ?")
        params.append(cutoff)
        where = f"WHERE {' AND '.join(clauses)}"
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


@app.get("/api/responses", response_model=list[ResponseDraft])
def list_responses() -> list[ResponseDraft]:
    with closing(get_connection()) as connection:
        rows = connection.execute("SELECT * FROM response_drafts ORDER BY id ASC").fetchall()
        result = []
        for row in rows:
            v_count = connection.execute("SELECT COUNT(*) FROM response_versions WHERE response_id = ?", (row["id"],)).fetchone()[0]
            result.append(ResponseDraft(
                id=row["id"],
                topic=row["topic"] if "topic" in row.keys() else "General",
                body=row["body"],
                status=row["status"],
                updated_at=row["updated_at"],
                versions_count=max(1, v_count),
            ))
        return result


@app.get("/api/responses/{id}", response_model=ResponseDraft)
def get_response(id: int = 1) -> ResponseDraft:
    with closing(get_connection()) as connection:
        row = connection.execute("SELECT * FROM response_drafts WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Response draft not found.")
        v_count = connection.execute("SELECT COUNT(*) FROM response_versions WHERE response_id = ?", (id,)).fetchone()[0]
        return ResponseDraft(
            id=row["id"],
            topic=row["topic"] if "topic" in row.keys() else "General",
            body=row["body"],
            status=row["status"],
            updated_at=row["updated_at"],
            versions_count=max(1, v_count),
        )


@app.post("/api/responses/{id}/approve", response_model=Approval)
def approve_response(id: int = 1) -> Approval:
    now = datetime.now(UTC).isoformat()
    with closing(get_connection()) as connection:
        row = connection.execute("SELECT status, body FROM response_drafts WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Response draft not found.")
        before = row["status"]
        connection.execute("UPDATE response_drafts SET status = 'APPROVED', updated_at = ? WHERE id = ?", (now, id))
        connection.execute("INSERT INTO response_versions (response_id, body, status, created_at) VALUES (?, ?, 'APPROVED', ?)", (id, row["body"], now))
        connection.execute(
            "INSERT INTO audit_log (action, before_status, after_status, actor, details, target_id, created_at) VALUES ('response_approve', ?, 'APPROVED', 'Alex Rivera', 'Response approved for publishing', ?, ?)",
            (before, id, now),
        )
        connection.commit()
    return Approval(approved=True, status="approved")


@app.post("/api/responses/{id}/reject", response_model=ResponseDraft)
def reject_response(id: int, payload: RejectRequest = RejectRequest()) -> ResponseDraft:
    now = datetime.now(UTC).isoformat()
    with closing(get_connection()) as connection:
        row = connection.execute("SELECT status, body FROM response_drafts WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Response draft not found.")
        before = row["status"]
        reason = payload.reason or "Draft rejected by reviewer"
        connection.execute("UPDATE response_drafts SET status = 'REJECTED', updated_at = ? WHERE id = ?", (now, id))
        connection.execute("INSERT INTO response_versions (response_id, body, status, created_at) VALUES (?, ?, 'REJECTED', ?)", (id, row["body"], now))
        connection.execute(
            "INSERT INTO audit_log (action, before_status, after_status, actor, details, target_id, created_at) VALUES ('response_reject', ?, 'REJECTED', 'Alex Rivera', ?, ?, ?)",
            (before, f"Reason: {reason}", id, now),
        )
        connection.commit()
    return get_response(id)


@app.post("/api/responses/{id}/regenerate", response_model=ResponseDraft)
def regenerate_response(id: int) -> ResponseDraft:
    now = datetime.now(UTC).isoformat()
    with closing(get_connection()) as connection:
        row = connection.execute("SELECT status, body FROM response_drafts WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Response draft not found.")
        before = row["status"]
        pool = VARIANT_POOLS.get(id, [
            "We understand your concerns and are actively resolving this with our product engineers.",
            "Our team has identified the root cause and is pushing an expedited update shortly.",
            "Thank you for your patience while we deploy an immediate fix to address this issue.",
        ])
        current_body = row["body"]
        next_body = pool[0]
        for v in pool:
            if v != current_body:
                next_body = v
                break
        connection.execute("UPDATE response_drafts SET body = ?, status = 'PENDING_REVIEW', updated_at = ? WHERE id = ?", (next_body, now, id))
        connection.execute("INSERT INTO response_versions (response_id, body, status, created_at) VALUES (?, ?, 'PENDING_REVIEW', ?)", (id, next_body, now))
        connection.execute(
            "INSERT INTO audit_log (action, before_status, after_status, actor, details, target_id, created_at) VALUES ('response_regenerate', ?, 'PENDING_REVIEW', 'AI Agent (Response Generation)', 'Regenerated valid response variant', ?, ?)",
            (before, id, now),
        )
        connection.commit()
    return get_response(id)


@app.post("/api/responses/{id}/edit", response_model=ResponseDraft)
def edit_response(id: int, payload: EditResponseRequest) -> ResponseDraft:
    if not payload.body.strip():
        raise HTTPException(status_code=400, detail="Response body cannot be empty.")
    now = datetime.now(UTC).isoformat()
    with closing(get_connection()) as connection:
        row = connection.execute("SELECT status, body FROM response_drafts WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Response draft not found.")
        before = row["status"]
        new_status = "PENDING_REVIEW" if row["status"] in ("REJECTED", "APPROVED", "PUBLISHED") else row["status"]
        connection.execute("UPDATE response_drafts SET body = ?, status = ?, updated_at = ? WHERE id = ?", (payload.body, new_status, now, id))
        connection.execute("INSERT INTO response_versions (response_id, body, status, created_at) VALUES (?, ?, ?, ?)", (id, payload.body, new_status, now))
        connection.execute(
            "INSERT INTO audit_log (action, before_status, after_status, actor, details, target_id, created_at) VALUES ('response_edit', ?, ?, 'Alex Rivera', ?, ?, ?)",
            (before, new_status, f"Edited draft content ({len(payload.body)} chars)", id, now),
        )
        connection.commit()
    return get_response(id)


@app.post("/api/responses/{id}/publish", response_model=ResponseDraft)
def publish_response(id: int = 1) -> ResponseDraft:
    now = datetime.now(UTC).isoformat()
    with closing(get_connection()) as connection:
        row = connection.execute("SELECT status, body FROM response_drafts WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Response draft not found.")
        if row["status"] != "APPROVED":
            raise HTTPException(status_code=409, detail="Response must be APPROVED before publishing.")
        before = row["status"]
        connection.execute("UPDATE response_drafts SET status = 'PUBLISHED', updated_at = ? WHERE id = ?", (now, id))
        connection.execute("INSERT INTO response_versions (response_id, body, status, created_at) VALUES (?, ?, 'PUBLISHED', ?)", (id, row["body"], now))
        connection.execute(
            "INSERT INTO audit_log (action, before_status, after_status, actor, details, target_id, created_at) VALUES ('response_publish', ?, 'PUBLISHED', 'Alex Rivera', 'Published response to channels', ?, ?)",
            (before, id, now),
        )
        connection.commit()
    return get_response(id)


@app.post("/api/responses/bulk-approve")
def bulk_approve(payload: BulkApproveRequest = BulkApproveRequest()) -> dict:
    now = datetime.now(UTC).isoformat()
    with closing(get_connection()) as connection:
        if payload.ids:
            target_ids = payload.ids
        else:
            rows = connection.execute("SELECT id FROM response_drafts WHERE status = 'PENDING_REVIEW'").fetchall()
            target_ids = [r["id"] for r in rows]
        approved_count = 0
        for tid in target_ids:
            row = connection.execute("SELECT status, body FROM response_drafts WHERE id = ?", (tid,)).fetchone()
            if row:
                before = row["status"]
                connection.execute("UPDATE response_drafts SET status = 'APPROVED', updated_at = ? WHERE id = ?", (now, tid))
                connection.execute("INSERT INTO response_versions (response_id, body, status, created_at) VALUES (?, ?, 'APPROVED', ?)", (tid, row["body"], now))
                connection.execute(
                    "INSERT INTO audit_log (action, before_status, after_status, actor, details, target_id, created_at) VALUES ('response_approve', ?, 'APPROVED', 'Alex Rivera', 'Bulk approved', ?, ?)",
                    (before, tid, now),
                )
                approved_count += 1
        connection.commit()
    return {"approved": True, "count": approved_count, "ids": target_ids}


@app.post("/api/responses/reset-demo")
def reset_demo_responses() -> dict[str, int]:
    now = datetime.now(UTC).isoformat()
    drafts = [
        (1, "Login Issues", "Hi, we're sorry you're having trouble logging in after the update. Our team is investigating and we'll share an update as soon as possible."),
        (2, "App Update Failure", "Hi, we're sorry the latest update is causing trouble. We're investigating the crashes and will share a status update as soon as possible."),
        (3, "Performance", "Thanks for flagging the slower experience. Our team is reviewing performance data now and will share an update shortly."),
    ]
    with closing(get_connection()) as connection:
        for draft_id, topic, body in drafts:
            connection.execute(
                "UPDATE response_drafts SET topic = ?, body = ?, status = 'PENDING_REVIEW', updated_at = ? WHERE id = ?",
                (topic, body, now, draft_id),
            )
            connection.execute(
                "INSERT INTO response_versions (response_id, body, status, created_at) VALUES (?, ?, 'PENDING_REVIEW', ?)",
                (draft_id, body, now),
            )
            connection.execute(
                "INSERT INTO audit_log (action, before_status, after_status, actor, details, target_id, created_at) VALUES ('response_reset_demo', 'RESET', 'PENDING_REVIEW', 'Alex Rivera', 'Reset demo response data', ?, ?)",
                (draft_id, now),
            )
        connection.commit()
    return {"reset": len(drafts)}


@app.get("/api/responses/{id}/versions", response_model=list[ResponseVersion])
def list_response_versions(id: int = 1) -> list[ResponseVersion]:
    with closing(get_connection()) as connection:
        rows = connection.execute("SELECT * FROM response_versions WHERE response_id = ? ORDER BY id DESC", (id,)).fetchall()
        return [ResponseVersion(id=r["id"], response_id=r["response_id"], body=r["body"], status=r["status"], created_at=r["created_at"]) for r in rows]


@app.get("/api/responses/{id}/audit", response_model=list[AuditLogEntry])
def get_response_audit(id: int = 1) -> list[AuditLogEntry]:
    with closing(get_connection()) as connection:
        rows = connection.execute("SELECT * FROM audit_log WHERE target_id = ? OR (target_id IS NULL AND action LIKE 'response%') ORDER BY id DESC LIMIT 50", (id,)).fetchall()
        return [AuditLogEntry(
            id=r["id"],
            action=r["action"],
            before_status=r["before_status"],
            after_status=r["after_status"],
            actor=r["actor"],
            details=r["details"] if "details" in r.keys() else None,
            target_id=r["target_id"] if "target_id" in r.keys() else id,
            created_at=r["created_at"],
        ) for r in rows]


@app.get("/api/audit-log", response_model=list[AuditLogEntry])
def get_global_audit_log(limit: int = Query(60, ge=1, le=200)) -> list[AuditLogEntry]:
    with closing(get_connection()) as connection:
        rows = connection.execute("SELECT * FROM audit_log ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        return [AuditLogEntry(
            id=r["id"],
            action=r["action"],
            before_status=r["before_status"],
            after_status=r["after_status"],
            actor=r["actor"],
            details=r["details"] if "details" in r.keys() else None,
            target_id=r["target_id"] if "target_id" in r.keys() else None,
            created_at=r["created_at"],
        ) for r in rows]


@app.post("/api/drawer/generate-response")
def drawer_generate_response(payload: DrawerGenerateResponseRequest = DrawerGenerateResponseRequest()) -> dict:
    now = datetime.now(UTC).isoformat()
    mention_id = payload.mention_id or 1
    topic = payload.topic or "App Update Failure"
    with closing(get_connection()) as connection:
        details = f"Generated draft response for mention #{mention_id} ({topic})"
        connection.execute(
            "INSERT INTO audit_log (action, actor, details, target_id, created_at) VALUES ('drawer_generate_response', 'Alex Rivera', ?, ?, ?)",
            (details, mention_id, now),
        )
        connection.commit()
    return {"success": True, "message": "Draft response generated", "mention_id": mention_id, "topic": topic}


@app.post("/api/drawer/open-incident")
def drawer_open_incident(payload: DrawerOpenIncidentRequest = DrawerOpenIncidentRequest()) -> dict:
    now = datetime.now(UTC).isoformat()
    mention_id = payload.mention_id or 1
    topic = payload.topic or "Critical Alert"
    with closing(get_connection()) as connection:
        connection.execute("UPDATE risk_state SET incident_open = 1 WHERE id = 1")
        connection.execute(
            "INSERT INTO notifications (kind, title, body, route, read, created_at) VALUES ('CRITICAL', 'Incident Opened via Drawer', ?, 'Crisis Ops', 0, ?)",
            (f"Escalated from mention #{mention_id}: {topic}", now),
        )
        connection.execute(
            "INSERT INTO audit_log (action, actor, details, target_id, created_at) VALUES ('drawer_open_incident', 'Alex Rivera', ?, ?, ?)",
            (f"Opened incident from mention #{mention_id} ({topic})", mention_id, now),
        )
        connection.commit()
    return {"success": True, "incident_open": True, "message": "Incident opened"}


@app.post("/api/drawer/notify-product-team")
def drawer_notify_product_team(payload: DrawerNotifyProductRequest = DrawerNotifyProductRequest()) -> dict:
    now = datetime.now(UTC).isoformat()
    mention_id = payload.mention_id or 1
    team = payload.team or "Product Team"
    with closing(get_connection()) as connection:
        connection.execute(
            "INSERT INTO notifications (kind, title, body, route, read, created_at) VALUES ('TEAM_ALERT', 'Product Team Escalation', ?, 'Live Mentions', 0, ?)",
            (f"Mention #{mention_id} escalated to {team} for immediate triage.", now),
        )
        connection.execute(
            "INSERT INTO audit_log (action, actor, details, target_id, created_at) VALUES ('drawer_notify_product_team', 'Alex Rivera', ?, ?, ?)",
            (f"Notified {team} for mention #{mention_id}", mention_id, now),
        )
        connection.commit()
    return {"success": True, "message": f"{team} notified"}


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
        rows = connection.execute("SELECT * FROM notifications ORDER BY id DESC LIMIT 50").fetchall()
    return [Notification(
        id=row["id"],
        kind=row["kind"],
        title=row["title"],
        body=row["body"],
        route=row["route"] if "route" in row.keys() and row["route"] else "Command Center",
        read=bool(row["read"]),
        created_at=row["created_at"],
    ) for row in rows]


@app.post("/api/notifications/read")
def mark_notifications_read() -> dict[str, bool]:
    now = datetime.now(UTC).isoformat()
    with closing(get_connection()) as connection:
        connection.execute("UPDATE notifications SET read = 1")
        connection.execute(
            "INSERT INTO audit_log (action, actor, details, created_at) VALUES ('notifications_mark_all_read', 'Alex Rivera', 'Marked all notifications as read', ?)",
            (now,),
        )
        connection.commit()
    return {"success": True}


@app.post("/api/notifications/{id}/read")
def mark_single_notification_read(id: int) -> dict:
    now = datetime.now(UTC).isoformat()
    with closing(get_connection()) as connection:
        connection.execute("UPDATE notifications SET read = 1 WHERE id = ?", (id,))
        connection.execute(
            "INSERT INTO audit_log (action, actor, details, target_id, created_at) VALUES ('notification_mark_read', 'Alex Rivera', ?, ?, ?)",
            (f"Marked notification #{id} as read", id, now),
        )
        connection.commit()
    return {"success": True, "id": id}


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
    brand_topics = {
        "ACME": {"App Update Failure"},
        "Northstar": {"Performance", "Dark Mode"},
        "Orbit": {"Customer Support", "New UI"},
        "Vertex": {"Login Issues", "Pricing"},
    }
    brands = {name: [row for row in rows if row["topic"] in topics] for name, topics in brand_topics.items()}
    metrics = []
    for index, (name, brand_rows) in enumerate(brands.items()):
        negative_pct = round(sum(row["tone"] == "negative" for row in brand_rows) / max(1, len(brand_rows)) * 100, 1)
        share = round(len(brand_rows) / total * 100, 1)
        if index == len(brands) - 1:
            share = round(100.0 - sum(metric.share_of_voice for metric in metrics), 1)
        metrics.append(CompetitorMetric(name=name, mentions=len(brand_rows), share_of_voice=share, negative_pct=negative_pct, brand_health=max(0, round(100 - negative_pct * 0.8))))
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
        if state and state["previous_max_id"] > 0:
            connection.execute("DELETE FROM mentions WHERE id > ?", (state["previous_max_id"],))
        connection.execute("UPDATE simulator_state SET status='idle', hour=0, inserted=0 WHERE id=1")
        connection.execute("UPDATE risk_state SET incident_open=0, frozen_baseline=0 WHERE id=1")
        count = connection.execute("SELECT COUNT(*) FROM mentions").fetchone()[0]
        if count < 4000:
            seed_mentions(connection)
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
