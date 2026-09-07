# Vercel

Xem hướng dẫn từng bước trong `BAT-DAU-TU-DAY.md`.

- Root: root repository, không phải apps/web.
- Framework Vite, Node 22.x.
- Install `npm ci`, build `npm run build`, output `apps/web/dist`.
- Không cần biến môi trường cho demo.
- Không có catch-all SPA rewrite vì giao diện dùng hash navigation.
- `/api/*` rewrite vào Node Function `api/index.js`.
- `VITE_DEMO_MODE=false` hiển thị trang chặn tiền thật. Không có cấu hình bí mật nào có thể biến demo thành production.
- Telegram optional: chỉ thêm TELEGRAM_BOT_TOKEN và SESSION_SECRET ở server; xem docs/TELEGRAM.md.
- Không để mnemonic, private key hoặc bot token trong biến có tiền tố VITE_ hay trong GitHub.

Sau deploy kiểm tra `/api/health` trả JSON, trang chủ mở được và luồng demo hoàn tất. Việc build local thành công không thay thế kiểm tra trên deployment Vercel thực tế.
