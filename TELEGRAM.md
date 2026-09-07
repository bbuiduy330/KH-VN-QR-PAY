# Chạy demo trong Telegram

## Cách đơn giản, không cần chạy bot trên PC

1. Deploy lên Vercel và lấy URL HTTPS.
2. Mở tài khoản chính thức **@BotFather** trong Telegram.
3. Nếu chưa có bot, dùng `/newbot`, làm theo hướng dẫn để tạo. Giữ token riêng, không đưa vào GitHub.
4. Vào `/mybots` → chọn bot → Bot Settings → cấu hình Mini App / menu button. Gán URL HTTPS của Vercel cho nút mở ứng dụng. Tên mục có thể thay đổi theo giao diện BotFather.
5. Mở chat riêng với bot và bấm nút ứng dụng/menu đã tạo.
6. Trải nghiệm ví demo bình thường. Không cần Telegram auth server nếu chỉ test giao diện.

## Thử xác thực danh tính Telegram thật

Trong Vercel → Project → Settings → Environment Variables, thêm:

| Tên | Nội dung |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Token đúng bot đã mở Mini App |
| `SESSION_SECRET` | Chuỗi ngẫu nhiên mạnh ít nhất 32 ký tự |

Tạo secret trên PC (không commit kết quả):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Redeploy để áp dụng biến. Mở Mini App từ bot → Cài đặt → Xác thực Telegram. Server kiểm tra chữ ký và thời hạn, trả danh tính đã xác thực. Cookie HttpOnly tồn tại 15 phút. Khi tải lại, giao diện thử khôi phục danh tính từ cookie.

Tên/số dư từ `initDataUnsafe` không được dùng như danh tính đáng tin cậy. Trong bản này, dù xác thực thành công, số dư vẫn là demo lưu riêng trong trình duyệt. Không có ví hoặc tiền thật gắn với Telegram ID.

## Bot polling tùy chọn

Nếu muốn bot trả lời `/start` với nút **Mở ví demo**, copy `.env.example` thành `.env` ở root. Điền `TELEGRAM_BOT_TOKEN`, `WEB_APP_URL` (HTTPS), sau đó:

```bash
npm run start:bot
```

Giữ tiến trình chạy trên PC hoặc VPS. Không chạy polling trong Vercel Function. Nếu bot đã dùng webhook, polling sẽ xung đột: dùng bot test riêng hoặc chủ động quản lý webhook; script không tự xóa webhook cũ.

Script chỉ gửi nút mở app để phản hồi `/start` hoặc `/help` trong chat riêng; không gửi broadcast.

Tài liệu Telegram chính thức: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
