"""SQLAlchemy models mirroring the mobile app's local SQLite schema."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Device(Base):
    __tablename__ = "devices"

    device_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class IntakeEntry(Base):
    __tablename__ = "intake_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_id: Mapped[str] = mapped_column(
        ForeignKey("devices.device_id"), index=True, nullable=False
    )
    amount_ml: Mapped[int] = mapped_column(Integer, nullable=False)
    container_type: Mapped[str] = mapped_column(String(32), nullable=False, default="glass")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class UserSettings(Base):
    __tablename__ = "user_settings"

    device_id: Mapped[str] = mapped_column(
        ForeignKey("devices.device_id"), primary_key=True
    )
    daily_goal_ml: Mapped[int] = mapped_column(Integer, nullable=False, default=2000)
    weight_kg: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    unit: Mapped[str] = mapped_column(String(8), nullable=False, default="ml")
    theme_color: Mapped[str] = mapped_column(String(16), nullable=False, default="#0B57D0")
    container_icon: Mapped[str] = mapped_column(String(32), nullable=False, default="glass")
