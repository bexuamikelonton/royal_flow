from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime

class RoyaltyRecipientInput(BaseModel):
    name_or_role: str
    wallet_address: str
    percentage: float = Field(..., ge=0, le=100)
    bps_share: int = Field(..., ge=0, le=10000)

class SetSplitsRequest(BaseModel):
    content_id: int
    upstream_bps: int = Field(default=0, ge=0, le=9999)
    recipients: List[RoyaltyRecipientInput]

class SignAgreementRequest(BaseModel):
    content_id: int
    wallet_address: str
    signature: str

class RoyaltySplitResponse(BaseModel):
    id: int
    content_id: int
    name_or_role: str
    wallet_address: str
    percentage: float
    bps_share: int
    is_signed: bool
    signature: Optional[str] = None
    signed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class PendingSignatureResponse(BaseModel):
    split_id: int
    content_id: int
    content_title: str
    name_or_role: str
    wallet_address: str
    percentage: float
    bps_share: int
    is_signed: bool
    sha256_hash: str
    ipfs_cid: str
