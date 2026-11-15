from typing import Optional, List
from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class LicenseTier(Base, TimestampMixin):
    __tablename__ = "license_tiers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    content_id: Mapped[int] = mapped_column(Integer, ForeignKey("contents.id", ondelete="CASCADE"), nullable=False, index=True)
    onchain_tier_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    
    # PERSONAL, COMMERCIAL, DERIVATIVE_ALLOW, EXCLUSIVE
    license_type: Mapped[str] = mapped_column(String(50), nullable=False, default="COMMERCIAL")
    price: Mapped[float] = mapped_column(Float, nullable=False)
    payment_token: Mapped[str] = mapped_column(String(42), nullable=False)
    duration_in_days: Mapped[int] = mapped_column(Integer, default=0)  # 0 = Perpetual
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    content: Mapped["Content"] = relationship("Content", back_populates="license_tiers")
    purchases: Mapped[List["LicensePurchase"]] = relationship("LicensePurchase", back_populates="tier")

class LicensePurchase(Base, TimestampMixin):
    __tablename__ = "license_purchases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tier_id: Mapped[int] = mapped_column(Integer, ForeignKey("license_tiers.id", ondelete="CASCADE"), nullable=False, index=True)
    content_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    
    buyer_address: Mapped[str] = mapped_column(String(42), nullable=False, index=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    payment_token: Mapped[str] = mapped_column(String(42), nullable=False)
    tx_hash: Mapped[str] = mapped_column(String(66), nullable=False, unique=True, index=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    tier: Mapped["LicenseTier"] = relationship("LicenseTier", back_populates="purchases")
