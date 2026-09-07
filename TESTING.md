# Kiểm thử bản 1.0.0-demo

## Tự động

```bash
npm ci
npm test
npm run build
```

Bộ test dùng Node test runner, không cần Jest/Vitest. Các nhóm kiểm tra:

- CRC với check value độc lập `123456789 → 29B1`.
- VietQR vector độc lập; fixture tổng hợp USD/KHR/VND/QR tĩnh/động.
- TLV trùng/lỗi/truncated; sửa amount nhưng giữ CRC; CRC sai vị trí; expiry; currency/precision.
- Tính số tiền BigInt, làm tròn USDT, phí, giới hạn amount, chống sửa quote.
- Thành công, thất bại, UNKNOWN, giữ/release số dư, đối soát một lần, không gửi lại QR đang UNKNOWN.
- Idempotency quote, insufficient balance, expired quote, PIN retries/lockout.
- HMAC Telegram, thời hạn initData/session, duplicate query keys, identity giả, chưa cấu hình.
- API adapter Vercel, decode/quote và chặn money endpoint.
- Tạo PNG rồi đọc lại bằng jsQR, cùng thư viện scanner của giao diện.
- Storage: writer đồng thời, JSON hỏng, lỗi ghi dữ liệu; lock được mô phỏng trong test Node.

## Checklist test tay trên URL Vercel của anh

| Kịch bản | Thao tác | Kết quả mong đợi |
|---|---|---|
| Vào lần đầu | Mở URL HTTPS | 250 USDT demo; banner không chuyển tiền thật |
| USD thành công | Mẫu USD → quote → PIN 123456 | Trừ 4,6135 USDT; còn 245,3865; biên nhận DEMO |
| KHR / VND | Chọn từng mẫu | Currency và số tiền đúng; hiển thị tỷ giá/phí |
| QR tĩnh | Chọn Tự nhập số tiền | Bắt buộc nhập số tiền; không nhận 0/số âm |
| PIN sai | Nhập sai 5 lần | Không trừ tiền; tạm khóa 30 giây |
| Quote hết hạn | Chờ 120 giây | Không xác nhận được, cần báo giá mới |
| Thất bại | Chọn tình huống thất bại | Số dư trở lại như trước, status không thành công |
| UNKNOWN | Chọn chờ đối soát | Tiền nằm ở mục đang giữ, không tự hoàn |
| Đối soát | Mở UNKNOWN trong lịch sử | Chọn kết quả mô phỏng và cập nhật số dư đúng |
| Gửi lại khi UNKNOWN | Cùng QR → báo giá mới | Từ chối khi xác nhận, yêu cầu kiểm tra lịch sử |
| Reload | F5 sau thanh toán | Lịch sử/số dư vẫn còn trong cùng trình duyệt |
| Nhiều tab | Mở 2 tab, nạp/thanh toán | Số dư cập nhật qua storage event; ghi có khóa |
| Reset | Cài đặt → Đặt lại → xác nhận | Về 250 USDT, xóa lịch sử cũ |
| Từ chối camera | Bấm không cho phép | Có hướng dẫn thay thế bằng ảnh/mã mẫu |
| Ảnh QR | Tải docs/qr-samples/*.png vào app | Đọc đúng currency/amount/account |
| Camera thật | Camera điện thoại quét QR mẫu ở PC | Đọc QR; camera dừng sau khi nhận mã/rời màn hình |
| QR lỗi | Sửa một chữ số trong TXT | Lỗi CRC, không tạo thanh toán |
| Hỗ trợ bàn phím | Tab/Enter/Escape | Focus rõ, modal có tên, Escape đóng khi không xử lý |
| Mobile / chữ lớn | Mở trên điện thoại, phóng to chữ | Kiểm tra nút, bottom nav, form, modal, không che nội dung |
| Telegram | Mở Mini App → Cài đặt → xác thực | Chưa cấu hình thì thông báo rõ; đã cấu hình thì nhận danh tính đúng |
| API | Mở /api/health | JSON mode=demo, realPaymentsEnabled=false |

Kiểm tra camera, clipboard/download trên thiết bị, bố cục render thực tế, Telegram thật và deployment Vercel cần môi trường/tài khoản thiết bị của anh. Không coi tests Node hoặc build là thay thế cho các kiểm tra này.
