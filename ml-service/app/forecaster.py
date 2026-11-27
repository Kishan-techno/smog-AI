from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
import math
import numpy as np


MIN_REQUIRED_POINTS = 6

# Diurnal urban emission multipliers (IST hours 0..23)
DIURNAL_FACTOR = [
    1.08, 1.05, 1.02, 1.00, 1.02, 1.07,
    1.15, 1.22, 1.24, 1.16, 1.04, 0.92,
    0.84, 0.79, 0.77, 0.80, 0.88, 1.00,
    1.14, 1.22, 1.25, 1.22, 1.17, 1.12,
]


def _extract_hour_ist(iso_ts: str) -> int:
    try:
        dt = datetime.fromisoformat(iso_ts.replace("Z", "+00:00"))
        ist = dt.astimezone(timezone(timedelta(hours=5, minutes=30)))
        return ist.hour
    except Exception:
        return 12


def validate_sensor_reading(pm25=None, pm10=None, no2=None, aqi=None) -> Dict[str, Any]:
    issues: List[str] = []
    if pm25 is not None and (pm25 < 0 or pm25 > 1000):
        issues.append("pm25_out_of_range")
    if pm10 is not None and (pm10 < 0 or pm10 > 1500):
        issues.append("pm10_out_of_range")
    if pm25 is not None and pm10 is not None and pm25 > pm10 * 1.25 + 10:
        issues.append("pm25_exceeds_pm10_inconsistency")
    if no2 is not None and (no2 < 0 or no2 > 1000):
        issues.append("no2_out_of_range")
    if aqi is not None and (aqi < 0 or aqi > 500):
        issues.append("aqi_out_of_range")

    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


def generate_aqi_forecast(req) -> Dict[str, Any]:
    valid_points = [
        p for p in req.history
        if p.aqi is not None and not math.isnan(p.aqi) and 0 <= p.aqi <= 500
    ]

    if len(valid_points) < MIN_REQUIRED_POINTS:
        return {
            "status": "forecast unavailable",
            "reason": (
                f"Insufficient recent observations ({len(valid_points)} valid points; "
                f"at least {MIN_REQUIRED_POINTS} required). Returning no synthetic numbers."
            ),
            "city_id": req.city_id,
            "horizon_hours": req.horizon_hours,
            "confidence": None,
            "data_freshness": req.data_freshness,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "points": [],
            "assumptions": [],
        }

    aqi_values = np.array([float(p.aqi) for p in valid_points], dtype=float)
    pm25_values = np.array(
        [
            float(p.pm25) if p.pm25 is not None and not math.isnan(p.pm25) else float(p.aqi) * 0.55
            for p in valid_points
        ],
        dtype=float,
    )

    # Exponential recency weights + short-term linear slope
    n = len(aqi_values)
    weights = np.exp(np.linspace(-1.2, 0.0, n))
    weights /= weights.sum()
    baseline_aqi = float(np.sum(aqi_values * weights))
    baseline_pm25 = float(np.sum(pm25_values * weights))

    recent_slice = aqi_values[-min(6, n):]
    slope = float(recent_slice[-1] - recent_slice[0]) / max(1, len(recent_slice) - 1)
    damped_slope = max(-4.0, min(4.0, slope * 0.35))

    # Meteorology dispersion adjustment
    wind_factor = 1.08 if req.weather.wind_kmh < 6 else (0.90 if req.weather.wind_kmh > 14 else 1.0)
    humidity_factor = 1.06 if req.weather.humidity_pct > 75 else 1.0

    # Recent volatility determines uncertainty width & confidence score
    volatility = float(np.std(aqi_values[-min(12, n):]))
    freshness_penalty = 0.0 if req.data_freshness == "live" else 0.14
    coverage_bonus = min(0.12, (n / 48.0) * 0.12)
    confidence_score = round(
        max(0.38, min(0.92, 0.80 + coverage_bonus - freshness_penalty - min(0.22, volatility / 160.0))),
        2,
    )
    confidence_label = (
        "high" if confidence_score >= 0.78 else ("medium" if confidence_score >= 0.58 else "low")
    )

    last_ts_str = valid_points[-1].timestamp
    try:
        anchor_dt = datetime.fromisoformat(last_ts_str.replace("Z", "+00:00"))
    except Exception:
        anchor_dt = datetime.now(timezone.utc)

    last_hour = _extract_hour_ist(last_ts_str)
    last_diurnal = DIURNAL_FACTOR[last_hour % 24]

    forecast_points = []
    for h in range(1, req.horizon_hours + 1):
        target_dt = anchor_dt + timedelta(hours=h)
        ist_hour = (last_hour + h) % 24
        diurnal_ratio = DIURNAL_FACTOR[ist_hour] / max(0.6, last_diurnal)

        # Damped trend decays with horizon toward meteorology-adjusted diurnal baseline
        trend_component = damped_slope * (1.0 - math.exp(-h / 8.0)) * 2.5
        raw_aqi = (
            (baseline_aqi * 0.65 + float(aqi_values[-1]) * 0.35)
            * diurnal_ratio
            * wind_factor
            * humidity_factor
            + trend_component
        )
        pred_aqi = int(round(max(12.0, min(480.0, raw_aqi))))

        band_half = max(10.0, volatility * 0.7 + h * 0.75)
        lower_aqi = int(round(max(5.0, pred_aqi - band_half)))
        upper_aqi = int(round(min(500.0, pred_aqi + band_half)))

        pm25_ratio = baseline_pm25 / max(1.0, baseline_aqi)
        pred_pm25 = round(max(4.0, pred_aqi * pm25_ratio), 1)

        forecast_points.append(
            {
                "timestamp": target_dt.isoformat(),
                "hour_offset": h,
                "aqi": pred_aqi,
                "lower_aqi": lower_aqi,
                "upper_aqi": upper_aqi,
                "pm25": pred_pm25,
            }
        )

    return {
        "status": "ok",
        "city_id": req.city_id,
        "horizon_hours": req.horizon_hours,
        "confidence": {
            "label": confidence_label,
            "score": confidence_score,
            "volatility_std": round(volatility, 1),
        },
        "data_freshness": req.data_freshness,
        "observations_used": len(valid_points),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "points": forecast_points,
        "assumptions": [
            "Diurnal curve reflects typical morning rush (07–10 IST), midday mixing (13–16 IST), and evening inversion (19–23 IST).",
            f"Wind ({req.weather.wind_kmh} km/h) and humidity ({req.weather.humidity_pct}%) treated as slowly varying persistence priors.",
            "Uncertainty band widens with forecast horizon and recent sensor volatility.",
        ],
    }
