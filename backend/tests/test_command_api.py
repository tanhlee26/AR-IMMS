import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
from app import create_app


def test_command_center_flow():
    client = create_app("testing").test_client()
    assert client.get("/health").status_code == 200
    dashboard = client.get("/api/v1/dashboard")
    assert dashboard.status_code == 200
    assert len(dashboard.json["data"]["nodes"]) >= 4
    assert client.get("/api/v1/hierarchy").status_code == 200
    assert client.get("/api/v1/reports/pue").status_code == 200


def test_operational_updates():
    client = create_app("testing").test_client()
    assert client.patch("/api/v1/alerts/1/acknowledge").status_code == 200
    created = client.post("/api/v1/tickets", json={"node_id": 1, "title": "API test", "description": "Integration"})
    assert created.status_code == 201
    ticket_id = created.json["data"]["id"]
    assert client.patch(f"/api/v1/tickets/{ticket_id}", json={"status": "IN_PROGRESS"}).status_code == 200
    telemetry = client.post("/api/v1/telemetry", json={"node_id": 1, "metrics": {"cpu_usage_percent": 55}})
    assert telemetry.status_code == 201
