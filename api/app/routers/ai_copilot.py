from fastapi import APIRouter, HTTPException
from app.schemas.ai_agent import (
    AgreementAnalysisRequest,
    AgreementAnalysisResponse,
    GraphValidationRequest,
    GraphValidationResponse,
    PaymentAnomalyRequest,
    PaymentAnomalyResponse,
    HitlExplanationRequest,
    HitlExplanationResponse,
)
from app.services.agent_service import agent_service

router = APIRouter(prefix="/ai", tags=["AI Co-Pilot & Agents"])

@router.post("/analyze-agreement", response_model=AgreementAnalysisResponse)
async def analyze_agreement_endpoint(req: AgreementAnalysisRequest):
    """
    Agreement Analyzer Agent:
    Takes freeform contract/email text, extracts co-creator splits in BPS (10,000 = 100%),
    flags discrepancies, and recommends suitable license tiers.
    """
    try:
        result = await agent_service.analyze_agreement(req.agreement_text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@router.post("/validate-graph", response_model=GraphValidationResponse)
async def validate_graph_endpoint(req: GraphValidationRequest):
    """
    Derivative Royalty Graph Validator Agent:
    Validates DAG integrity, prevents cyclical references, enforces depth limits (<= 5),
    and validates upstream revenue deduction.
    """
    try:
        result = await agent_service.validate_derivative_graph(
            parent_id=req.parent_id,
            parent_license_info=req.parent_license_info or "DERIVATIVE_ALLOW",
            proposed_upstream_bps=req.proposed_upstream_bps,
            child_authors_split=req.child_authors_split
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph validation failed: {str(e)}")

@router.post("/detect-fraud", response_model=PaymentAnomalyResponse)
async def detect_fraud_endpoint(req: PaymentAnomalyRequest):
    """
    Payment Security Sentinel Agent:
    Detects wash trading, spam transactions, flash withdrawals, and abnormal values.
    """
    try:
        result = await agent_service.detect_anomalies(req.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fraud detection failed: {str(e)}")

@router.post("/hitl-explain", response_model=HitlExplanationResponse)
async def hitl_explain_endpoint(req: HitlExplanationRequest):
    """
    HITL Explainer Agent:
    Translates technical BPS parameters and EIP-712 messages into clear natural language
    with a concrete simulation table before authors sign.
    """
    try:
        result = await agent_service.generate_hitl_explanation(
            content_title=req.content_title,
            recipients=req.recipients,
            parent_info=req.parent_info or "Tác phẩm gốc độc lập",
            license_tiers=req.license_tiers
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"HITL explanation failed: {str(e)}")
