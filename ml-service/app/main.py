from fastapi import FastAPI
from .schemas import ForecastRequest, ValidateRequest
from .forecaster import generate_aqi_forecast, validate_sensor_reading

app = FastAPI(title="Smog Saathi ML Service", version="1.0.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "smog-saathi-ml"}


@app.post("/validate")
def validate(payload: ValidateRequest):
    return validate_sensor_reading(
        pm25=payload.pm25,
        pm10=payload.pm10,
        no2=payload.no2,
        aqi=payload.aqi,
    )


@app.post("/forecast")
def forecast(payload: ForecastRequest):
    return generate_aqi_forecast(payload)
