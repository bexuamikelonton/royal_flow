from typing import Optional
from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class RoyaltySplit(Base, TimestampMixin):
    __tablename__ = "royalty_splits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    content_id: Mapped[int] = mapped_column(Integer, ForeignKey("contents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name_or_role: Mapped[str] = mapped_column(String(100), nullable=False)
    wallet_address: Mapped[str] = mapped_column(String(42), nullable=False, index=True)
    
    percentage: Mapped[float] = mapped_column(Float, nullable=False)
    bps_share: Mapped[int] = mapped_column(Integer, nullable=False)  # 5000 = 50.00%
    
    # Human-in-the-Loop EIP-712 Signature
    is_signed: Mapped[bool] = mapped_column(Boolean, default=False)
    signature: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    signed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    content: Mapped["Content"] = relationship("Content", back_populates="splits")
