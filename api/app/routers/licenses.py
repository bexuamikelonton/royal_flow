from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from datetime import datetime, timezone, timedelta
from app.db.session import get_db
from app.models.content import Content
from app.models.license import LicenseTier, LicensePurchase
from app.schemas.license import (
    LicenseTierCreate,
    LicenseTierResponse,
    LicensePurchaseCreate,
    LicensePurchaseResponse,
    MarketplaceItemResponse,
)

router = APIRouter(prefix="/licenses", tags=["License Marketplace"])

@router.post("/tiers", response_model=LicenseTierResponse, status_code=status.HTTP_201_CREATED)
async def create_license_tier(payload: LicenseTierCreate, db: AsyncSession = Depends(get_db)):
    """Creates a new commercial license tier for a registered content."""
    stmt = select(Content).where(Content.id == payload.content_id)
    res = await db.execute(stmt)
    content = res.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found.")
    if content.is_frozen:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot create tier for a frozen content.")

    tier = LicenseTier(
        content_id=payload.content_id,
        onchain_tier_id=payload.onchain_tier_id,
        license_type=payload.license_type.upper(),
        price=payload.price,
        payment_token=payload.payment_token.lower(),
        duration_in_days=payload.duration_in_days,
        is_active=True
    )
    db.add(tier)
    await db.commit()
    await db.refresh(tier)
    return tier

@router.get("/tiers/{content_id}", response_model=List[LicenseTierResponse])
async def get_content_tiers(content_id: int, db: AsyncSession = Depends(get_db)):
    """Gets all license tiers for a specific content."""
    stmt = select(LicenseTier).where(LicenseTier.content_id == content_id)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/marketplace", response_model=List[MarketplaceItemResponse])
async def list_marketplace_items(db: AsyncSession = Depends(get_db)):
    """
    Lists all active license tiers available in the marketplace, joined with Content details.
    """
    stmt = (
        select(LicenseTier, Content)
        .join(Content, LicenseTier.content_id == Content.id)
        .where(LicenseTier.is_active == True)
        .order_by(LicenseTier.id.desc())
    )
    res = await db.execute(stmt)
    rows = res.all()

    items = []
    for tier, content in rows:
        items.append(
            MarketplaceItemResponse(
                tier_id=tier.id,
                content_id=content.id,
                title=content.title,
                description=content.description,
                category=content.category,
                primary_creator=content.primary_creator,
                license_type=tier.license_type,
                price=tier.price,
                payment_token=tier.payment_token,
                ipfs_cid=content.ipfs_cid,
                sha256_hash=content.sha256_hash,
                parent_content_id=content.parent_content_id,
                upstream_bps=content.upstream_bps,
                is_frozen=content.is_frozen
            )
        )
    return items

@router.post("/purchase", response_model=LicensePurchaseResponse, status_code=status.HTTP_201_CREATED)
async def record_purchase(payload: LicensePurchaseCreate, db: AsyncSession = Depends(get_db)):
    """
    Records an on-chain license purchase transaction.
    """
    expires_at = None
    if payload.duration_in_days > 0:
        expires_at = datetime.now(timezone.utc) + timedelta(days=payload.duration_in_days)

    purchase = LicensePurchase(
        tier_id=payload.tier_id,
        content_id=payload.content_id,
        buyer_address=payload.buyer_address.lower(),
        price=payload.price,
        payment_token=payload.payment_token.lower(),
        tx_hash=payload.tx_hash.lower(),
        expires_at=expires_at
    )
    db.add(purchase)
    await db.commit()
    await db.refresh(purchase)
    return purchase
