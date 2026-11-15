from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class LicenseTierCreate(BaseModel):
    content_id: int
    onchain_tier_id: Optional[int] = None
    license_type: str = "COMMERCIAL"
    price: float
    payment_token: str
    duration_in_days: int = 0

class LicenseTierResponse(LicenseTierCreate):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LicensePurchaseCreate(BaseModel):
    tier_id: int
    content_id: int
    buyer_address: str
    price: float
    payment_token: str
    tx_hash: str
    duration_in_days: int = 0

class LicensePurchaseResponse(LicensePurchaseCreate):
    id: int
    expires_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MarketplaceItemResponse(BaseModel):
    tier_id: int
    content_id: int
    title: str
    description: Optional[str] = None
    category: str
    primary_creator: str
    license_type: str
    price: float
    payment_token: str
    ipfs_cid: str
    sha256_hash: str
    parent_content_id: int
    upstream_bps: int
    is_frozen: bool
