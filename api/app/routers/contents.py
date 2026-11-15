from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.db.session import get_db
from app.models.content import Content
from app.schemas.content import (
    ContentCreate,
    ContentUpdate,
    ContentResponse,
    ContentTreeNode,
)

router = APIRouter(prefix="/contents", tags=["Content Registry"])

@router.post("", response_model=ContentResponse, status_code=status.HTTP_201_CREATED)
async def register_content(payload: ContentCreate, db: AsyncSession = Depends(get_db)):
    """Registers a new creative content item with IPFS CID and SHA-256 hash."""
    # Check parent content if derivative
    if payload.parent_content_id > 0:
        parent_stmt = select(Content).where(Content.id == payload.parent_content_id)
        parent_res = await db.execute(parent_stmt)
        parent = parent_res.scalar_one_or_none()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parent content with ID {payload.parent_content_id} not found."
            )
        if parent.is_frozen:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot create derivative from a frozen parent content."
            )

    content_item = Content(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        ipfs_cid=payload.ipfs_cid,
        sha256_hash=payload.sha256_hash,
        primary_creator=payload.primary_creator.lower(),
        parent_content_id=payload.parent_content_id,
        upstream_bps=payload.upstream_bps,
        is_frozen=False,
        status="REGISTERED"
    )

    db.add(content_item)
    await db.commit()
    await db.refresh(content_item)
    return content_item

@router.get("", response_model=List[ContentResponse])
async def list_contents(
    category: Optional[str] = None,
    creator: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Lists registered contents with optional filtering."""
    query = select(Content)
    if category and category.upper() != "ALL":
        query = query.where(Content.category == category)
    if creator:
        query = query.where(Content.primary_creator == creator.lower())

    query = query.order_by(Content.id.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{content_id}", response_model=ContentResponse)
async def get_content_detail(content_id: int, db: AsyncSession = Depends(get_db)):
    """Returns details for a specific content item."""
    stmt = select(Content).where(Content.id == content_id)
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found.")
    return item

@router.get("/{content_id}/tree", response_model=ContentTreeNode)
async def get_derivative_tree(content_id: int, db: AsyncSession = Depends(get_db)):
    """Recursively builds the derivative tree (DAG) for a given root or parent content."""
    stmt = select(Content).where(Content.id == content_id)
    res = await db.execute(stmt)
    root = res.scalar_one_or_none()
    if not root:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found.")

    async def build_subtree(node: Content) -> ContentTreeNode:
        child_stmt = select(Content).where(Content.parent_content_id == node.id)
        child_res = await db.execute(child_stmt)
        children = child_res.scalars().all()

        child_nodes = []
        for c in children:
            child_nodes.append(await build_subtree(c))

        return ContentTreeNode(
            id=node.id,
            onchain_id=node.onchain_id,
            title=node.title,
            category=node.category,
            primary_creator=node.primary_creator,
            parent_content_id=node.parent_content_id,
            upstream_bps=node.upstream_bps,
            is_frozen=node.is_frozen,
            children=child_nodes
        )

    return await build_subtree(root)

@router.post("/{content_id}/freeze", response_model=ContentResponse)
async def freeze_content(content_id: int, db: AsyncSession = Depends(get_db)):
    """Freezes a content item in case of copyright dispute."""
    stmt = select(Content).where(Content.id == content_id)
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found.")

    item.is_frozen = True
    item.status = "FROZEN_DISPUTE"
    await db.commit()
    await db.refresh(item)
    return item

@router.post("/{content_id}/unfreeze", response_model=ContentResponse)
async def unfreeze_content(content_id: int, db: AsyncSession = Depends(get_db)):
    """Unfreezes a content item after dispute resolution."""
    stmt = select(Content).where(Content.id == content_id)
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found.")

    item.is_frozen = False
    item.status = "REGISTERED"
    await db.commit()
    await db.refresh(item)
    return item
