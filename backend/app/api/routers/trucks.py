from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.models.domain import Truck, User
from app.schemas.domain import TruckResponse, TruckCreate
from typing import List

router = APIRouter()

@router.get("/", response_model=List[TruckResponse])
def get_trucks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Truck).offset(skip).limit(limit).all()

@router.post("/", response_model=TruckResponse)
def create_truck(truck: TruckCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_truck = Truck(**truck.model_dump())
    db.add(db_truck)
    db.commit()
    db.refresh(db_truck)
    return db_truck
