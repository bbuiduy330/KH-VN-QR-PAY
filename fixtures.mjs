import { crc16 } from './qr.mjs';
// Synthetic QA fixtures; never use these destinations for real payments.
export const field = (tag, value) => tag + Array.from(value).length.toString().padStart(2,'0') + value;
export const finish = raw => raw + '6304' + crc16(raw + '6304');
export function sampleQR(type = 'USD', now = Date.now()) {
  let raw = field('00','01') + field('01',type === 'DYNAMIC' ? '12':'11');
  if (type === 'VND') raw += field('38',field('00','A000000727') + field('01',field('00','970436') + field('01','0000000000')) + field('02','QRIBFTTA'));
  else raw += field('29',field('00','demo_shop@demo') + field('01','000000000') + field('02','DEMO BANK'));
  raw += field('52','5999') + field('53',type === 'VND' ? '704' : type === 'KHR' ? '116' : '840');
  if (type !== 'STATIC') raw += field('54',type === 'VND' ? '125000' : type === 'KHR' ? '20000' : '4.50');
  raw += field('58',type === 'VND' ? 'VN':'KH') + field('59',type === 'VND' ? 'TIEM CAFE DEMO':'PHNOM CAFE DEMO') + field('60',type === 'VND' ? 'HO CHI MINH':'PHNOM PENH') + field('62',field('08','DEMO ONLY'));
  if (type === 'DYNAMIC') raw += field('99',field('00',String(now)) + field('01',String(now + 300000)));
  return finish(raw);
}
export const SAMPLES = [{id:'USD',title:'Cà phê · Campuchia',label:'4,50 USD',country:'KH',description:'KHQR · đô la Mỹ'},{id:'KHR',title:'Cửa hàng · Campuchia',label:'20.000 KHR',country:'KH',description:'KHQR · riel Campuchia'},{id:'VND',title:'Tiệm cà phê · Việt Nam',label:'125.000 VND',country:'VN',description:'VietQR · đồng Việt Nam'},{id:'STATIC',title:'Tự nhập số tiền',label:'QR tĩnh',country:'KH',description:'KHQR · không có sẵn số tiền'}];
