from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class ContentBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "Music"
    ipfs_cid: str
    sha256_hash: str
    primary_creator: str
    parent_content_id: int = 0
    upstream_bps: int = 0

class ContentCreate(ContentBase):
    pass

class ContentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_frozen: Optional[bool] = None
    status: Optional[str] = None

class ContentResponse(ContentBase):
    id: int
    onchain_id: Optional[int] = None
    is_frozen: bool
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ContentTreeNode(BaseModel):
    id: int
    onchain_id: Optional[int]
    title: str
    category: str
    primary_creator: str
    parent_content_id: int
    upstream_bps: int
    is_frozen: bool
    children: List["ContentTreeNode"] = []

    model_config = ConfigDict(from_attributes=True)
