from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.api.dependencies import get_db
from app.schemas.ai import LoadExtractionRequest, LoadExtractionResponse, DispatchRecommendationResponse
from app.services.ai import extract_load_from_text, get_dispatch_recommendations

class LoadAssignRequest(BaseModel):
    truck_id: int
    driver_id: int

router = APIRouter()

@router.post("/extract", response_model=LoadExtractionResponse)
def extract_load(request: LoadExtractionRequest, db: Session = Depends(get_db)):
    """
    Extracts load details from unstructured text using AI.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
        
    extracted_data = extract_load_from_text(request.text)
    return extracted_data

from typing import List
from app.models.domain import Load, Truck, Driver, TruckStatus, DriverStatus
from app.schemas.domain import LoadResponse, LoadCreate
from app.api.dependencies import get_current_user
from app.models.domain import User

@router.get("/", response_model=List[LoadResponse])
def get_loads(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Load).offset(skip).limit(limit).all()

@router.post("/", response_model=LoadResponse)
def create_load(load: LoadCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_load = Load(**load.model_dump())
    db.add(db_load)
    db.commit()
    db.refresh(db_load)
    return db_load

@router.get("/{load_id}/recommendations", response_model=DispatchRecommendationResponse)
def get_load_recommendations(load_id: int, db: Session = Depends(get_db)):
    """
    Returns AI-generated recommendations for assigning trucks and drivers to a specific load.
    """
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
        
    # Get available trucks (that have enough capacity)
    trucks = db.query(Truck).filter(Truck.status == TruckStatus.AVAILABLE, Truck.capacity >= load.weight).all()
    # Get available drivers
    drivers = db.query(Driver).filter(Driver.status == DriverStatus.AVAILABLE).all()
    
    trucks_data = [{"id": t.id, "identifier": t.identifier, "capacity": t.capacity, "location": t.current_location} for t in trucks]
    drivers_data = [{"id": d.id, "name": d.name} for d in drivers]
    
    load_data = {
        "pickup_location": load.pickup_location,
        "delivery_location": load.delivery_location,
        "weight": load.weight,
        "pickup_date": str(load.pickup_date),
        "delivery_deadline": str(load.delivery_deadline)
    }
    
    recs = get_dispatch_recommendations(load_data, trucks_data, drivers_data)
    return recs

from app.models.domain import LoadStatus
@router.post("/{load_id}/assign", response_model=LoadResponse)
def assign_load(load_id: int, request: LoadAssignRequest, db: Session = Depends(get_db)):
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
        
    truck = db.query(Truck).filter(Truck.id == request.truck_id).first()
    driver = db.query(Driver).filter(Driver.id == request.driver_id).first()
    
    if not truck or not driver:
        raise HTTPException(status_code=404, detail="Truck or Driver not found")
        
    load.truck_id = truck.id
    load.driver_id = driver.id
    load.status = LoadStatus.ASSIGNED
    
    truck.status = TruckStatus.ASSIGNED
    driver.status = DriverStatus.ASSIGNED
    driver.assigned_truck_id = truck.id
    
    db.commit()
    db.refresh(load)
    return load
