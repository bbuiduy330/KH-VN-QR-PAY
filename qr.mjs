import { units } from './money.mjs';
export function crc16(text) {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(text)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = ((crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
export function tlv(raw) {
  const chars = Array.from(raw); const tags = {}; let i = 0;
  while (i < chars.length) {
    const header = chars.slice(i, i + 4).join('');
    if (!/^\d{4}$/.test(header)) throw new Error('Mã QR bị thiếu hoặc sai cấu trúc. Hãy dùng ảnh rõ hơn.');
    const tag = header.slice(0, 2), length = Number(header.slice(2));
    if (!length || i + 4 + length > chars.length || Object.hasOwn(tags, tag)) throw new Error('Mã QR có độ dài sai hoặc trường dữ liệu bị trùng.');
    tags[tag] = chars.slice(i + 4, i + 4 + length).join(''); i += 4 + length;
  }
  return tags;
}
export function decodeQR(input, now = Date.now()) {
  if (typeof input !== 'string' || input.length > 4096) throw new Error('Mã QR không hợp lệ hoặc quá dài.');
  const raw = input.trim();
  if (!raw.startsWith('000201')) throw new Error('Đây chưa phải mã thanh toán KHQR hoặc VietQR được hỗ trợ.');
  const tags = tlv(raw);
  if (!/6304[\da-f]{4}$/i.test(raw) || !/^[\da-f]{4}$/i.test(tags['63'] || '') || crc16(raw.slice(0, -4)) !== tags['63'].toUpperCase()) throw new Error('Mã QR không qua kiểm tra CRC. Vui lòng quét lại mã gốc.');
  if (tags['00'] !== '01' || !['11','12'].includes(tags['01'] || '11')) throw new Error('Phiên bản hoặc loại QR chưa hỗ trợ.');
  const currency = { '116':'KHR', '840':'USD', '704':'VND' }[tags['53']];
  if (!currency) throw new Error('Mã QR dùng loại tiền chưa hỗ trợ.');
  const qrType = tags['01'] === '12' ? 'DYNAMIC' : 'STATIC';
  let scheme, account, bank, accountType, provider = '', expiresAt = null, accountTags = {};
  if (tags['58'] === 'KH' && (tags['29'] || tags['30'])) {
    if (tags['29'] && tags['30']) throw new Error('Mã KHQR chứa nhiều tài khoản nhận không rõ ràng.');
    if (!['USD','KHR'].includes(currency)) throw new Error('KHQR phải dùng USD hoặc KHR.');
    scheme = 'KHQR'; accountTags = tlv(tags['29'] || tags['30']); account = accountTags['00']; bank = accountTags['02'] || 'Tài khoản Bakong'; accountType = tags['30'] ? 'MERCHANT' : 'INDIVIDUAL';
    if (!account || !account.includes('@')) throw new Error('KHQR thiếu tài khoản Bakong hợp lệ.');
    if (!tags['59'] || !tags['60']) throw new Error('KHQR thiếu tên hoặc thành phố người nhận.');
    if (tags['99']) {
      const timestamp = tlv(tags['99']);
      for (const key of ['00','01']) if (timestamp[key] && !/^\d{13}$/.test(timestamp[key])) throw new Error('Thời gian trong KHQR không hợp lệ.');
      expiresAt = timestamp['01'] ? Number(timestamp['01']) : null;
      if (expiresAt && timestamp['00'] && expiresAt <= Number(timestamp['00'])) throw new Error('Khoảng thời gian QR không hợp lệ.');
    }
    if (qrType === 'DYNAMIC' && !expiresAt) throw new Error('KHQR động thiếu hạn sử dụng. Bản demo chưa hỗ trợ mã này.');
  } else if (tags['58'] === 'VN' && tags['38']) {
    scheme = 'VIETQR'; accountTags = tlv(tags['38']); provider = accountTags['00'];
    if (provider !== 'A000000727' || !['QRIBFTTA','QRIBFTTC'].includes(accountTags['02'])) throw new Error('Nhà cung cấp hoặc dịch vụ VietQR chưa hỗ trợ.');
    const beneficiary = tlv(accountTags['01'] || ''); bank = beneficiary['00']; account = beneficiary['01']; accountType = accountTags['02'] === 'QRIBFTTC' ? 'CARD' : 'ACCOUNT';
    if (!/^\d{6}$/.test(bank || '') || !account || account.length > 32) throw new Error('VietQR thiếu ngân hàng hoặc tài khoản nhận hợp lệ.');
    if (currency !== 'VND') throw new Error('VietQR phải dùng VND.');
  } else if (tags['58'] === 'VN' && tags['26']) {
    accountTags = tlv(tags['26']);
    if (accountTags['00'] !== 'A000000775' || !accountTags['01'] || currency !== 'VND') throw new Error('Mã nhà cung cấp VNPayQR chưa hỗ trợ.');
    scheme = 'VNPAYQR'; account = accountTags['01']; bank = 'VNPay'; provider = accountTags['00']; accountType = 'MERCHANT';
  } else throw new Error('Chưa hỗ trợ nhà cung cấp của mã QR này.');
  const amount = tags['54'] ?? null;
  if (amount !== null && units(amount, currency === 'USD' ? 2 : 0) <= 0n) throw new Error('Số tiền trong mã QR phải lớn hơn 0.');
  if (qrType === 'DYNAMIC' && amount === null) throw new Error('Mã QR động thiếu số tiền.');
  if (expiresAt && expiresAt <= now) throw new Error('Mã QR đã hết hạn. Hãy xin người nhận mã mới.');
  const additional = tags['62'] ? tlv(tags['62']) : {};
  return { raw, isValid:true, scheme, qrType, currency, amount, account, bank, accountType, provider, merchant:tags['59'] || 'Chưa có tên trong QR', city:tags['60'] || '', purpose:additional['08'] || additional['05'] || '', expiresAt, crc:tags['63'], tags, accountTags, additional, payable:scheme !== 'VNPAYQR', warning: scheme === 'VNPAYQR' ? 'VNPayQR hiện hỗ trợ đọc thông tin; chưa có tuyến thanh toán demo.' : null };
}
export const BANKS = {'970436':'Vietcombank','970422':'MB Bank','970415':'VietinBank','970418':'BIDV','970407':'Techcombank','970416':'ACB','970403':'Sacombank','970432':'VPBank','970423':'TPBank','970405':'Agribank'};
export const bankName = value => BANKS[value] || value;
