from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone
from app.main import app

client = TestClient(app)


def _sample_history(count=24):
    now = datetime.now(timezone.utc)
    return [
        {
            "timestamp": (now - timedelta(hours=count - i)).isoformat(),
            "aqi": 140 + (i % 6) * 5,
            "pm25": 72 + (i % 6) * 2.5,
        }
        for i in range(count)
    ]


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_forecast_unavailable_when_data_insufficient():
    res = client.post(
        "/forecast",
        json={
            "city_id": "bhopal",
            "horizon_hours": 48,
            "history": _sample_history(3),
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "forecast unavailable"
    assert body["points"] == []
    assert body["confidence"] is None


def test_forecast_48h_returns_confidence_and_widening_bounds():
    res = client.post(
        "/forecast",
        json={
            "city_id": "bhopal",
            "horizon_hours": 48,
            "data_freshness": "live",
            "history": _sample_history(24),
            "weather": {"wind_kmh": 7.5, "humidity_pct": 62, "temp_c": 23},
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert len(body["points"]) == 48
    assert body["confidence"]["score"] > 0.4
    p1 = body["points"][0]
    p48 = body["points"][-1]
    assert (p48["upper_aqi"] - p48["lower_aqi"]) > (p1["upper_aqi"] - p1["lower_aqi"])


def test_validate_catches_inconsistent_pm_values():
    res = client.post("/validate", json={"pm25": 200, "pm10": 50, "aqi": 150})
    assert res.status_code == 200
    assert res.json()["valid"] is False
    assert "pm25_exceeds_pm10_inconsistency" in res.json()["issues"]
