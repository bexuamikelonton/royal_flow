from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from datetime import datetime, timezone
from app.db.session import get_db
from app.models.content import Content
from app.models.royalty import RoyaltySplit
from app.schemas.royalty import (
    SetSplitsRequest,
    RoyaltySplitResponse,
    SignAgreementRequest,
    PendingSignatureResponse,
)

router = APIRouter(prefix="/royalties", tags=["Royalty Splits & HITL"])

@router.post("/splits", response_model=List[RoyaltySplitResponse], status_code=status.HTTP_201_CREATED)
async def configure_splits(payload: SetSplitsRequest, db: AsyncSession = Depends(get_db)):
    """
    Configures BPS split rules for a content piece.
    Validates that the sum of all co-creator BPS shares strictly equals 10,000 (100.00%).
    """
    # 1. Verify content exists and is not frozen
    stmt = select(Content).where(Content.id == payload.content_id)
    res = await db.execute(stmt)
    content = res.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found.")
    if content.is_frozen:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot configure splits for a frozen content.")

    # 2. Validate BPS Sum
    total_bps = sum(r.bps_share for r in payload.recipients)
    if total_bps != 10000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Total BPS must equal exactly 10,000 (Current: {total_bps})."
        )

    # 3. Update upstream BPS if applicable
    content.upstream_bps = payload.upstream_bps

    # 4. Clear existing splits if modifying
    del_stmt = select(RoyaltySplit).where(RoyaltySplit.content_id == payload.content_id)
    existing_splits = (await db.execute(del_stmt)).scalars().all()
    for s in existing_splits:
        await db.delete(s)

    # 5. Insert new splits
    created_splits = []
    for r in payload.recipients:
        split_record = RoyaltySplit(
            content_id=payload.content_id,
            name_or_role=r.name_or_role,
            wallet_address=r.wallet_address.lower(),
            percentage=r.percentage,
            bps_share=r.bps_share,
            is_signed=False
        )
        db.add(split_record)
        created_splits.append(split_record)

    await db.commit()
    for s in created_splits:
        await db.refresh(s)

    return created_splits

@router.get("/splits/{content_id}", response_model=List[RoyaltySplitResponse])
async def get_splits(content_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieves split configuration for a content piece."""
    stmt = select(RoyaltySplit).where(RoyaltySplit.content_id == content_id)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/sign", response_model=RoyaltySplitResponse)
async def sign_agreement(payload: SignAgreementRequest, db: AsyncSession = Depends(get_db)):
    """
    Submits an EIP-712 cryptographic signature from a co-creator confirming the BPS split.
    """
    stmt = select(RoyaltySplit).where(
        and_(
            RoyaltySplit.content_id == payload.content_id,
            RoyaltySplit.wallet_address == payload.wallet_address.lower()
        )
    )
    res = await db.execute(stmt)
    split_record = res.scalar_one_or_none()
    if not split_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Co-creator split record for wallet {payload.wallet_address} not found on content #{payload.content_id}."
        )

    split_record.is_signed = True
    split_record.signature = payload.signature
    split_record.signed_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(split_record)
    return split_record

@router.get("/pending/{wallet}", response_model=List[PendingSignatureResponse])
async def get_pending_signatures(wallet: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieves all pending co-author agreements awaiting EIP-712 signature for a given wallet address.
    """
    stmt = (
        select(RoyaltySplit, Content)
        .join(Content, RoyaltySplit.content_id == Content.id)
        .where(
            and_(
                RoyaltySplit.wallet_address == wallet.lower(),
                RoyaltySplit.is_signed == False
            )
        )
    )
    res = await db.execute(stmt)
    rows = res.all()

    pending = []
    for split, content in rows:
        pending.append(
            PendingSignatureResponse(
                split_id=split.id,
                content_id=content.id,
                content_title=content.title,
                name_or_role=split.name_or_role,
                wallet_address=split.wallet_address,
                percentage=split.percentage,
                bps_share=split.bps_share,
                is_signed=split.is_signed,
                sha256_hash=content.sha256_hash,
                ipfs_cid=content.ipfs_cid
            )
        )
    return pending
