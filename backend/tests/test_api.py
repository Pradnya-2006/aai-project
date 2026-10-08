from fastapi.testclient import TestClient

from app.main import app, get_connection, simulator_stage


client = TestClient(app)


def test_mentions_and_summary_are_database_backed() -> None:
    mentions = client.get("/api/mentions")
    summary = client.get("/api/summary")

    assert mentions.status_code == 200
    assert len(mentions.json()) >= 3
    assert summary.status_code == 200
    assert summary.json()["mentions"] >= len(mentions.json())


def test_approval_is_explicit_backend_mutation() -> None:
    response = client.post("/api/responses/1/approve")

    assert response.status_code == 200
    assert response.json() == {"approved": True, "status": "approved"}


def test_topic_and_risk_metrics_are_computed() -> None:
    topics = client.get("/api/topics")
    risk = client.get("/api/risk")

    assert topics.status_code == 200
    assert len(topics.json()) >= 3
    assert all({"name", "mentions", "growth", "negative_pct", "velocity"} <= set(topic) for topic in topics.json())
    assert risk.status_code == 200
    assert risk.json()["cluster"]
    assert risk.json()["severity"] in {"Low", "Medium", "High", "Critical"}


def test_competitors_are_computed_from_mentions() -> None:
    competitors = client.get("/api/competitors")
    assert competitors.status_code == 200
    payload = competitors.json()
    assert {row["name"] for row in payload} == {"ACME", "Northstar", "Orbit", "Vertex"}
    assert round(sum(row["share_of_voice"] for row in payload), 1) > 100
    assert all(0 <= row["brand_health"] <= 100 for row in payload)


def test_langgraph_analysis_has_timing_and_interrupt_or_completion() -> None:
    result = client.post("/api/analysis/run?run_id=test-analysis")
    assert result.status_code == 200
    payload = result.json()
    assert payload["status"] in {"completed", "interrupted"}
    assert len(payload["nodes"]) >= 2
    assert all("duration_ms" in node for node in payload["nodes"])
    if payload["status"] == "interrupted":
        resumed = client.post("/api/analysis/test-analysis/approve")
        assert resumed.status_code == 200
        assert resumed.json()["status"] == "completed"


def test_crisis_story_is_detector_derived() -> None:
    response = client.get("/api/crisis/story")
    assert response.status_code == 200
    stages = response.json()["stages"]
    assert [stage["stage"] for stage in stages] == ["NORMAL", "ANOMALY", "SPIKE", "HIGH RISK", "CRITICAL", "AI RECOMMENDATION"]
    assert response.json()["detector"] == "sentiment-threshold-detector"


def test_publish_is_blocked_until_approved() -> None:
    with get_connection() as connection:
        connection.execute("UPDATE response_drafts SET status = 'PENDING_REVIEW' WHERE id = 1")
        connection.commit()
    response = client.post("/api/responses/1/publish")
    assert response.status_code == 409
    assert "APPROVED" in response.json()["detail"]
    assert client.post("/api/responses/1/approve").status_code == 200
    assert client.post("/api/responses/1/publish").status_code == 200


def test_analytics_and_crisis_surfaces_are_available() -> None:
    for path in ("/api/influencers", "/api/campaigns", "/api/executive"):
        response = client.get(path)
        assert response.status_code == 200
        assert response.json()

    simulation = client.post("/api/crisis/simulate", json={"severity": "Critical", "duration_hours": 24})
    assert simulation.status_code == 200
    assert simulation.json()["projected_negative_pct"] >= 0


def test_topic_metrics_use_historical_seed() -> None:
    topics = client.get("/api/topics").json()
    assert sum(topic["mentions"] for topic in topics) >= 1000


def test_seed_calibration_and_agent_ground_truth_are_computed() -> None:
    summary = client.get("/api/summary").json()
    assert 24800 <= summary["mentions"] <= 25000
    assert 15 <= summary["negative_sentiment"] <= 17
    assert summary["brand_health"] == 84
    topics = {row["name"]: row for row in client.get("/api/topics").json()}
    assert topics["App Update Failure"]["mentions"] == 1024
    assert topics["App Update Failure"]["negative_pct"] == 82.0
    assert 681 <= topics["Login Issues"]["mentions"] <= 682
    assert 450 <= topics["Dark Mode"]["mentions"] <= 451
    assert 309 <= topics["Pricing"]["mentions"] <= 310
    mention = client.get("/api/mentions?limit=1").json()[0]
    assert {"mention_type", "emotion", "intensity", "impact"} <= set(mention)
    agents = {row["name"]: row for row in client.get("/api/agents").json()}
    assert agents["Mention Classification"]["accuracy"] >= 0.9
    assert agents["Sentiment & Emotion"]["accuracy"] >= 0.9


def test_risk_detector_rules_and_forecast_are_exposed() -> None:
    risk = client.get("/api/risk").json()
    assert risk["cluster"] == "App Update Failure"
    assert risk["growth_pct"] == 327.0
    assert risk["z_score"] >= 5
    assert risk["severity"] == "Critical"
    assert risk["predicted_risk"] >= 0
    assert risk["predicted_peak"] > 0


def test_crisis_simulator_stage_mapping_and_reset() -> None:
    assert [simulator_stage(hour) for hour in range(7)] == ["NORMAL", "ANOMALY", "SPIKE", "HIGH RISK", "CRITICAL", "CRITICAL", "CRITICAL"]
    reset = client.post("/api/crisis/reset")
    assert reset.status_code == 200
    started = client.post("/api/crisis/start?speed=2")
    assert started.json()["status"] == "running"
    tick = client.post("/api/crisis/tick")
    assert tick.json()["inserted"] == 10
    assert client.post("/api/crisis/pause").json()["status"] == "paused"
    restored = client.post("/api/crisis/reset")
    assert restored.json()["status"] == "idle"
    assert restored.json()["inserted"] == 0
