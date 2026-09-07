# KH-VN QR PAY

**Bản demo chạy được trên Vercel** của ví và thanh toán KHQR/VietQR trong Telegram Mini App. Giao diện tiếng Việt, ưu tiên điện thoại, dùng được trên trình duyệt PC.

> **Phiên bản 1.0.0-demo — không chuyển tiền thật.** Có sẵn 250 USDT demo, PIN **123456**. Không tạo địa chỉ nạp TRON, không yêu cầu seed/private key. Ví và lịch sử demo lưu tại trình duyệt hiện tại, không đồng bộ giữa thiết bị hoặc theo tài khoản Telegram.

## Chạy ngay trên Vercel

1. Giải nén gói dự án.
2. Đưa **toàn bộ nội dung bên trong thư mục KH-VN-QR-PAY** lên root repository GitHub. Không upload riêng file ZIP. Root phải nhìn thấy `apps`, `api`, `packages`, `services`, `package.json`, `package-lock.json`, `vercel.json` cùng cấp.
3. Trong Vercel → Add New → Project → Import repository.
4. Root Directory: để mặc định root repository. Giữ nguyên cấu hình từ `vercel.json`.
5. Bấm Deploy. **Không cần biến môi trường, Firebase, API key hoặc bot token để chạy demo.**
6. Mở URL HTTPS → Thanh toán → chọn QR mẫu → Xem báo giá → Xác nhận → PIN `123456`.

Cấu hình được đóng gói:

| Mục | Giá trị |
|---|---|
| Framework | Vite |
| Node.js | 22.x (tối thiểu 22.12 khi chạy Vite trên PC) |
| Install | `npm ci` |
| Build | `npm run build` |
| Output | `apps/web/dist` |
| Root Directory | Root của repository, **không** chọn `apps/web` |
| Biến demo | Mặc định bật, không cần cấu hình |

Hướng dẫn chi tiết cho người mới: [BAT-DAU-TU-DAY.md](BAT-DAU-TU-DAY.md).

## Đã có

- Tổng quan ví, ẩn/hiện số dư, nạp tiền demo, lịch sử, bộ lọc và biên nhận demo.
- Quét QR bằng camera; đọc ảnh PNG/JPG/WebP; dán chuỗi; QR mẫu có thể tải ảnh.
- KHQR USD/KHR, VietQR chuyển tài khoản/thẻ; kiểm tra TLV, CRC, loại tiền, số tiền và hạn QR động KHQR theo tập con mô tả ở `QR_STANDARD.md`.
- VNPayQR hỗ trợ **đọc thông tin**, không tạo báo giá/thanh toán trong bản này.
- Số tiền chính xác bằng `BigInt`, tỷ giá demo cố định, phí minh bạch, báo giá hết hạn sau tối đa 120 giây.
- PIN demo, 5 lần sai → tạm khóa 30 giây. Không có cơ chế PIN tiền thật.
- Thành công; thất bại trả số dư; chưa rõ kết quả giữ tiền; mô phỏng đối soát.
- Sổ cái chuyển khoản nội bộ demo; chống xử lý trùng cùng quote; khóa ghi dữ liệu giữa các tab bằng Web Locks.
- API Vercel: health, decode QR, báo giá minh họa, xác thực Telegram phía server và session cookie.
- Bot Telegram polling tùy chọn, có nút mở Mini App.
- Bộ kiểm thử tự động và GitHub Actions kiểm tra Node 22 / build.

## Chưa có trong bản phát hành này

Ví TRON thật, tạo ví HD, quản lý khóa/ký giao dịch, theo dõi nạp blockchain, rút tiền, database server cho số dư, đối tác payout, tỷ giá thị trường và đối soát tự động tiền thật. API trả lỗi có chủ đích cho thanh toán/rút tiền thật. **Đổi `VITE_DEMO_MODE=false` chỉ hiển thị trang chặn, không kích hoạt production.**

Đây là dự án hoàn chỉnh cho phạm vi demo/test UX. Các ranh giới tích hợp production được mô tả trong `docs/PRODUCTION-ROADMAP.md`, không được trình bày như tính năng đã hoạt động.

## Chạy trên PC

Cài Node.js 22 LTS, phiên bản 22.12 trở lên. Giải nén xong, bấm đúp **START-DEMO.bat** trên Windows, rồi mở `http://localhost:5173`.

Hoặc mở terminal tại root dự án:

```bash
npm ci
npm run dev
```

`npm run dev` chạy cả Vite và API local. Dừng bằng Ctrl+C. Để kiểm tra:

```bash
npm test
npm run build
```

`npm run preview` chỉ xem bản frontend đã build, không chạy API. `npm run dev:web` cũng chỉ chạy frontend.

## Cấu trúc

```text
KH-VN-QR-PAY/
  apps/web/          React + Vite, giao diện và scanner
  apps/bot/          Bot Telegram tùy chọn
  packages/core/     QR, tiền, fixtures và payment engine demo
  services/api/      Auth Telegram, API handler và server local
  api/index.js      Adapter Vercel Function
  tests/            Kiểm thử QR, payment, auth, storage, ảnh QR
  docs/             Triển khai, test, production roadmap, QR mẫu
  scripts/          Khởi động môi trường dev
  .github/          CI
  package.json
  package-lock.json
  vercel.json
```

## Tài liệu

- [Bắt đầu, upload GitHub, deploy Vercel](BAT-DAU-TU-DAY.md)
- [Cấu hình Telegram](docs/TELEGRAM.md)
- [Kiến trúc và API](ARCHITECTURE.md)
- [Phạm vi chuẩn hóa QR](QR_STANDARD.md)
- [Kịch bản test và kết quả kiểm tra](docs/TESTING.md)
- [Ranh giới tiền thật và lộ trình tích hợp](docs/PRODUCTION-ROADMAP.md)

Các tài liệu cũ của commit `68a2ec3` được giữ trong `docs/archive` để tham khảo lịch sử; **không phải mô tả chức năng của bản hiện tại**.
