
#7 RoyaltyFlow
Nền tảng phân phối doanh thu bản quyền số
Pain point
Sản phẩm số có nhiều đồng tác giả nhưng doanh thu thường được một bên thu và chia thủ công.
Khó theo dõi quyền lợi khi nội dung được cấp phép hoặc phát triển thành tác phẩm phái sinh.
Mục tiêu
Tự động phân phối doanh thu bản quyền minh bạch, giảm phụ thuộc trung gian và cho phép truy xuất lịch sử thanh toán.
Giải pháp & điểm khác biệt
Đăng ký tác phẩm và tỷ lệ hưởng doanh thu; khách hàng mua giấy phép, smart contract ghi nhận tiền và phân bổ theo thỏa thuận. Điểm nhấn: Derivative Royalty Graph quản lý quyền lợi của tác phẩm gốc và tác phẩm phái sinh, tránh tính trùng.
Tính năng
Content Registry: lưu mã tác phẩm và hash nội dung.
Royalty Splitter: cấu hình tỷ lệ có tổng bằng 100%.
License Marketplace: mua giấy phép bằng token.
Derivative Tracking và Royalty Dashboard: liên kết tác phẩm phái sinh, theo dõi số dư và lịch sử.
Agent làm gì
Phân tích thỏa thuận, đề xuất tỷ lệ phân chia và loại giấy phép.
Kiểm tra tổng tỷ lệ, xung đột và quy tắc chia trùng.
Phát hiện thanh toán bất thường, tổng hợp báo cáo; không tự xác định chủ sở hữu hợp pháp.
Phải xây on-chain
ContentRegistry: ID và hash metadata.
RoyaltySplitter: quy tắc chia doanh thu.
LicenseManager: cấp phép sử dụng số.
PaymentVault: tiếp nhận tiền và ghi số dư rút được.
HITL bắt buộc
Các đồng tác giả ký xác nhận tỷ lệ; thay đổi phải được bên có thẩm quyền chấp thuận.
Tranh chấp sở hữu phải có người xử lý; agent không ký hoặc chuyển tiền ngoài ủy quyền.
Kiến trúc công nghệ
Next.js + Tailwind + wagmi/viem; FastAPI + PostgreSQL; LLM hỗ trợ phân tích hợp đồng; Solidity/OpenZeppelin trên Avalanche Fuji; IPFS/object storage off-chain và hash on-chain.
Mô hình kinh doanh
Phí cấp phép giả định 1–3%; gói SaaS quản trị bản quyền; API royalty distribution cho marketplace.
Lộ trình phát triển
MVP: đăng ký, thiết lập tỷ lệ, thanh toán và phân phối.
Mở rộng: tác phẩm phái sinh, AI tư vấn, dashboard.
Dài hạn: API tích hợp và giải quyết tranh chấp.
Kịch bản demo
Ba đồng tác giả chia 50%/30%/20%. Khách hàng mua giấy phép 100 mock USDC; ba ví được ghi nhận số dư 50/30/20. Thêm một tác phẩm phái sinh; agent kiểm tra sơ đồ quyền và yêu cầu phê duyệt trước khi kích hoạt.
Rủi ro & KPI
Rủi ro: tranh chấp quyền tác giả, hash không xác minh được quyền sở hữu, giấy phép on-chain không tự bảo đảm hiệu lực pháp lý. KPI: chia đúng 100% trong test case; không chi trùng; mọi thay đổi tỷ lệ được phê duyệt.
