import os
import sys
from datetime import datetime, timedelta

# Add backend directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal
from app.models.domain import Customer, Truck, Driver, Load, TruckStatus, DriverStatus, LoadStatus

def seed_database():
    print("Starting database seeding...")
    db = SessionLocal()
    
    # Clear existing data just in case
    db.query(Load).delete()
    db.query(Driver).delete()
    db.query(Truck).delete()
    db.query(Customer).delete()
    
    # 1. Create Customers
    customers = [
        Customer(name="Acme Logistics"),
        Customer(name="Global Freight Co."),
        Customer(name="FastTrack Deliveries")
    ]
    db.add_all(customers)
    db.commit()
    print("Created customers.")
    
    # 2. Create Trucks
    trucks = [
        Truck(identifier="TRK-001", capacity=40000.0, current_location="Dallas, TX", status=TruckStatus.AVAILABLE),
        Truck(identifier="TRK-002", capacity=25000.0, current_location="Houston, TX", status=TruckStatus.AVAILABLE),
        Truck(identifier="TRK-003", capacity=15000.0, current_location="Austin, TX", status=TruckStatus.MAINTENANCE),
        Truck(identifier="TRK-004", capacity=35000.0, current_location="San Antonio, TX", status=TruckStatus.ASSIGNED)
    ]
    db.add_all(trucks)
    db.commit()
    print("Created trucks.")
    
    # 3. Create Drivers
    drivers = [
        Driver(name="John Doe", status=DriverStatus.AVAILABLE),
        Driver(name="Jane Smith", status=DriverStatus.AVAILABLE),
        Driver(name="Mike Johnson", status=DriverStatus.OFF_DUTY),
        Driver(name="Sarah Williams", status=DriverStatus.ASSIGNED, assigned_truck_id=trucks[3].id) # Assigned to TRK-004
    ]
    db.add_all(drivers)
    db.commit()
    print("Created drivers.")
    
    # 4. Create Loads
    now = datetime.utcnow()
    loads = [
        Load(
            customer_id=customers[0].id,
            pickup_location="Dallas, TX",
            delivery_location="Houston, TX",
            weight=18000.0,
            commodity="Electronics",
            pickup_date=now + timedelta(days=1),
            delivery_deadline=now + timedelta(days=2),
            status=LoadStatus.PENDING,
            ai_summary="Pending electronics shipment from Dallas to Houston."
        ),
        Load(
            customer_id=customers[1].id,
            pickup_location="San Antonio, TX",
            delivery_location="Austin, TX",
            weight=22000.0,
            commodity="Building Materials",
            pickup_date=now - timedelta(days=1),
            delivery_deadline=now + timedelta(days=1),
            status=LoadStatus.ASSIGNED,
            truck_id=trucks[3].id,
            driver_id=drivers[3].id,
            ai_summary="Building materials currently assigned to Sarah Williams en route to Austin."
        )
    ]
    db.add_all(loads)
    db.commit()
    print("Created loads.")
    
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
