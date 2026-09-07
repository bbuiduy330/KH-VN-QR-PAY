import { decodeQR } from '../../packages/core/qr.mjs';
import { quote } from '../../packages/core/demo.mjs';
import { verifyTelegram,createSession,readSession } from './auth.mjs';
export async function handle({method,path,body={},headers={}},env=process.env) {
  const reply=(status,data,extra={})=>({status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra},body:data});
  if(method==='GET' && path==='/health') return reply(200,{ok:true,mode:'demo',version:'1.0.0',realPaymentsEnabled:false});
  if(method==='POST' && ['/payment/intent','/wallet/withdraw'].includes(path)) return reply(503,{error:'Tiền thật chưa được bật. Bản phát hành này chỉ dùng để demo.',code:'REAL_PAYMENTS_DISABLED'});
  try {
    if(method==='POST' && path==='/auth/telegram') {
      if(!env.TELEGRAM_BOT_TOKEN || !env.SESSION_SECRET || env.SESSION_SECRET.length<32) return reply(503,{error:'Chưa cấu hình xác thực Telegram. Anh vẫn có thể dùng tài khoản demo.',code:'TELEGRAM_NOT_CONFIGURED'});
      const user=verifyTelegram(body.initData,env.TELEGRAM_BOT_TOKEN);
      const session=createSession(user,env.SESSION_SECRET);
      return reply(200,{user,verified:true,mode:'demo'},{'Set-Cookie':`khvn_session=${session}; HttpOnly; ${env.VERCEL?'Secure; ':''}SameSite=Lax; Path=/api; Max-Age=900`});
    }
    if(method==='POST' && path==='/auth/logout') return reply(200,{ok:true},{'Set-Cookie':'khvn_session=; HttpOnly; SameSite=Lax; Path=/api; Max-Age=0'});
    if(method==='GET' && path==='/me') {
      const token=(headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith('khvn_session='))?.slice(13);
      return reply(200,{user:readSession(token,env.SESSION_SECRET),verified:true,mode:'demo'});
    }
    if(method==='POST' && path==='/qr/decode') return reply(200,{qr:decodeQR(body.rawQrData)});
    if(method==='POST' && path==='/payment/quote') return reply(200,{quote:quote(body.rawQrData,body.amount),mode:'demo',executable:false});
    return reply(404,{error:'Không tìm thấy API.'});
  } catch(error) { return reply(path.startsWith('/auth') || path==='/me' ? 401:400,{error:error.message}); }
}
