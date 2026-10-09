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


def test_response_reject_with_reason_and_audit() -> None:
    res = client.post("/api/responses/1/reject", json={"reason": "Tone is overly defensive"})
    assert res.status_code == 200
    assert res.json()["status"] == "REJECTED"

    # Verify audit entry recorded
    audit = client.get("/api/responses/1/audit").json()
    assert any(a["action"] == "response_reject" and "Tone is overly defensive" in (a["details"] or "") for a in audit)


def test_response_regenerate_variant_and_audit() -> None:
    current = client.get("/api/responses/1").json()["body"]
    res = client.post("/api/responses/1/regenerate")
    assert res.status_code == 200
    new_draft = res.json()
    assert new_draft["status"] == "PENDING_REVIEW"
    assert new_draft["body"] != current

    # Verify audit entry
    audit = client.get("/api/responses/1/audit").json()
    assert any(a["action"] == "response_regenerate" for a in audit)


def test_response_edit_creates_version_and_audit() -> None:
    new_text = "Updated response draft reviewed by communication leads."
    res = client.post("/api/responses/1/edit", json={"body": new_text})
    assert res.status_code == 200
    assert res.json()["body"] == new_text

    versions = client.get("/api/responses/1/versions").json()
    assert len(versions) >= 2
    assert any(v["body"] == new_text for v in versions)

    audit = client.get("/api/responses/1/audit").json()
    assert any(a["action"] == "response_edit" for a in audit)


def test_response_bulk_approve_and_audit() -> None:
    # Set draft 1 and draft 2 to PENDING_REVIEW
    with get_connection() as connection:
        connection.execute("UPDATE response_drafts SET status = 'PENDING_REVIEW' WHERE id IN (1, 2)")
        connection.commit()

    res = client.post("/api/responses/bulk-approve", json={"ids": [1, 2]})
    assert res.status_code == 200
    assert res.json()["approved"] is True
    assert res.json()["count"] == 2

    draft1 = client.get("/api/responses/1").json()
    draft2 = client.get("/api/responses/2").json()
    assert draft1["status"] == "APPROVED"
    assert draft2["status"] == "APPROVED"

    global_audit = client.get("/api/audit-log").json()
    bulk_audits = [a for a in global_audit if a["action"] == "response_approve" and a.get("details") == "Bulk approved"]
    assert len(bulk_audits) >= 2


def test_notifications_list_and_mark_read() -> None:
    notifs = client.get("/api/notifications").json()
    assert len(notifs) >= 1
    assert all("route" in n and "read" in n for n in notifs)

    first_id = notifs[0]["id"]
    mark_single = client.post(f"/api/notifications/{first_id}/read")
    assert mark_single.status_code == 200

    mark_all = client.post("/api/notifications/read")
    assert mark_all.status_code == 200

    updated = client.get("/api/notifications").json()
    assert all(n["read"] is True for n in updated)


def test_drawer_actions_endpoints_and_audit() -> None:
    gen = client.post("/api/drawer/generate-response", json={"mention_id": 42, "topic": "App Update Failure"})
    assert gen.status_code == 200
    assert gen.json()["success"] is True

    inc = client.post("/api/drawer/open-incident", json={"mention_id": 42, "topic": "App Update Failure"})
    assert inc.status_code == 200
    assert inc.json()["incident_open"] is True

    notif = client.post("/api/drawer/notify-product-team", json={"mention_id": 42, "team": "Mobile Core"})
    assert notif.status_code == 200
    assert notif.json()["success"] is True

    audit = client.get("/api/audit-log").json()
    actions = {a["action"] for a in audit}
    assert "drawer_generate_response" in actions
    assert "drawer_open_incident" in actions
    assert "drawer_notify_product_team" in actions

