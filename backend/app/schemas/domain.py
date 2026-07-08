from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.domain import TruckStatus, DriverStatus, LoadStatus

class CustomerBase(BaseModel):
    name: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    company_name: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TruckBase(BaseModel):
    identifier: str
    capacity: float
    current_location: str
    status: TruckStatus = TruckStatus.AVAILABLE

class TruckCreate(TruckBase):
    pass

class TruckResponse(TruckBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class DriverBase(BaseModel):
    name: str
    license_number: Optional[str] = None
    status: DriverStatus = DriverStatus.AVAILABLE
    assigned_truck_id: Optional[int] = None

class DriverCreate(DriverBase):
    pass

class DriverResponse(DriverBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class LoadBase(BaseModel):
    customer_id: int
    pickup_location: str
    delivery_location: str
    weight: float
    commodity: str
    pickup_date: datetime
    delivery_deadline: datetime

class LoadCreate(LoadBase):
    pass

class LoadResponse(LoadBase):
    id: int
    status: LoadStatus
    truck_id: Optional[int] = None
    driver_id: Optional[int] = None
    ai_summary: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
