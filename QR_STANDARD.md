# KH-VN QR PAY — QR Standardization

This layer is intentionally independent from the wallet and payment transport.

## Canonical pipeline

`raw QR -> strict TLV parse -> CRC verification -> scheme classification -> account extraction -> currency/amount normalization -> payment quote`

## Supported normalized currencies

| QR code | Currency | Display |
|---|---|---|
| 116 | KHR | Cambodian Riel |
| 840 | USD | US Dollar |
| 704 | VND | Vietnamese Dong |

The referenced community SDK `mrrhak/khqr_sdk` documents the same currency codes, separate verify/decode APIs, static/dynamic QR handling, individual/merchant account containers, additional data and timestamp handling. This project implements its own TypeScript normalization layer rather than copying SDK source.

## KHQR fields we care about

- `00`: payload format indicator
- `01`: point of initiation (`11` static, `12` dynamic)
- `29` / `30`: individual / merchant account information container
- `52`: merchant category code
- `53`: transaction currency
- `54`: transaction amount
- `58`: country
- `59`: merchant name
- `60`: merchant city
- `62`: additional data such as bill number, mobile number, store/terminal labels
- `63`: CRC
- `99`: timestamp extension used by this SDK for creation/expiration data

Dynamic payment QR must be treated more strictly than static QR. The referenced SDK rejects dynamic QR without amount and timestamp metadata.

## Security rule

The Mini App sends only `rawQrData`. The backend re-decodes and re-validates it. Client-supplied merchant name, amount or currency must never be authoritative.
