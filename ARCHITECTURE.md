# Kiến trúc bản 1.0.0-demo

## Phạm vi có mã nguồn

`apps/web` là React/Vite SPA dùng hash navigation (`#home`, `#pay`, `#history`, `#settings`) nên tải lại trang con không cần rewrite SPA. Root `api/index.js` là Vercel Node Function; rewrite `/api/:path*` đi vào handler chung. Trên PC, cùng handler chạy bằng Node HTTP ở cổng 3001, Vite proxy `/api` đến đó.

Demo chạy độc lập với API. Cả frontend và backend dùng cùng `packages/core` nhưng **frontend demo thực thi giả lập tại trình duyệt**; đó không phải ranh giới bảo mật cho tiền thật.

| Module | Vai trò |
|---|---|
| `packages/core/qr.mjs` | Parse TLV, CRC, nhận diện scheme, chuẩn hóa dữ liệu, giữ tag chưa biết |
| `packages/core/money.mjs` | Decimal strings, BigInt atomic units, tỷ giá và phí demo |
| `packages/core/fixtures.mjs` | Tạo QR thử nghiệm với tài khoản giả lập |
| `packages/core/demo.mjs` | Quote, PIN mô phỏng, chuyển số dư, idempotency, đối soát |
| `apps/web/src/store.js` | Web Locks + localStorage cho ví demo một trình duyệt |
| `services/api/auth.mjs` | Telegram HMAC, auth_date và cookie session ký HMAC |
| `services/api/handler.mjs` | API logic dùng chung cho Node local/Vercel |
| `apps/bot/index.mjs` | Long-poll bot tùy chọn chạy trên PC/VPS |

## Dữ liệu và tiền

Tất cả giá trị tiền đi qua chuỗi thập phân, chuyển sang BigInt khi tính toán. USDT dùng 6 chữ số thập phân; USD dùng 2; KHR/VND dùng số nguyên trong chính sách demo. Quy đổi và phí tỷ lệ làm tròn lên đến đơn vị nhỏ nhất của USDT.

Tỷ giá demo: 1 USDT = 1 USD = 4.100 KHR = 25.500 VND. Phí demo = 0,10 USDT + 0,3% số tiền quy đổi. Các tỷ giá này là ví dụ sản phẩm, không có nguồn thị trường.

Quote giữ raw QR, amount, rate, fee, total, thời gian tạo và hết hạn. Xác nhận re-parse raw QR và tính lại bằng cấu hình demo cố định; từ chối sửa total/fee/rate, hết hạn, thiếu số dư hoặc QR đã có giao dịch UNKNOWN. Chống ghi trùng cùng quoteId, dùng khóa ghi theo origin trong trình duyệt.

Sổ cái demo lưu mỗi khoản chuyển như một cặp tài khoản nguồn/đích:

| Sự kiện | Từ | Đến |
|---|---|---|
| Nạp demo | DEMO_SOURCE | USER_AVAILABLE |
| Giữ tiền | USER_AVAILABLE | USER_HELD |
| Thanh toán thành công | USER_HELD | PARTNER_SETTLEMENT |
| Thất bại chắc chắn | USER_HELD | USER_AVAILABLE |

`UNKNOWN` giữ tiền tại USER_HELD cho đến khi người test bấm mô phỏng đối soát. Số dư được tính từ entries, không sửa một trường balance riêng. Đây là sổ cái minh họa, không phải hệ kế toán production.

## Trạng thái

Chưa có giao dịch trước khi xác nhận. Khi xác nhận, kết quả mô phỏng là SUCCESS, FAILED hoặc UNKNOWN. Giao diện có trạng thái đang xử lý; core thực hiện atomic local mutation. UNKNOWN chỉ chuyển sang SUCCESS hoặc FAILED khi mô phỏng đối soát. FAILED đã release số dư; không tạo thêm trạng thái REFUNDED dễ dẫn đến release hai lần.

Web Locks bảo vệ các writer hợp tác trong cùng origin; không chống người dùng sửa localStorage/devtools. Dữ liệu lưu thất bại thì không báo thành công. Reset phục hồi được cả JSON hỏng. Không lưu PIN người dùng.

## API

| Method | Path | Kết quả |
|---|---|---|
| GET | `/api/health` | version, mode demo, realPaymentsEnabled=false |
| POST | `/api/qr/decode` | `{rawQrData}` → dữ liệu QR đã kiểm tra |
| POST | `/api/payment/quote` | `{rawQrData, amount?}` → quote minh họa, executable=false |
| POST | `/api/auth/telegram` | `{initData}` → user đã xác thực, cookie session |
| GET | `/api/me` | Đọc danh tính từ cookie hợp lệ |
| POST | `/api/auth/logout` | Xóa cookie |
| POST | `/api/payment/intent` | 503 REAL_PAYMENTS_DISABLED |
| POST | `/api/wallet/withdraw` | 503 REAL_PAYMENTS_DISABLED |

Decode/quote là endpoint công khai chỉ đọc/tính toán demo, không truy cập số dư. Body tối đa 16 KiB ở adapter. Không nhận destination/fee/total từ client làm dữ liệu xác thực. API không yêu cầu Firebase hay database để chạy.

Telegram kiểm tra chữ ký HMAC, từ chối trường trùng, auth_date cũ hơn 5 phút hoặc tương lai quá 30 giây. Session ký HMAC riêng (không gọi là JWT), hạn 15 phút, HttpOnly, SameSite=Lax, Secure trên Vercel. Bí mật server không có tiền tố VITE_. Xác thực Telegram không biến ví demo thành ví thật.

## Triển khai

- Vercel: frontend static + API function; root repo, `npm ci`, `npm run build`, `apps/web/dist`.
- Không chạy polling bot, TRON listener hoặc worker đối soát dài hạn trong Vercel Function.
- Không có database, ledger server hay các giới hạn chống abuse phân tán. Trước khi mở rộng công khai, cấu hình hạn mức/WAF của hosting theo nhu cầu.
- Xem `docs/PRODUCTION-ROADMAP.md` trước mọi tích hợp tiền thật.
