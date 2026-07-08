from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.models.domain import Driver, User
from app.schemas.domain import DriverResponse, DriverCreate
from typing import List

router = APIRouter()

@router.get("/", response_model=List[DriverResponse])
def get_drivers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Driver).offset(skip).limit(limit).all()

@router.post("/", response_model=DriverResponse)
def create_driver(driver: DriverCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_driver = Driver(**driver.model_dump())
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver
