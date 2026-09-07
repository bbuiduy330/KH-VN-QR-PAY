// Optional local polling bot. Do NOT run polling on a Vercel Function.
const token=process.env.TELEGRAM_BOT_TOKEN, appUrl=process.env.WEB_APP_URL;
if(!token || !appUrl || new URL(appUrl).protocol!=='https:') throw new Error('Cần TELEGRAM_BOT_TOKEN và WEB_APP_URL HTTPS trong .env.');
async function call(method,payload={}) {
  const response=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(40000)});
  const result=await response.json(); if(!result.ok) throw new Error(`Telegram API ${method} failed (${result.error_code || response.status})`); return result.result;
}
let offset=0;
console.log('Bot demo đang chạy. Mở Telegram và gửi /start.');
while(true) {
  try {
    const updates=await call('getUpdates',{offset,timeout:25,allowed_updates:['message']});
    for(const update of updates) {
      const message=update.message;
      if(message?.chat?.type==='private' && /^\/(start|help)(@\w+)?(?:\s|$)/.test(message.text || '')) {
        await call('sendMessage',{chat_id:message.chat.id,text:'KH-VN QR PAY\nMở ví để trải nghiệm thanh toán KHQR & VietQR. Đây là bản demo, không chuyển tiền thật.',reply_markup:{inline_keyboard:[[{text:'Mở ví demo',web_app:{url:appUrl}}]]}});
      }
      offset=update.update_id+1;
    }
  } catch(error) { console.error(error.message.startsWith('Telegram API')?error.message:'Không kết nối được Telegram. Thử lại sau 5 giây.'); await new Promise(resolve=>setTimeout(resolve,5000)); }
}
