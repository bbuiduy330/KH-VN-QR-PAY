import { handle } from '../services/api/handler.mjs';
export default async function handler(req,res) {
  const url=new URL(req.url,'https://localhost');
  const path='/'+String(req.query?.path || url.searchParams.get('path') || url.pathname.replace(/^\/api\/?/,'')).replace(/^\//,'');
  let body=req.body || {};
  try {
    if(typeof body==='string') { if(Buffer.byteLength(body)>16384) throw new Error(); body=JSON.parse(body); }
    if(Buffer.byteLength(JSON.stringify(body))>16384) throw new Error();
  } catch { return res.status(400).json({error:'Nội dung yêu cầu không hợp lệ hoặc quá lớn.'}); }
  const result=await handle({method:req.method,path,body,headers:req.headers});
  for(const [key,value] of Object.entries(result.headers)) res.setHeader(key,value);
  res.status(result.status).json(result.body);
}
