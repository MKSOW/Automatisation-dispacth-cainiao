"""SQLAlchemy ORM models for the Cainiao Dispatch backend."""
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)  # hashed
    role = Column(Enum("admin", "trieur", "chauffeur", name="user_role"), nullable=False, default="chauffeur")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # relationships
    parcels_assigned = relationship("Parcel", back_populates="driver", foreign_keys="Parcel.driver_id")
    parcels_sorted = relationship("Parcel", back_populates="sorter", foreign_keys="Parcel.sorter_id")


class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    zone_name = Column(String(255), nullable=False, unique=True)
    geojson_data = Column(Text, nullable=True)

    parcels = relationship("Parcel", back_populates="zone")


class Parcel(Base):
    __tablename__ = "parcels"

    id = Column(Integer, primary_key=True, index=True)
    tracking_no = Column(String(100), unique=True, nullable=False, index=True)
    source = Column(String(255), nullable=True)
    status = Column(
        Enum("pending", "assigned", "sorted", "delivered", name="parcel_status"),
        nullable=False,
        default="pending",
    )
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sorter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    sequence_order = Column(Integer, nullable=True)
    timestamp_dispatch = Column(DateTime(timezone=True), nullable=True)
    timestamp_sort = Column(DateTime(timezone=True), nullable=True)

    driver = relationship("User", back_populates="parcels_assigned", foreign_keys=[driver_id])
    sorter = relationship("User", back_populates="parcels_sorted", foreign_keys=[sorter_id])
    zone = relationship("Zone", back_populates="parcels")
