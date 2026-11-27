from typing import List, Optional
from pydantic import BaseModel, Field


class HourlyPoint(BaseModel):
    timestamp: str
    aqi: Optional[float] = None
    pm25: Optional[float] = None


class WeatherContext(BaseModel):
    wind_kmh: float = Field(default=8.0, ge=0, le=200)
    humidity_pct: float = Field(default=55.0, ge=0, le=100)
    temp_c: float = Field(default=24.0, ge=-20, le=60)


class ForecastRequest(BaseModel):
    city_id: str = Field(default="bhopal", min_length=1, max_length=60)
    horizon_hours: int = Field(default=48, ge=12, le=48)
    data_freshness: str = Field(default="live")
    history: List[HourlyPoint] = Field(default_factory=list)
    weather: WeatherContext = Field(default_factory=WeatherContext)


class ValidateRequest(BaseModel):
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    aqi: Optional[float] = None
