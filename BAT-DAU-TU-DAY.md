# Bắt đầu từ đây

Anh có thể đưa dự án này lên Vercel mà không cần cài phần mềm trên PC. Telegram là tùy chọn, test trong trình duyệt trước là nhanh nhất.

## A. Giải nén

1. Tải `KH-VN-QR-PAY-Vercel-Demo.zip`.
2. Bấm chuột phải → **Extract All / Giải nén tất cả**.
3. Mở thư mục `KH-VN-QR-PAY` vừa giải nén.
4. Anh phải thấy các thư mục `apps`, `api`, `packages`, `services`, `tests`, `docs` và file `package.json`, `package-lock.json`, `vercel.json`.

**Đừng chỉ upload mấy file ngoài cùng.** Các thư mục bên trong chính là mã nguồn đã bị thiếu trong repo trước.

## B. Upload lên GitHub bằng trình duyệt

1. Mở repository của anh: https://github.com/bbuiduy330/KH-VN-QR-PAY
2. Ở trang Code tại root, chọn **Add file → Upload files**.
3. Trên Windows, mở thư mục `KH-VN-QR-PAY` đã giải nén. Chọn toàn bộ **nội dung bên trong**, kéo thả vào vùng upload của GitHub. Kéo cả thư mục `apps`, `packages`, `services`, `api`… để GitHub giữ nguyên cấu trúc bên trong.
4. Chờ upload xong, nhập mô tả commit: `Complete Vercel demo v1.0`.
5. Bấm **Commit changes**. Những file cùng đường dẫn sẽ được thay bằng bản mới.
6. Quay lại trang Code và mở `apps/web/src/main.jsx`: phải thấy mã nguồn giao diện.
7. Mở `package-lock.json`: file này phải tồn tại để `npm ci` chạy được.

Nếu giao diện upload không nhận thư mục, dùng GitHub Desktop: clone repo hiện tại → copy toàn bộ nội dung dự án đã giải nén vào thư mục clone → chấp nhận ghi đè file cùng tên → Commit → Push origin. Không copy `node_modules` hoặc `.git` từ chỗ khác.

### Nhận diện sai cấu trúc

- **Đúng:** `KH-VN-QR-PAY` repository → `package.json` và `apps/web`.
- **Sai:** repository → thêm thư mục `KH-VN-QR-PAY` → mới đến `package.json`.
- **Sai:** repository chỉ chứa file ZIP.

## C. Tạo dự án Vercel

1. Đăng nhập https://vercel.com bằng tài khoản của anh.
2. Chọn **Add New → Project**.
3. Kết nối GitHub nếu Vercel yêu cầu và cho phép truy cập đúng repository.
4. Chọn repository **KH-VN-QR-PAY** → **Import**.
5. **Root Directory:** để root repo, không chọn `apps/web`.
6. **Framework Preset:** Vite.
7. **Build Command:** `npm run build`.
8. **Output Directory:** `apps/web/dist`.
9. **Install Command:** `npm ci`.
10. **Environment Variables:** để trống cho demo. Nếu dự án Vercel cũ có `VITE_DEMO_MODE=false`, xóa biến đó hoặc đổi thành `true`.
11. Bấm **Deploy**. Khi có trạng thái Ready, mở URL HTTPS mà Vercel cấp.

Các giá trị 6–9 đã nằm trong `vercel.json`; chỉ cần kiểm tra giao diện Vercel không giữ override cũ khác với các giá trị này. Nếu đang tái sử dụng một Vercel project cũ, kiểm tra cả Root Directory trong Settings.

## D. Test lần đầu trong 1 phút

1. Trang Ví hiển thị **250 USDT** và nhãn DEMO.
2. Bấm **Thanh toán QR**.
3. Chọn mẫu **Cà phê · Campuchia — 4,50 USD**.
4. Kiểm tra tài khoản demo, bấm **Xem báo giá**.
5. Tổng thanh toán là **4,6135 USDT**, gồm phí demo **0,1135 USDT**.
6. Bấm **Xác nhận thanh toán demo** → nhập PIN **123456**.
7. Xem biên nhận ghi rõ demo. Số dư còn **245,3865 USDT**.
8. Thử VietQR, KHR hoặc tải QR mẫu về rồi đọc lại bằng nút **Tải ảnh QR**.

Tỷ giá trong bản này chỉ là dữ liệu thử nghiệm, không dùng để báo giá cho khách thật.

## E. Chạy trên Windows khi muốn sửa hoặc test local

1. Cài Node.js **22 LTS**, phiên bản **22.12 trở lên**, từ https://nodejs.org.
2. Đóng và mở lại File Explorer nếu vừa cài.
3. Bấm đúp `START-DEMO.bat` trong thư mục đã giải nén. Lần đầu cần Internet để tải thư viện.
4. Chờ cài xong, mở **http://localhost:5173** trong Chrome/Edge.
5. Giữ cửa sổ lệnh đang chạy. Muốn dừng, nhấn Ctrl+C.

Nếu muốn mở PowerShell thủ công: trong File Explorer, mở thư mục có `package.json`, bấm thanh địa chỉ ở trên, gõ `powershell` và Enter. Sau đó chạy từng dòng:

```powershell
npm.cmd ci
npm.cmd run dev
```

Dùng `npm.cmd` nếu PowerShell báo chặn chạy `npm.ps1`. Không cần đổi chính sách bảo mật PowerShell.

## F. Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| `No workspaces found` | Upload thiếu `apps/web/package.json` hoặc chọn sai Root Directory |
| `npm ci` báo thiếu lockfile | Upload `package-lock.json` cùng cấp `package.json` |
| Vercel báo không có output | Giữ output `apps/web/dist`; không dùng `dist` ở root |
| Màn hình báo tiền thật chưa kích hoạt | Xóa `VITE_DEMO_MODE=false`, deploy lại |
| Camera bị từ chối | Cho phép camera; dùng URL HTTPS của Vercel, hoặc tải ảnh QR |
| Mở trên điện thoại qua IP LAN không dùng camera | Dùng Vercel HTTPS; HTTP qua IP LAN thường không đủ điều kiện camera/Web Locks |
| Telegram chưa xác thực | Demo không cần Telegram; cấu hình server theo `docs/TELEGRAM.md` nếu muốn thử xác thực |
| Lịch sử khác giữa điện thoại và PC | Đúng thiết kế: dữ liệu demo lưu riêng theo trình duyệt |
| Trình duyệt không lưu được | Cho phép dữ liệu trang web, dùng Chrome/Edge/Safari mới |

Không đưa bot token, mnemonic hoặc private key vào GitHub. Demo không cần những bí mật này.
