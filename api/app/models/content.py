from typing import Optional, List
from sqlalchemy import String, Integer, Boolean, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class Content(Base, TimestampMixin):
    __tablename__ = "contents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    onchain_id: Mapped[Optional[int]] = mapped_column(Integer, unique=True, nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), default="Music")
    
    ipfs_cid: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    sha256_hash: Mapped[str] = mapped_column(String(66), nullable=False, index=True)
    primary_creator: Mapped[str] = mapped_column(String(42), nullable=False, index=True)
    
    # Derivative Royalty Graph fields
    parent_content_id: Mapped[int] = mapped_column(Integer, default=0, index=True)
    upstream_bps: Mapped[int] = mapped_column(Integer, default=0)
    
    # Dispute and freeze management
    is_frozen: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(50), default="REGISTERED")

    # Relationships
    splits: Mapped[List["RoyaltySplit"]] = relationship(
        "RoyaltySplit", back_populates="content", cascade="all, delete-orphan"
    )
    license_tiers: Mapped[List["LicenseTier"]] = relationship(
        "LicenseTier", back_populates="content", cascade="all, delete-orphan"
    )
