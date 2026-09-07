# KH-VN QR PAY — Standardized Design Specification

Version: 1.0-draft  
Date: 2026-09-05  
Scope: Telegram Mini App + TRON/USDT-TRC20 wallet + KHQR + VietQR/VNPayQR normalization + payment orchestration.

## 1. Design goals

KH-VN QR PAY is designed as a Telegram-first payment wallet with these principles:

1. Telegram is the identity/onboarding layer.
2. TRON HD child wallets are the custody layer for USDT-TRC20.
3. QR parsing is a standalone normalization layer.
4. Backend, not the client, is the authority for QR validation, amount, currency, merchant and payment state.
5. A decoded QR never directly triggers a blockchain transfer. It first becomes a verified Payment Quote.
6. Payment execution is idempotent, auditable and reconciliable.
7. KHQR and VietQR are treated as different schemes under one normalized interface.

## 2. Reference implementations

### 2.1 Telegram Mini App authentication

Reference: https://github.com/thirdweb-example/telegram-mini-app

The thirdweb example demonstrates a Telegram bot launching a Mini App with a signed authentication payload. The bot includes a Telegram user identifier and an expiration timestamp; the backend verifies the signature and expiry before establishing the user identity. KH-VN QR PAY adopts the security pattern, but does not use thirdweb smart wallets.

Important adaptation:

Telegram -> signed/validated identity -> KH-VN backend user -> TRON child wallet.

### 2.2 Cambodia KHQR

Reference: https://github.com/mrrhak/khqr_sdk

The community SDK demonstrates KHQR generation, verify, decode, non-KHQR decoding, KHQR account checking and deeplink generation. It documents Individual and Merchant QR, static and dynamic QR, KHR/USD support and CRC verification.

Important rule: this is a community implementation, not an official NBC SDK. Use the protocol/data rules as a reference and keep KH-VN QR PAY's own tests and compatibility layer.

### 2.3 Vietnam QR

Reference: https://github.com/xuannghia/vietnam-qr-pay

The TypeScript package provides encode/decode support for VietQR, QR đa năng associated with MoMo/ZaloPay, and VNPayQR. It exposes normalized concepts such as provider, merchant, consumer, amount, currency and additional data.

Important rule: the package is an implementation reference. Do not assume every QR provider-specific extension has the same meaning across banks or payment schemes.

### 2.4 Existing KHQRUP payment engine

Reference: https://github.com/cambui365-gif/KHQRUP

KHQRUP is the reference for the existing business/payment flow: Telegram authentication, TRON wallet concepts, USDT balance, QR payment routing, PIN, transaction state and partner settlement. The new design should reuse business ideas but strengthen custody, ledgering, idempotency and reconciliation before production.

## 3. System architecture

```text
                         TELEGRAM
                            |
                            v
                   +------------------+
                   |  Telegram Bot    |
                   |  /start / menu   |
                   +--------+---------+
                            |
                     Mini App button
                            |
                            v
                   +------------------+
                   |   Web Mini App   |
                   | React + Vite     |
                   +--------+---------+
                            |
                      Telegram initData
                            |
                            v
+---------------------------------------------------------------+
|                     KH-VN QR PAY API                          |
|                                                               |
|  Auth   User   Wallet   QR Normalize   Quote   Payment Ledger |
+----+------+------+-----------+-----------+-----------+---------+
     |      |      |           |           |           |
     v      v      v           v           v           v
  Telegram Firestore TRON    QR Parser    Quote DB   Partner API
  verify            Wallet   KHQR/VietQR  + ledger    / settlement
                       |
                       v
                   USDT-TRC20
                       |
                       v
                  TRON network
```

## 4. Service boundaries

### 4.1 Telegram Gateway

Responsibilities:
- Bot commands and Mini App launch.
- Validate Telegram WebApp `initData` on the backend.
- Never treat `initDataUnsafe` as trusted identity.
- Map Telegram user ID to internal user ID.

### 4.2 Identity/Auth service

Recommended flow:

```text
Telegram WebApp
    |
    | initData
    v
POST /api/auth/telegram
    |
    +-- validate hash/signature
    +-- validate auth_date / freshness policy
    +-- extract telegram user id
    +-- create/update user
    +-- issue short-lived access token
```

A separate signed-link flow may be retained for compatibility with the thirdweb reference, but native Telegram WebApp `initData` validation should be the preferred production path when the Mini App is opened normally.

### 4.3 Wallet service

Responsibilities:
- Create one deterministic child wallet per internal user.
- Keep seed/master secret server-side only.
- Return only public wallet address to frontend.
- Sign blockchain transactions through an isolated signing boundary.
- Support deposit monitoring and withdrawal execution.

Production custody target:

```text
App/API
  |
  | wallet operation
  v
Wallet Service
  |
  | signing request
  v
KMS/HSM or isolated signer
  |
  v
TRON RPC
```

Development may use an environment secret, but production should not depend on plaintext master mnemonic/private key in application environment variables.

## 5. QR normalization architecture

All QR inputs enter exactly one pipeline:

```text
raw string / camera result
          |
          v
     pre-validation
          |
          v
      TLV decoder
          |
          +---- malformed -> REJECT
          |
          v
  CRC/checksum verification
          |
          +---- invalid -> REJECT
          |
          v
  scheme/provider detection
          |
      +---+----------------+
      |                    |
     KHQR                VietQR/VNPayQR
      |                    |
      +----------+---------+
                 |
                 v
       NormalizedQRCode
                 |
                 v
          Payment Quote
                 |
               PIN/Policy
                 |
                 v
          Payment Intent
```

### Core invariant

`NormalizedQRCode` is information extracted from a QR.  
`PaymentQuote` is the server-approved amount and destination for a payment.  
`PaymentIntent` is the immutable payment request that can enter settlement.

These three objects must not be collapsed into one object.

## 6. Unified QR model

Suggested TypeScript model:

```ts
export type QRScheme =
  | 'KHQR'
  | 'VIETQR'
  | 'VNPAYQR'
  | 'MOMO_VIET_QR'
  | 'ZALOPAY_VIET_QR'
  | 'UNKNOWN';

export type QRType = 'STATIC' | 'DYNAMIC' | 'UNKNOWN';

export type CurrencyCode = 'KHR' | 'USD' | 'VND' | 'UNKNOWN';

export interface NormalizedQRCode {
  isValid: boolean;
  scheme: QRScheme;
  qrType: QRType;
  currency: CurrencyCode;
  amount: string | null;
  countryCode: string | null;

  merchant: {
    name: string | null;
    city: string | null;
    merchantId: string | null;
    acquiringBank: string | null;
  };

  consumer: {
    bankBin: string | null;
    accountNumber: string | null;
    bakongAccountId: string | null;
  };

  additionalData: {
    billNumber: string | null;
    mobileNumber: string | null;
    storeLabel: string | null;
    loyaltyNumber: string | null;
    reference: string | null;
    customerLabel: string | null;
    terminal: string | null;
    purpose: string | null;
  };

  provider: {
    guid: string | null;
    name: string | null;
  };

  crc: {
    present: boolean;
    expected: string | null;
    actual: string | null;
    valid: boolean;
  };

  raw: string;
}
```

## 7. KHQR normalization rules

Reference fields and concepts:

- Payload format indicator: `00`
- Point of initiation: `01`; `11` static, `12` dynamic
- Merchant account information commonly appears in `29`/`30` in KHQR examples
- Transaction currency: `53`
- Amount: `54`
- Country: `58` and normally `KH`
- Merchant name: `59`
- Merchant city: `60`
- Additional data: `62`
- CRC: `63`
- Unreserved/payment-system specific templates may appear in `80-99`

KHQR must support at minimum:

- Individual KHQR
- Merchant KHQR
- Static QR
- Dynamic QR
- KHR
- USD
- Bakong account identifier
- merchant ID when present
- reference/additional data when present
- CRC verification

Dynamic QR policy:
- Amount must be treated as fixed by the QR when the protocol says the amount is present.
- If the implementation carries an expiration timestamp, reject expired dynamic QR at quote time.
- A static QR may require the payer to enter an amount, subject to the payment product policy.

## 8. VietQR/VNPayQR normalization rules

Reference fields documented by `vietnam-qr-pay` and VietQR field references:

- `00` payload format indicator
- `01` point of initiation: `11` static, `12` dynamic
- `38` merchant account information for VietQR examples
- `52` merchant category code
- `53` transaction currency; VND = `704`
- `54` amount
- `58` country code; Vietnam = `VN`
- `59` merchant name
- `60` merchant city
- `62` additional data
- `63` CRC

VietQR consumer information commonly includes:

```text
38
 ├─ 00 GUID
 └─ 01 beneficiary organization
     ├─ 00 acquirer/bank BIN
     └─ 01 merchant/consumer ID
```

Service code may include values such as `QRIBFTTA` or `QRIBFTTC`.

The parser must retain unknown child tags rather than silently dropping them.

The package also documents VNPayQR fields such as merchant ID, store, terminal and reference data. These fields should be preserved in `additionalData` or provider-specific metadata even when they are not required for current settlement.

## 9. CRC verification standard

Algorithm boundary:

1. Parse TLV structure.
2. Locate CRC field.
3. Require CRC to be the final field for schemes where the protocol requires this.
4. Recompute CRC over the payload including the CRC tag/length prefix but excluding the four CRC characters themselves.
5. Compare case-insensitively.
6. Store both expected and actual values for audit/debugging.

No payment quote may be produced from a QR whose checksum is invalid.

Unit tests must include:
- valid KHQR
- modified amount with stale CRC
- modified merchant with stale CRC
- truncated TLV
- duplicate mandatory tag
- invalid length
- valid VietQR
- valid VNPayQR
- unknown but syntactically valid provider extension

## 10. Currency policy

Canonical internal codes:

```text
KHR = Cambodian Riel
USD = US Dollar
VND = Vietnamese Dong
```

Legacy/UI wording such as “Riel”, “Ria” or local-language labels must not create a new financial currency code. Internally use `KHR`.

Reference numeric ISO/EMV representations:

```text
KHR -> 116
USD -> 840
VND -> 704
```

KHR amount policy:
- Treat KHR as a whole-number currency for KHQR unless a trusted protocol source explicitly indicates otherwise.

USD amount policy:
- Preserve at most 2 decimal places.

VND amount policy:
- Treat as whole-number currency in the normalized payment model.

Never use JavaScript floating point for money calculations. Use decimal strings + a decimal library or integer minor/atomic units appropriate to each currency.

## 11. Amount and FX normalization

The payment engine should use:

```ts
interface PaymentQuote {
  quoteId: string;
  userId: string;
  qrId: string;
  scheme: QRScheme;
  currency: CurrencyCode;
  qrAmount: string;
  settlementCurrency: 'USDT';
  fxRate: string;
  fee: string;
  usdtAmount: string;
  merchantDisplayName: string;
  destinationFingerprint: string;
  expiresAt: string;
  status: 'QUOTED' | 'EXPIRED' | 'CONSUMED' | 'CANCELLED';
}
```

For example:

```text
QR: 100,000 VND
       |
       | trusted FX rate
       v
Quote: 3.95 USDT
       |
       | user confirms + PIN
       v
PaymentIntent
```

The quote must capture the exact FX rate, fee policy and expiry used for the transaction. It must not recalculate silently during settlement.

## 12. Payment state machine

```text
CREATED
   |
   v
QUOTED
   |
   v
AUTH_REQUIRED
   |
   v
AUTHORIZED
   |
   v
PROCESSING
  /   \
 /     \
 v       v
SUCCESS  UNKNOWN
           |
           v
     RECONCILIATION
        /       \
       v         v
   SUCCESS     FAILED

FAILED -> REFUNDED only when money has actually been reserved/debited.
```

Required idempotency fields:

- `paymentId`
- `idempotencyKey`
- `partnerReference`
- `qrFingerprint`
- `blockchainTxId` when applicable
- `createdAt`, `updatedAt`

## 13. Suggested API surface

### Authentication

```text
POST /api/auth/telegram
POST /api/auth/logout
GET  /api/me
```

### Wallet

```text
GET  /api/wallet
GET  /api/wallet/balance
GET  /api/wallet/deposits
POST /api/wallet/withdraw
```

### QR

```text
POST /api/qr/decode
POST /api/qr/verify
POST /api/payment/quote
```

`/api/qr/decode` is read-only.  
`/api/qr/verify` is validation-focused.  
`/api/payment/quote` creates the server-approved commercial terms for the payment.

### Payment

```text
POST /api/payment/intent
POST /api/payment/authorize
GET  /api/payment/:id
POST /api/payment/:id/cancel
```

### Admin/reconciliation

```text
GET  /api/admin/payments
GET  /api/admin/reconciliation
POST /api/admin/reconcile/:id
```

## 14. Database model

Suggested collections/tables:

```text
users
wallets
wallet_addresses
balances
ledger_accounts
ledger_entries
deposits
withdrawals
qr_decodes
payment_quotes
payment_intents
payment_attempts
partner_settlements
webhook_events
audit_logs
rate_snapshots
```

### Double-entry ledger concept

Instead of treating `users.balance` as the only source of truth:

```text
                LEDGER
                  |
      +-----------+-----------+
      |                       |
User USDT asset         System/settlement
      |                       |
   DEBIT/CREDIT           DEBIT/CREDIT
```

The displayed balance is a projection of the ledger, while on-chain balances are reconciled against wallet address records.

## 15. Deposit flow

```text
TRON transaction
      |
      v
listener/indexer
      |
      v
confirmations policy
      |
      v
verify token contract
      |
      v
verify recipient address
      |
      v
check txid duplicate
      |
      v
create deposit
      |
      v
ledger credit
      |
      v
update user balance projection
```

Never credit from an unconfirmed or already-processed transaction.

## 16. QR payment flow

```text
1. User scans QR
2. Frontend sends raw QR only
3. Backend decodes + verifies QR
4. Backend identifies scheme/provider
5. Backend normalizes merchant/account/amount/currency
6. Backend checks dynamic QR expiry where applicable
7. Backend obtains trusted FX rate
8. Backend creates PaymentQuote
9. Frontend displays quote
10. User confirms + enters PIN
11. Backend atomically reserves/debits internal balance
12. Backend submits partner payment or settlement
13. Backend records partner response
14. On success -> ledger finalize
15. On definitive failure -> refund/compensate
16. On timeout/unknown -> reconciliation queue
```

## 17. Security boundaries

### Client must never be authoritative for

- user identity
- account balance
- QR amount
- QR currency
- merchant destination
- FX rate
- payment status
- successful settlement

### Server must enforce

- Telegram authentication validation
- rate limiting
- PIN retry/lockout
- CSRF/session policy appropriate to the Mini App
- idempotency
- replay protection
- QR CRC validation
- QR expiry validation where applicable
- token contract allow-list
- withdrawal limits
- audit trail

## 18. Repository structure for KH-VN QR PAY

```text
KH-VN-QR-PAY/
├── backend/
│   └── src/
│       ├── auth/
│       ├── config/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       │   ├── wallet/
│       │   ├── ledger/
│       │   ├── deposit/
│       │   ├── payment/
│       │   └── reconciliation/
│       ├── qr/
│       │   ├── core/
│       │   ├── schemes/
│       │   │   ├── khqr/
│       │   │   ├── vietqr/
│       │   │   └── vnpayqr/
│       │   ├── normalize/
│       │   └── tests/
│       └── utils/
│
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── features/
│       │   ├── wallet/
│       │   ├── scanner/
│       │   ├── payment/
│       │   └── history/
│       └── services/
│
├── telegram-bot/
│   └── src/
│
├── docs/
│   ├── QR-SPEC.md
│   ├── SECURITY.md
│   ├── PAYMENT-STATE.md
│   └── RECONCILIATION.md
│
└── tests/
    ├── fixtures/
    │   ├── khqr/
    │   ├── vietqr/
    │   └── vnpayqr/
    └── integration/
```

## 19. What to borrow from each reference

| Source | Keep | Do not blindly copy |
|---|---|---|
| thirdweb Telegram Mini App | Telegram bot onboarding pattern, signed auth concept, Mini App flow | thirdweb smart wallet dependency for TRC-20 custody |
| mrrhak/khqr_sdk | KHQR decode/verify concepts, static/dynamic, KHR/USD, CRC, Bakong fields | Assume community SDK is the official NBC implementation |
| xuannghia/vietnam-qr-pay | VietQR/VNPayQR field model, provider/merchant/consumer abstraction, TypeScript implementation ideas | Treat all provider-specific extensions as universal |
| KHQRUP | TRON/USDT wallet business flow, payment routing, PIN, Telegram account mapping | Single balance as ledger, plaintext master secret, non-idempotent settlement |

## 20. Implementation phases

### Phase 1 — QR standard layer

- Replace the current generic parser with scheme adapters.
- Build KHQR decoder/validator.
- Build VietQR decoder/validator.
- Add VNPayQR provider adapter.
- Add CRC test vectors.
- Return the unified `NormalizedQRCode` model.

### Phase 2 — Telegram identity

- Mini App initialization.
- Telegram `initData` validation.
- User upsert.
- Short-lived session/JWT.
- Bot launch button.

### Phase 3 — TRON wallet

- Deterministic user -> child wallet derivation.
- Isolated signer abstraction.
- Deposit indexer/listener.
- USDT contract allow-list.
- Confirmation policy.

### Phase 4 — Ledger and payment quote

- Double-entry ledger.
- Quote creation and expiration.
- FX snapshot.
- Fee rules.
- PIN authorization.

### Phase 5 — Settlement

- Partner API adapter.
- Idempotency.
- Retry policy.
- UNKNOWN state + reconciliation.
- Refund/compensation.

### Phase 6 — Production hardening

- KMS/HSM.
- Monitoring.
- Alerts.
- Audit log.
- Backups.
- Key rotation/recovery procedure.
- Penetration/security testing.

## 21. Acceptance tests

A release is not considered payment-ready until these pass:

### QR

- Valid KHQR -> decoded.
- Invalid KHQR CRC -> rejected.
- Valid KHR KHQR -> KHR normalized.
- Valid USD KHQR -> USD normalized.
- Valid dynamic KHQR -> amount and expiry enforced.
- Valid VietQR -> VND normalized.
- Valid VNPayQR -> provider/merchant/reference normalized.
- Unknown provider extension -> retained, not corrupted.

### Wallet

- New Telegram user gets exactly one child address.
- Repeated login does not create a second wallet.
- Private key never reaches frontend logs or API response.
- Duplicate deposit txid cannot credit twice.

### Payment

- Same idempotency key cannot create two settlements.
- User cannot alter amount after quote creation.
- User cannot alter currency after quote creation.
- Failed partner call does not silently become SUCCESS.
- Partner timeout enters UNKNOWN/reconciliation rather than unsafe refund.
- Ledger and partner state can be reconciled.

## 22. Product boundary

KH-VN QR PAY is a wallet/payment orchestration system. QR decoding identifies the requested payment destination and commercial terms; it does not itself move money.

For real-money production deployment, the design must be reviewed for applicable payment-services, AML/KYC, custody, consumer-protection and cross-border requirements in each operating jurisdiction before launch.

## 23. References

- thirdweb Telegram Mini App: https://github.com/thirdweb-example/telegram-mini-app
- KHQR SDK (community): https://github.com/mrrhak/khqr_sdk
- Vietnam QR Pay: https://github.com/xuannghia/vietnam-qr-pay
- KHQRUP: https://github.com/cambui365-gif/KHQRUP
- VietQR field reference: https://github.com/iamv4g/vietqr.dart
- VietQR API merchant connection: https://api.vietqr.vn/vi/tong-quan/khai-bao-merchant-connection
