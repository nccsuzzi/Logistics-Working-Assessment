import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import Base

class TruckStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    ASSIGNED = "ASSIGNED"
    IN_TRANSIT = "IN_TRANSIT"
    MAINTENANCE = "MAINTENANCE"

class DriverStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    ASSIGNED = "ASSIGNED"
    OFF_DUTY = "OFF_DUTY"

class LoadStatus(str, enum.Enum):
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class Role(str, enum.Enum):
    ADMIN = "ADMIN"
    DISPATCHER = "DISPATCHER"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(Role), default=Role.DISPATCHER, nullable=False)

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    loads = relationship("Load", back_populates="customer")

class Truck(Base):
    __tablename__ = "trucks"
    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String, unique=True, index=True, nullable=False)
    capacity = Column(Float, nullable=False) # max weight capacity
    current_location = Column(String, nullable=False)
    status = Column(Enum(TruckStatus), default=TruckStatus.AVAILABLE, nullable=False)
    
    loads = relationship("Load", back_populates="truck")
    drivers = relationship("Driver", back_populates="truck")

class Driver(Base):
    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    license_number = Column(String, nullable=True)
    status = Column(Enum(DriverStatus), default=DriverStatus.AVAILABLE, nullable=False)
    assigned_truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=True)
    
    truck = relationship("Truck", back_populates="drivers")
    loads = relationship("Load", back_populates="driver")

class Load(Base):
    __tablename__ = "loads"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    pickup_location = Column(String, nullable=False)
    delivery_location = Column(String, nullable=False)
    weight = Column(Float, nullable=False)
    commodity = Column(String, nullable=False)
    pickup_date = Column(DateTime, nullable=False)
    delivery_deadline = Column(DateTime, nullable=False)
    status = Column(Enum(LoadStatus), default=LoadStatus.PENDING, nullable=False)
    ai_summary = Column(String, nullable=True)
    
    truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    
    customer = relationship("Customer", back_populates="loads")
    truck = relationship("Truck", back_populates="loads")
    driver = relationship("Driver", back_populates="loads")
