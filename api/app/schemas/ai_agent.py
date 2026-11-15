from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# --- 1. Agreement Analyzer Agent Schemas ---

class AgreementAnalysisRequest(BaseModel):
    agreement_text: str = Field(..., min_length=10, description="Raw agreement or email exchange text")

class AgreementRecipientResult(BaseModel):
    name_or_role: str
    wallet_address: str = ""
    percentage: float
    bps_share: int
    wallet_status: str = "VALID"  # "VALID" or "MISSING_WALLET"

class SuggestedLicenseTier(BaseModel):
    license_type: str
    recommended_price_usd: float
    reasoning: str

class AgreementAnalysisResponse(BaseModel):
    summary: str
    content_title: Optional[str] = None
    total_bps: int = 10000
    has_discrepancy: bool = False
    discrepancy_details: Optional[str] = None
    recipients: List[AgreementRecipientResult]
    suggested_license_tiers: List[SuggestedLicenseTier]
    risk_flags: List[str] = []

# --- 2. Derivative Graph Validator Schemas ---

class GraphValidationRequest(BaseModel):
    parent_id: int
    parent_license_info: Optional[str] = "DERIVATIVE_ALLOW"
    proposed_upstream_bps: int
    child_authors_split: Optional[List[Dict[str, Any]]] = None

class GraphValidationResponse(BaseModel):
    is_valid: bool
    parent_content_id: int
    child_content_id: Optional[int] = None
    upstream_bps: int
    remaining_bps_for_child: int
    current_depth: int
    cycle_detected: bool
    license_compatible: bool
    rejection_reasons: List[str] = []
    graph_explanation: str

# --- 3. Fraud & Payment Anomaly Detection Schemas ---

class PaymentAnomalyRequest(BaseModel):
    tx_hash: str
    buyer_address: str
    content_id: int
    tier_id: int
    amount: float
    token: str
    timestamp: Optional[int] = None

class PaymentAnomalyResponse(BaseModel):
    tx_hash: str
    risk_score: int  # 0 to 100 (>= 75 is High Risk)
    risk_level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    threat_indicators: List[str]
    recommended_action: str  # "ALLOW", "FLAG_FOR_REVIEW", "FREEZE_CONTENT"
    detailed_analysis: str

# --- 4. HITL Explainer Schemas ---

class HitlExplanationRequest(BaseModel):
    content_title: str
    parent_info: Optional[str] = "None (Root Work)"
    recipients: List[Dict[str, Any]]
    license_tiers: Optional[List[Dict[str, Any]]] = None

class HitlExplanationResponse(BaseModel):
    content_title: str
    explanation_markdown: str
    table_preview: List[Dict[str, Any]]
