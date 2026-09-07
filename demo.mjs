import { decodeQR } from './qr.mjs';
import { units, decimal, price } from './money.mjs';
export const STORAGE_KEY = 'khvn-demo-v1';
const uid = () => globalThis.crypto.randomUUID();
function entry(from,to,amount,reference) { return {id:uid(),from,to,amount,reference}; }
export function initialState() {
  const id = 'DEMO-OPENING';
  return {version:1,revision:0,transactions:[{id,kind:'DEPOSIT',merchant:'Số dư trải nghiệm',total:'250.000000',status:'SUCCESS',createdAt:Date.now(),currency:'USDT',amount:'250',demo:true}],ledger:[entry('DEMO_SOURCE','USER_AVAILABLE','250.000000',id)],pinAttempts:0,lockedUntil:0};
}
export function validateState(state) {
  if (!state || state.version !== 1 || !Array.isArray(state.transactions) || !Array.isArray(state.ledger) || !Number.isInteger(state.revision)) throw new Error('Dữ liệu demo không đúng phiên bản.');
  for (const e of state.ledger) if (!e.from || !e.to || e.from === e.to || units(e.amount) <= 0n) throw new Error('Dữ liệu ví demo bị lỗi.');
  for (const t of state.transactions) if (!t.id || !['SUCCESS','FAILED','UNKNOWN'].includes(t.status) || !['PAYMENT','DEPOSIT'].includes(t.kind) || units(t.total) <= 0n || !Number.isFinite(t.createdAt)) throw new Error('Dữ liệu giao dịch demo bị lỗi.');
  return state;
}
export function balance(state, account = 'USER_AVAILABLE') {
  let total = 0n;
  for (const e of state.ledger) { if (e.to === account) total += units(e.amount); if (e.from === account) total -= units(e.amount); }
  return decimal(total);
}
export function quote(raw, requestedAmount, now = Date.now()) {
  const qr = decodeQR(raw,now);
  if (!qr.payable) throw new Error(qr.warning);
  if (qr.amount && requestedAmount && units(qr.amount,qr.currency === 'USD' ? 2:0) !== units(requestedAmount,qr.currency === 'USD' ? 2:0)) throw new Error('Không thể sửa số tiền được ghi trong mã QR.');
  const amount = qr.amount || requestedAmount;
  return {id:uid(),raw,qr,amount,...price(amount,qr.currency),createdAt:now,expiresAt:Math.min(now + 120000,qr.expiresAt || Infinity)};
}
export function authorize(state, q, pin, outcome='SUCCESS', now=Date.now()) {
  validateState(state);
  const duplicate = state.transactions.find(t => t.quoteId === q.id);
  if (duplicate) return {state,transaction:duplicate};
  if (!['SUCCESS','FAILED','UNKNOWN'].includes(outcome)) throw new Error('Tình huống demo không hợp lệ.');
  if (now < state.lockedUntil) throw new Error('Nhập sai PIN quá nhiều lần. Vui lòng chờ 30 giây.');
  if (pin !== '123456') {
    const next = structuredClone(state); next.pinAttempts++; if(next.pinAttempts >= 5) { next.lockedUntil = now + 30000; next.pinAttempts = 0; } next.revision++;
    return {state:next,error:next.lockedUntil > now ? 'Tạm khóa 30 giây sau 5 lần nhập sai.':'PIN demo là 123456. Vui lòng thử lại.'};
  }
  if (!Number.isFinite(q.expiresAt) || now >= q.expiresAt || q.createdAt > now || q.expiresAt > q.createdAt + 120000) throw new Error('Báo giá đã hết hạn. Vui lòng lấy báo giá mới.');
  if (state.transactions.some(t=>t.status==='UNKNOWN' && t.raw===q.raw)) throw new Error('Mã QR này có giao dịch đang chờ đối soát. Vui lòng kiểm tra Lịch sử trước khi thanh toán lại.');
  const qr = decodeQR(q.raw,now); const amount = qr.amount || q.amount; const recalculated = price(amount, qr.currency);
  if (!qr.payable || q.total !== recalculated.total || q.fee !== recalculated.fee || q.rate !== recalculated.rate || q.amount !== amount) throw new Error('Báo giá không hợp lệ. Vui lòng tạo lại.');
  if (units(balance(state)) < units(q.total)) throw new Error('Số dư demo chưa đủ. Hãy nạp thêm tiền demo trong mục Ví.');
  const next = structuredClone(state), id = 'DEMO-' + uid().slice(0,8).toUpperCase();
  const transaction = {id,quoteId:q.id,kind:'PAYMENT',raw:q.raw,status:outcome,merchant:qr.merchant,account:qr.account,bank:qr.bank,scheme:qr.scheme,currency:qr.currency,amount,total:q.total,fee:q.fee,rate:q.rate,createdAt:now,demo:true};
  next.ledger.push(entry('USER_AVAILABLE','USER_HELD',q.total,id));
  if(outcome === 'SUCCESS') next.ledger.push(entry('USER_HELD','PARTNER_SETTLEMENT',q.total,id));
  if(outcome === 'FAILED') next.ledger.push(entry('USER_HELD','USER_AVAILABLE',q.total,id));
  next.transactions.unshift(transaction); next.pinAttempts=0; next.lockedUntil=0; next.revision++;
  return {state:next,transaction};
}
export function reconcile(state, id, outcome) {
  if (!['SUCCESS','FAILED'].includes(outcome)) throw new Error('Kết quả đối soát không hợp lệ.');
  const next = structuredClone(state), transaction = next.transactions.find(t=>t.id===id);
  if(!transaction || transaction.status !== 'UNKNOWN') throw new Error('Giao dịch không ở trạng thái chờ đối soát.');
  transaction.status = outcome; transaction.reconciledAt = Date.now();
  next.ledger.push(entry('USER_HELD',outcome === 'SUCCESS' ? 'PARTNER_SETTLEMENT':'USER_AVAILABLE',transaction.total,id)); next.revision++;
  return {state:next,transaction};
}
export function deposit(state, amount) {
  const n=units(amount); if(n <= 0n || n > 10000n * 1000000n) throw new Error('Nhập số tiền demo từ trên 0 đến 10.000 USDT.');
  const next=structuredClone(state), id='DEMO-'+uid().slice(0,8).toUpperCase();
  const transaction={id,kind:'DEPOSIT',merchant:'Nạp tiền demo',total:decimal(n),currency:'USDT',amount:decimal(n),status:'SUCCESS',createdAt:Date.now(),demo:true};
  next.ledger.push(entry('DEMO_SOURCE','USER_AVAILABLE',decimal(n),id)); next.transactions.unshift(transaction); next.revision++;
  return {state:next,transaction};
}
