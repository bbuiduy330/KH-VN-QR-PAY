export const SCALE = 1_000_000n;
export const RATES = Object.freeze({ USD: '1', KHR: '4100', VND: '25500' });
export function units(value, decimals = 6) {
  const s = String(value ?? '').trim();
  if (!/^\d+(?:\.\d+)?$/.test(s) || s.length > 24) throw new Error('Nhập số tiền hợp lệ, không dùng dấu phân cách hàng nghìn.');
  const [whole, fraction = ''] = s.split('.');
  if (fraction.length > decimals) throw new Error(`Số tiền chỉ được có tối đa ${decimals} chữ số thập phân.`);
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || 0);
}
export function decimal(n, decimals = 6) {
  n = BigInt(n); const sign = n < 0n ? '-' : ''; n = n < 0n ? -n : n;
  const s = n.toString().padStart(decimals + 1, '0');
  return sign + (decimals ? s.slice(0, -decimals) + '.' + s.slice(-decimals) : s);
}
export function display(value, currency = 'USDT') {
  const [whole, fraction = ''] = String(value).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const trimmed = fraction.replace(/0+$/, '');
  return grouped + (trimmed ? ',' + trimmed : '') + ' ' + currency;
}
export const ceilDiv = (n, d) => (n + d - 1n) / d;
export function price(amount, currency) {
  if (!RATES[currency]) throw new Error('Chưa hỗ trợ loại tiền này.');
  const decimals = currency === 'USD' ? 2 : 0;
  const source = units(amount, decimals);
  if (source <= 0n) throw new Error('Số tiền phải lớn hơn 0.');
  const base = ceilDiv(source * SCALE, BigInt(RATES[currency]) * 10n ** BigInt(decimals));
  if (base > 10_000n * SCALE) throw new Error('Demo hỗ trợ tối đa 10.000 USDT mỗi giao dịch.');
  const fee = 100_000n + ceilDiv(base * 30n, 10_000n);
  return { base: decimal(base), fee: decimal(fee), total: decimal(base + fee), rate: RATES[currency], feeLabel: '0,10 USDT + 0,3%', demo: true };
}
