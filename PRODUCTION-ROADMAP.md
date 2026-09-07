# Ranh giới demo → tiền thật

Bản giao hiện tại hoàn chỉnh cho demo/test UX, không phải ví custody hay payment gateway đã sẵn sàng vận hành tiền thật.

## Cần triển khai trước tiền thật

| Thành phần | Công việc thực tế còn thiếu |
|---|---|
| Database | Lưu users, wallets, quote, intents, attempts, ledger, webhook events, audit logs ở server |
| Ledger | Giao dịch DB atomic, unique idempotency key, reserve/finalize/release; không dùng localStorage |
| Telegram identity | DB mapping Telegram ID → internal user; session store/revocation; replay/rate controls phù hợp |
| TRON HD wallet | Cấp child index atomic; derive address; signer riêng; backup/recovery và phân quyền |
| Custody | Seed/private key không ở frontend; policy ký và bảo vệ master key; audit |
| Deposit listener | Contract allowlist USDT, xác minh recipient/amount, confirmations, reorg, khóa trùng theo chain+txid+event index |
| Sweep/withdraw | TRX/Energy/Bandwidth, fee policy, signing worker, broadcast/retry an toàn, confirmations |
| Tỷ giá | Nguồn tỷ giá và phí do đơn vị vận hành quản lý; quote snapshot immutable và expiry |
| Payout | Đối tác có quyền thực hiện trả KHR/USD/VND, account validation, hạn mức/thanh khoản |
| Webhook | Xác thực chữ ký, chống lặp/replay; timeout UNKNOWN; job đối soát bền vững |
| PIN/chính sách | PIN hash server, retry/rate limit bền vững, xác thực tăng cường theo rủi ro |
| Vận hành | Monitoring, incident handling, backups, khôi phục, đối soát balance/chain/partner |

Không có SDK đọc QR nào tự biến USDT thành chuyển khoản Bakong hoặc chuyển khoản ngân hàng Việt Nam. Payout phải là tích hợp riêng với đối tác/tài khoản vận hành phù hợp.

## Ranh giới triển khai

Vercel phù hợp để phục vụ frontend và API ngắn. Signer, bot polling, deposit listener và reconciliation worker cần môi trường worker/service phù hợp. Không triển khai vòng lặp dài trong một serverless request.

## Trình tự đề xuất

1. Duyệt UX demo với người dùng thực tế và QR mẫu từ đối tác.
2. Chốt payout provider, hợp đồng API, tài khoản sandbox và mô hình custody.
3. Xây database + server ledger + quote/intent API; mọi quyền xác nhận đặt ở server.
4. Tích hợp xác thực Telegram và định danh ví HD.
5. Tích hợp blockchain test environment, listener, signer và worker.
6. Kiểm thử end-to-end sandbox: trùng request, timeout, mất kết nối, restart worker, lỗi đối soát.
7. Đánh giá vận hành và yêu cầu áp dụng cho dịch vụ trước khi cân nhắc dùng tiền thật.

Đây là danh sách công việc chưa triển khai, không phải checklist chứng nhận an toàn.
