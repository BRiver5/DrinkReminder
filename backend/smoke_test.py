"""End-to-end smoke test for the DrinkReminder API using FastAPI's TestClient.

Run:  python smoke_test.py
Uses a throwaway SQLite file so it never touches production data.
"""

import os
import tempfile

os.environ["DRINKREMINDER_DATABASE_URL"] = (
    "sqlite:///" + os.path.join(tempfile.mkdtemp(), "smoke.db").replace("\\", "/")
)

from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402

DEVICE = "11111111-2222-3333-4444-555555555555"
HEADERS = {"X-Device-Id": DEVICE}


def run() -> None:
    client = TestClient(app)

    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "ok", r.text

    # Register is idempotent
    for _ in range(2):
        r = client.post("/devices/register", json={"device_id": DEVICE})
        assert r.status_code == 200, r.text
        assert r.json()["device_id"] == DEVICE

    # Create two entries
    r = client.post(
        "/entries",
        json={
            "device_id": DEVICE,
            "amount_ml": 250,
            "container_type": "glass",
            "created_at": "2026-07-07T09:15:00",
        },
    )
    assert r.status_code == 201, r.text
    first_id = r.json()["id"]

    r = client.post(
        "/entries",
        json={
            "device_id": DEVICE,
            "amount_ml": 300,
            "container_type": "bottle",
            "created_at": "2026-07-08T12:30:00",
        },
    )
    assert r.status_code == 201, r.text

    # List all, then filtered by range
    r = client.get("/entries", headers=HEADERS)
    assert r.status_code == 200 and len(r.json()) == 2, r.text

    r = client.get("/entries?from=2026-07-08&to=2026-07-08", headers=HEADERS)
    assert r.status_code == 200 and len(r.json()) == 1, r.text
    assert r.json()[0]["amount_ml"] == 300

    # Another device sees nothing and cannot delete someone else's entry
    other = {"X-Device-Id": "99999999-8888-7777-6666-555555555555"}
    r = client.get("/entries", headers=other)
    assert r.status_code == 200 and r.json() == [], r.text
    r = client.delete(f"/entries/{first_id}", headers=other)
    assert r.status_code == 404, r.text

    # Delete own entry
    r = client.delete(f"/entries/{first_id}", headers=HEADERS)
    assert r.status_code == 204, r.text
    r = client.get("/entries", headers=HEADERS)
    assert len(r.json()) == 1

    # Settings: defaults on first GET, then update
    r = client.get("/settings", headers=HEADERS)
    assert r.status_code == 200 and r.json()["daily_goal_ml"] == 2000, r.text

    r = client.put(
        "/settings",
        json={
            "device_id": DEVICE,
            "daily_goal_ml": 2500,
            "weight_kg": 75,
            "unit": "ml",
            "theme_color": "#00ACC1",
            "container_icon": "bottle",
        },
    )
    assert r.status_code == 200, r.text
    r = client.get("/settings", headers=HEADERS)
    body = r.json()
    assert body["daily_goal_ml"] == 2500
    assert body["weight_kg"] == 75
    assert body["theme_color"] == "#00ACC1"

    # Missing device id -> 400
    r = client.get("/entries")
    assert r.status_code == 400, r.text

    print("All smoke tests passed.")


if __name__ == "__main__":
    run()
