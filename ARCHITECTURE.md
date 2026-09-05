# KH-VN QR PAY architecture

```text
Telegram User
   |
   v
Telegram Bot (grammY)
   |  WebApp button
   v
React/Vite Mini App
   |  Telegram.WebApp.initData
   v
Express API
   +--> /api/auth/telegram --> verify initData --> JWT
   +--> /api/user/me --------> user + wallet address + balance
   +--> /api/payment/parse-qr -> QR normalization -> verify TLV/CRC -> KHQR/VietQR preview
   |                              +-> KHR (Riel) / USD / VND normalization
   |                              +-> static/dynamic + individual/merchant classification
   +--> /api/payment/qr ------> PIN -> quote -> ledger hold/debit -> partner
   |
   +--> Firestore (users, wallets, transactions, config)
   |
   +--> TRON wallet service (HD child wallets, USDT-TRC20 listener)
   |
   +--> Partner payout API
```

## Production separation

1. Authentication: Telegram `initData` validation and short-lived/session JWT.
2. Custody: wallet signer isolated from API process; never expose private keys to the client.
3. Ledger: every balance mutation is a transaction/ledger event, not just an ad-hoc balance edit.
4. QR: parse and validate server-side; never trust client-side merchant data.
5. Payment: `CREATED -> PROCESSING -> COMPLETED/FAILED/REFUNDED`, with an idempotency key and reconciliation job.

## QR standardization layer

`backend/src/qr/standard.ts` is the canonical QR boundary. It follows the structure demonstrated by `mrrhak/khqr_sdk`: decode first, verify independently, then normalize the payment fields. It handles EMV TLV parsing, CRC-16/CCITT-FALSE validation at tag 63, merchant/individual account containers 29/30, currency 53, amount 54, country 58, merchant name/city 59/60, additional data 62, and dynamic QR metadata 99.

Currency mapping:
- `116` -> `KHR` (Cambodian Riel)
- `840` -> `USD`
- `704` -> `VND`

The payment engine should never trust amount/merchant/currency values sent from the Mini App. It should re-parse the raw QR on the server and create a quote from the normalized result.
