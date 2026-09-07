# Phạm vi chuẩn hóa QR thực tế

Bản 1.0.0-demo triển khai **tập con có kiểm tra rõ ràng**, không tuyên bố chứng nhận tương thích mọi QR ngân hàng hoặc NBC/NAPAS.

## Pipeline

Raw text (tối đa 4096 ký tự) → TLV nghiêm ngặt → CRC-16/CCITT-FALSE → scheme → tài khoản → currency/amount → kiểm tra hạn → dữ liệu chuẩn hóa → quote demo.

Tag/length là hai chữ số mỗi phần. Bộ đọc đếm Unicode code points cho giá trị TLV, CRC tính trên UTF-8. Không strip ký tự bên trong payload. Từ chối tag trùng, giá trị rỗng, thiếu dữ liệu, CRC không nằm cuối hoặc không đúng. Giữ nguyên top-level tags, accountTags, additional và raw để không làm mất extension.

| Loại | Điều kiện | Phạm vi |
|---|---|---|
| KHQR cá nhân | KH + container 29, tài khoản subtag 00 | Đọc + quote/payment demo |
| KHQR merchant | KH + container 30, tài khoản subtag 00 | Đọc + quote/payment demo |
| KHQR USD/KHR | Currency 840/116 | USD tối đa 2 số lẻ; KHR nguyên |
| KHQR động | Tag 01=12, có amount, timestamp 99/01 còn hạn | Thiếu hạn bị từ chối theo chính sách demo |
| VietQR | VN + tag 38, GUID A000000727 | Currency 704, VND nguyên |
| VietQR chuyển khoản/thẻ | QRIBFTTA / QRIBFTTC | Giữ bank BIN và account/card ID |
| VNPayQR | VN + tag 26, GUID A000000775 | Chỉ đọc thông tin, không tạo quote |
| MoMo/ZaloPay, extension riêng | Chưa có adapter riêng | Không tuyên bố hỗ trợ toàn bộ; chỉ xử lý nếu payload đúng tập con VietQR đã nêu |

Field chính: 53 currency; 54 amount; 58 country; 59 name; 60 city; 62 additional; 63 CRC. KHQR dùng 29/30; VietQR dùng 38 với beneficiary 01 chứa bank BIN 00 và account 01. Tên người nhận từ QR chỉ là dữ liệu do người tạo QR cung cấp, không được coi là xác minh ngân hàng.

- QR có số tiền thì frontend không cho sửa và core đối chiếu lại khi xác nhận.
- QR tĩnh không có số tiền: người dùng nhập amount riêng; vẫn phải validate trước quote.
- QR động KHQR bị từ chối khi đã hết hạn hoặc thiếu expiration theo chính sách bảo thủ của bản demo.
- CRC đúng không xác minh chủ tài khoản, không xác nhận đã nhận tiền và không cấp quyền thanh toán.
- KHQR/VietQR mẫu trong dự án là dữ liệu tổng hợp với tài khoản giả lập; không gửi tiền bằng ứng dụng ngân hàng.

## Tham khảo

- KHQR community SDK: https://github.com/mrrhak/khqr_sdk
- VietQR/VNPay implementation reference: https://github.com/xuannghia/vietnam-qr-pay
- Independent VietQR fixture used by tests: https://github.com/monodyle/vnqrpay

Không copy source của các repo tham khảo vào dự án. Trước production cần đối chiếu SDK/spec chính thức, sample từ ngân hàng/đối tác, thêm fixture merchant KHQR thật đã khử thông tin nhạy cảm, kiểm tra Unicode/length và extension của từng provider.
