# RoyaltyFlow Backend API (`api/`)

Hệ sinh thái Backend API và AI Agent Co-pilot cho nền tảng **RoyaltyFlow**, xây dựng bằng **FastAPI**, **SQLAlchemy 2.0 (Async)**, **Pydantic v2**, và **Google Gemini AI SDK** (`google-generativeai`).

---

## 1. Cấu trúc Thư mục

```text
api/
├── main.py                     # Entry point FastAPI, CORS, lifespan startup
├── requirements.txt            # Danh sách thư viện Python
├── .env.example                # Mẫu biến môi trường
├── README.md                   # Tài liệu hướng dẫn Backend
└── app/
    ├── core/
    │   └── config.py           # Quản lý cấu hình Pydantic BaseSettings
    ├── db/
    │   └── session.py          # SQLAlchemy 2.0 Async Engine & Session Manager
    ├── models/
    │   ├── base.py             # Declarative Base & Timestamp Mixin
    │   ├── content.py          # Model Content (CID, SHA-256, Parent ID, Frozen state)
    │   ├── royalty.py          # Model RoyaltySplit (BPS share, EIP-712 signature)
    │   └── license.py          # Model LicenseTier & LicensePurchase
    ├── schemas/
    │   ├── content.py          # Pydantic schemas cho đăng ký tác phẩm & DAG tree
    │   ├── royalty.py          # Pydantic schemas cho BPS splits & chữ ký EIP-712
    │   ├── license.py          # Pydantic schemas cho Marketplace & giao dịch mua
    │   └── ai_agent.py         # Schemas cho 4 Agent AI (Agreement, Graph, Fraud, HITL)
    ├── services/
    │   ├── ipfs_service.py     # Tính toán băm SHA-256 và sinh IPFS CID
    │   ├── agent_service.py    # Điều phối 4 Agent AI qua Google Gemini SDK
    │   └── web3_service.py     # RPC client truy vấn trạng thái Avalanche Fuji
    └── routers/
        ├── health.py           # Health check kiểm tra DB & Fuji RPC Node
        ├── ai_copilot.py       # API phân tích hợp đồng, kiểm tra DAG, HITL explain
        ├── contents.py         # API quản lý tác phẩm & cây phả hệ phái sinh
        ├── royalties.py        # API cấu hình BPS & xác thực chữ ký EIP-712
        └── licenses.py         # API Chợ bản quyền & lịch sử giao dịch mua
```

---

## 2. Danh mục API Endpoints

### A. Health & System
* `GET /`: Thông tin tổng quan API và link tài liệu Swagger UI.
* `GET /api/health`: Kiểm tra kết nối cơ sở dữ liệu và node Avalanche Fuji.

### B. AI Co-Pilot & Agents (`/api/v1/ai`)
* `POST /api/v1/ai/analyze-agreement`: Bóc tách văn bản tự do $\rightarrow$ trả về danh sách ví, tỷ lệ BPS ($10,000 = 100\%$) và đề xuất License Tier.
* `POST /api/v1/ai/validate-graph`: Thẩm định đồ thị phái sinh (chống cycle, kiểm tra depth $\le 5$, tính trích nộp ngược dòng).
* `POST /api/v1/ai/detect-fraud`: Phát hiện giao dịch bất thường (wash trading, spam, rút tiền đột ngột).
* `POST /api/v1/ai/hitl-explain`: Diễn giải minh bạch trước khi tác giả ký số ví.

### C. Content Registry (`/api/v1/contents`)
* `POST /api/v1/contents`: Đăng ký tác phẩm mới (lưu CID, SHA-256, Parent ID).
* `GET /api/v1/contents`: Danh sách tác phẩm (lọc theo danh mục hoặc ví tác giả).
* `GET /api/v1/contents/{id}`: Chi tiết một tác phẩm.
* `GET /api/v1/contents/{id}/tree`: Trả về cây phả hệ phái sinh (DAG Tree).
* `POST /api/v1/contents/{id}/freeze`: Đóng băng tác phẩm khi có tranh chấp bản quyền.
* `POST /api/v1/contents/{id}/unfreeze`: Mở khóa tác phẩm sau khi hòa giải.

### D. Royalty Splits & HITL Signatures (`/api/v1/royalties`)
* `POST /api/v1/royalties/splits`: Thiết lập tỷ lệ BPS (bắt buộc tổng $= 10,000$).
* `GET /api/v1/royalties/splits/{content_id}`: Lấy danh sách tỷ lệ chia sẻ.
* `POST /api/v1/royalties/sign`: Lưu trữ chữ ký số **EIP-712** của đồng tác giả.
* `GET /api/v1/royalties/pending/{wallet}`: Lấy danh sách thỏa thuận đang chờ ví ký duyệt.

### E. License Marketplace (`/api/v1/licenses`)
* `POST /api/v1/licenses/tiers`: Tạo gói cấp phép thương mại.
* `GET /api/v1/licenses/marketplace`: Danh sách các gói giấy phép đang mở bán.
* `POST /api/v1/licenses/purchase`: Ghi nhận giao dịch mua bản quyền on-chain.

---

## 3. Hướng dẫn Khởi chạy Backend

```bash
# 1. Di chuyển vào thư mục api
cd api

# 2. Tạo môi trường ảo Python
python3 -m venv venv
source venv/bin/activate

# 3. Cài đặt thư viện
pip install -r requirements.txt

# 4. Sao chép cấu hình môi trường
cp .env.example .env

# 5. Khởi chạy máy chủ FastAPI (Reload mode)
uvicorn main:app --reload --port 8000

# 6. Mở tài liệu API tương tác tại http://localhost:8000/docs
```
