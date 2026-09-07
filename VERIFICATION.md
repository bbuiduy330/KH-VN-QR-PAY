# Kết quả kiểm tra trước bàn giao

Ngày: 07/09/2026. Phiên bản: 1.0.0-demo.

| Kiểm tra | Kết quả |
|---|---|
| Cài đặt từ bản copy sạch không có node_modules/dist | npm ci thành công |
| Kiểm thử tự động trên Node 22.23.2 | 60/60 đạt, 0 thất bại |
| Production build trên bản copy sạch, Node 22 | Thành công với Vite 7.3.6 |
| API HTTP local | Health trả demo; payment intent bị chặn 503 |
| Bộ ảnh QR PNG | 4 ảnh đọc lại thành công qua jsQR |
| Chức năng scanner camera thiết bị thật | Chưa kiểm tra trên camera thực tế |
| Giao diện render / thao tác trình duyệt | Chưa thực hiện browser UI QA |
| Telegram với bot token thật | Chưa kiểm tra; unit test HMAC/session đạt |
| Deploy trên tài khoản Vercel của chủ dự án | Chưa thực hiện; đã chuẩn bị cấu hình và build local |

Không có giao dịch tiền thật nào được thực hiện. Tests không chứng minh production readiness hoặc tương thích mọi QR ngân hàng. Checklist test trên điện thoại và URL Vercel nằm trong docs/TESTING.md.
