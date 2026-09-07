import { createHmac, timingSafeEqual } from 'node:crypto';
const mac = (key,value) => createHmac('sha256',key).update(value).digest();
export function verifyTelegram(initData, botToken, now = Math.floor(Date.now()/1000)) {
  if (!botToken) throw new Error('Chưa cấu hình Telegram bot.');
  if (typeof initData !== 'string' || initData.length > 12000) throw new Error('Dữ liệu Telegram không hợp lệ.');
  const params=new URLSearchParams(initData), keys=[...params.keys()];
  if(new Set(keys).size !== keys.length) throw new Error('Dữ liệu Telegram bị trùng trường.');
  const hash=params.get('hash');
  if(!/^[a-f0-9]{64}$/i.test(hash || '')) throw new Error('Thiếu chữ ký Telegram.');
  params.delete('hash');
  const data=[...params.entries()].sort(([a],[b]) => a < b ? -1 : a > b ? 1:0).map(([key,value])=>`${key}=${value}`).join('\n');
  if(!timingSafeEqual(mac(mac('WebAppData',botToken),data),Buffer.from(hash,'hex'))) throw new Error('Chữ ký Telegram không đúng.');
  const authDate=Number(params.get('auth_date'));
  if(!Number.isSafeInteger(authDate) || now-authDate>300 || authDate>now+30) throw new Error('Phiên Telegram đã hết hạn. Hãy đóng và mở lại Mini App.');
  const user=JSON.parse(params.get('user') || 'null');
  if(!user || !Number.isSafeInteger(user.id) || user.id<=0 || typeof user.first_name!=='string') throw new Error('Không xác định được tài khoản Telegram.');
  return {id:String(user.id),firstName:user.first_name.slice(0,100)};
}
export function createSession(user,secret,now=Math.floor(Date.now()/1000)) {
  if(!secret || secret.length<32) throw new Error('SESSION_SECRET phải có ít nhất 32 ký tự.');
  const payload=Buffer.from(JSON.stringify({sub:user.id,name:user.firstName,iat:now,exp:now+900,aud:'khvn-demo'})).toString('base64url');
  return payload+'.'+mac(secret,payload).toString('base64url');
}
export function readSession(token,secret,now=Math.floor(Date.now()/1000)) {
  if(!secret || secret.length<32 || typeof token!=='string' || token.length>2000) throw new Error('Chưa đăng nhập.');
  const parts=token.split('.'); if(parts.length!==2) throw new Error('Phiên không hợp lệ.');
  const signature=Buffer.from(parts[1],'base64url'), expected=mac(secret,parts[0]);
  if(signature.length!==expected.length || !timingSafeEqual(signature,expected)) throw new Error('Phiên không hợp lệ.');
  const data=JSON.parse(Buffer.from(parts[0],'base64url').toString());
  if(!Number.isFinite(data.exp)|| data.exp<=now || data.aud!=='khvn-demo'|| !data.sub) throw new Error('Phiên đã hết hạn.');
  return {id:data.sub,firstName:data.name};
}
