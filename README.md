# RoyaltyFlow Web Application (`web/`)

Giao diện Web3 hiện đại cho nền tảng phân phối doanh thu bản quyền số **RoyaltyFlow**, xây dựng bằng **Next.js 14 (App Router)**, **Tailwind CSS**, **Wagmi v2**, **Viem**, và **TanStack React Query**.

---

## 1. Cấu trúc Mô-đun & Các Trang Chính

| Đường dẫn (Route) | Tên Trang | Chức năng chính |
| :--- | :--- | :--- |
| **`/`** | Landing Page | Giới thiệu hệ thống, kiến trúc BPS 10,000, quy trình 4 bước và các thông số hoạt động của mạng Avalanche Fuji. |
| **`/studio`** | Creator Studio | Tải lên tác phẩm, băm SHA-256 off-chain, AI Copilot (Gemini) phân tích văn bản thỏa thuận, thiết lập tỷ lệ BPS và đăng ký On-Chain. |
| **`/marketplace`** | License Marketplace | Xem danh mục tác phẩm, lọc theo thể loại, mua bản quyền bằng MockUSDC / AVAX, và tích hợp faucet testnet trực tiếp. |
| **`/agreements/sign`** | HITL Consensus | Human-In-The-Loop: Hiển thị bản diễn giải minh bạch bằng AI và thực hiện ký xác thực mật mã **EIP-712** qua ví Web3. |
| **`/dashboard`** | Revenue Dashboard | Theo dõi số dư khả dụng theo mô hình Pull-Payment từ `PaymentVault`, thực hiện lệnh Claim tiền về ví và xem sổ cái lịch sử. |
| **`/graph`** | Royalty DAG Explorer | Biểu đồ trực quan quan hệ phái sinh (DAG), mô phỏng thời gian thực dòng chảy doanh thu ngược dòng (Upstream Royalty). |

---

## 2. Thư viện & Công nghệ Sử dụng

* **Framework:** Next.js 14.2 (React 18, App Router, Server/Client components)
* **Styling:** Tailwind CSS + Lucide Icons (Dark Fintech theme)
* **Web3 Integration:** Wagmi v2 + Viem v2 + TanStack React Query
* **Network:** Avalanche Fuji C-Chain (`chainId: 43113`)

---

## 3. Hướng dẫn Khởi chạy Ứng dụng

```bash
# 1. Di chuyển vào thư mục web
cd web

# 2. Cài đặt các gói phụ thuộc (yêu cầu Node.js >= 18)
npm install

# 3. Tạo file cấu hình môi trường từ .env.example
cp .env.example .env.local

# 4. Khởi chạy máy chủ phát triển (Development Server)
npm run dev

# 5. Mở trình duyệt tại http://localhost:3000
```
