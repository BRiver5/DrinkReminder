"""Pydantic request/response schemas."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class DeviceRegisterIn(BaseModel):
    device_id: str = Field(min_length=8, max_length=64)


class DeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    device_id: str
    created_at: datetime


class EntryCreate(BaseModel):
    device_id: str = Field(min_length=8, max_length=64)
    amount_ml: int = Field(gt=0, le=10000)
    container_type: str = Field(default="glass", max_length=32)
    created_at: datetime


class EntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: str
    amount_ml: int
    container_type: str
    created_at: datetime


class SettingsIn(BaseModel):
    device_id: str = Field(min_length=8, max_length=64)
    daily_goal_ml: int = Field(gt=0, le=20000)
    weight_kg: Optional[int] = Field(default=None, ge=20, le=300)
    unit: Literal["ml", "oz"] = "ml"
    theme_color: str = Field(default="#0B57D0", max_length=16)
    container_icon: str = Field(default="glass", max_length=32)


class SettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    device_id: str
    daily_goal_ml: int
    weight_kg: Optional[int]
    unit: str
    theme_color: str
    container_icon: str
