# KH-VN QR PAY — Design 1.0.0-demo

Tài liệu này thay thế bản draft 05/09/2026 tại root. Draft cũ nằm trong docs/archive và chỉ dùng để tham khảo lịch sử.

## Mục tiêu

Telegram Mini App / web demo tiếng Việt cho USDT-TRC20, KHQR và VietQR. Mọi giao dịch hiện là mô phỏng. Không dùng thirdweb wallet. Auth Telegram chạy ở backend khi được cấu hình; người dùng demo không cần đăng nhập.

## Tài liệu có hiệu lực

1. README.md: phạm vi đã triển khai và cách chạy.
2. ARCHITECTURE.md: module, state, ledger demo, API.
3. QR_STANDARD.md: tập con protocol được xử lý và giới hạn.
4. docs/PRODUCTION-ROADMAP.md: phần tiền thật chưa được triển khai.
5. docs/TESTING.md: kiểm thử tự động và checklist nghiệm thu thiết bị.

## Quyết định UX

- Mở thẳng vào ví, có 250 USDT demo và nút thanh toán rõ ràng.
- Bốn mục: Tổng quan, Thanh toán, Lịch sử, Cài đặt. Sidebar desktop, bottom navigation mobile.
- Luồng 3 bước: chọn QR → kiểm tra/báo giá → xác nhận PIN.
- Camera chỉ bật sau thao tác người dùng; có phương án tải ảnh, dán text hoặc QR mẫu.
- Không hiện địa chỉ nạp tiền giả khiến người dùng có thể gửi tiền thật.
- Số tiền từ QR bị khóa; số tiền nhập riêng chỉ dùng cho QR tĩnh thiếu amount.
- Phí, tỷ giá, số dư và hạn báo giá hiện trước xác nhận.
- Khi UNKNOWN, giải thích tiền đang giữ; không gán kết quả thành công hoặc tự hoàn khi chưa rõ.
- Mọi biên nhận ghi rõ DEMO và không có giá trị chứng minh chuyển tiền thật.
- Không dùng tỷ giá demo để báo giá khách hàng thật.

## Kiến trúc kế tiếp

Giữ định hướng Telegram identity → internal user → TRON HD child wallet. Để thực hiện cần xây backend ledger bền vững, signer riêng, blockchain listener và payout adapter. Các phần này không có trong demo và không thể thay bằng localStorage.
