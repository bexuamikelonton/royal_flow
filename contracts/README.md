# RoyaltyFlow Smart Contracts (`contracts/`)

Hệ thống Hợp đồng thông minh phân phối doanh thu bản quyền số tự động cho nền tảng **RoyaltyFlow** trên mạng lưới Avalanche Fuji C-Chain (`chainId: 43113`).

---

## 1. Danh sách Hợp đồng Cốt lõi

| Smart Contract | Chuẩn kế thừa | Trách nhiệm chính |
| :--- | :--- | :--- |
| **`ContentRegistry.sol`** | `Ownable` | Lưu trữ định danh tác phẩm (`contentId`), IPFS CID, SHA-256 hash của raw asset file, liên kết phái sinh (`parentContentId`), và cơ chế đóng băng (`freezeContent`) khi có tranh chấp bản quyền. |
| **`RoyaltySplitter.sol`** | `Ownable` | Cấu hình tỷ lệ chia sẻ doanh thu Basis Points ($10,000\text{ bps} = 100\%$), tính toán phân bổ ngược dòng theo biểu đồ quyền phái sinh (Derivative Royalty Graph DAG) với độ sâu tối đa 5 tầng, chống thất thoát rounding dust. |
| **`PaymentVault.sol`** | `AccessControl`, `ReentrancyGuard`, `SafeERC20` | Két lưu giữ và phân bổ tiền thanh toán không giam giữ (Non-custodial Pull Payment Escrow). Hạch toán doanh thu theo sự ủy quyền của `LicenseManager` và cho phép tác giả rút tiền an toàn qua `withdraw` / `withdrawBatch`. |
| **`LicenseManager.sol`** | `Ownable`, `ReentrancyGuard`, `SafeERC20` | Quản trị các gói giấy phép (PERSONAL, COMMERCIAL, DERIVATIVE_ALLOW, EXCLUSIVE). Xử lý thanh toán cả Native AVAX lẫn token ERC-20 (MockUSDC), chuyển vốn trực tiếp vào `PaymentVault` và phát hành bằng chứng bản quyền on-chain. |
| **`MockUSDC.sol`** | `ERC20`, `Ownable` | Token ERC-20 mô phỏng USDC với 6 chữ số thập phân (`decimals = 6`), tích hợp hàm `faucet()` công khai phục vụ kiểm thử môi trường testnet Fuji. |

---

## 2. Các Interface (`contracts/contracts/interfaces/`)

- `IContentRegistry.sol`
- `IRoyaltySplitter.sol`
- `IPaymentVault.sol`
- `ILicenseManager.sol`

---

## 3. Quy chuẩn Bảo mật & Thiết kế On-Chain

1. **Pull-over-Push Pattern**: Không bao giờ thực hiện lệnh chuyển tiền trong vòng lặp `for` để bảo vệ hệ thống khỏi các cuộc tấn công DoS (`out-of-gas` hoặc malicious revert). Người dùng chủ động gọi hàm rút tiền (`withdraw()`).
2. **ReentrancyGuard**: Áp dụng cho mọi hàm rút tiền và mua bán.
3. **SafeERC20**: Đảm bảo an toàn tuyệt đối khi tương tác với các token ERC-20 tuân thủ hoặc không trả về boolean chuẩn.
4. **Basis Points (BPS)**: Mẫu số cố định $10,000$. Tổng tỷ lệ của các đồng tác giả bắt buộc phải bằng chính xác $10,000$ BPS.
5. **Đồ thị Phái sinh Không Chu trình (DAG)**: Khi đăng ký tác phẩm cha - con, tỷ lệ trích nộp ngược dòng (`upstreamBps`) được trừ trước khi phân bổ cho các tác giả tác phẩm con.

---

## 4. Hướng dẫn Lệnh Triển khai & Kiểm thử

```bash
# 1. Cài đặt dependencies (yêu cầu Node.js >= 18)
npm install

# 2. Biên dịch hợp đồng
npm run compile

# 3. Chạy toàn bộ Test Suite (Hardhat + Chai)
npm test

# 4. Triển khai cục bộ (Local Hardhat Node)
npm run deploy:local

# 5. Triển khai lên Avalanche Fuji Testnet
npm run deploy:fuji
```
