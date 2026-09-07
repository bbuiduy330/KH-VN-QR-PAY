> ARCHIVED: Old design notes from commit 68a2ec3. Not the current implementation. Read the root README.md.

# KH-VN QR PAY

Telegram Mini App wallet/payment foundation for **USDT-TRC20 + KHQR + VietQR/VNPayQR**.

## Monorepo

```text
KH-VN-QR-PAY/
├── apps/
│   ├── web/                 # React + Vite — Vercel target
│   └── bot/                 # Telegram bot (grammY)
├── services/
│   └── api/                 # Express API
├── packages/
│   └── qr-standard/         # Shared QR normalization layer
├── docs/
└── vercel.json
```

## Demo

The web app supports `VITE_DEMO_MODE=true`. It runs without Firebase, TRON credentials, a private key, or a live backend. Demo auth uses a local user and the QR normalization layer can be exercised from the UI.

## Local

```bash
npm install
npm --workspace apps/web run dev
npm --workspace services/api run dev
npm --workspace apps/bot run dev
```

## Production safety

Never put a master mnemonic/private key into frontend or Vercel public environment variables. Wallet signing must stay behind a protected backend/worker and ideally KMS/HSM.
