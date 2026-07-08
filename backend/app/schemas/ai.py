from pydantic import BaseModel

class LoadExtractionRequest(BaseModel):
    text: str

class LoadExtractionResponse(BaseModel):
    pickup_location: str | None = None
    delivery_location: str | None = None
    weight: float | None = None
    commodity: str | None = None
    pickup_date: str | None = None
    delivery_deadline: str | None = None
    budget: float | None = None
    validation_warnings: list[str] = []
    error: str | None = None

class DispatchRecommendation(BaseModel):
    truck_id: int
    driver_id: int
    reasoning: str
    warning_conflict: str | None = None

class DispatchRecommendationResponse(BaseModel):
    recommendations: list[DispatchRecommendation]
