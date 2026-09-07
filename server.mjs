import http from 'node:http';
import { handle } from './handler.mjs';
const server=http.createServer(async(req,res)=>{
  try {
    let chunks=[],size=0;
    for await(const chunk of req) { size+=chunk.length; if(size>16384) { res.writeHead(413);res.end('Request too large');return; } chunks.push(chunk); }
    const raw=Buffer.concat(chunks).toString();
    const result=await handle({method:req.method,path:new URL(req.url,'http://localhost').pathname.replace(/^\/api/,''),body:raw?JSON.parse(raw):{},headers:req.headers});
    res.writeHead(result.status,result.headers);res.end(JSON.stringify(result.body));
  } catch {res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Yêu cầu không hợp lệ.'}));}
});
server.listen(Number(process.env.PORT || 3001),'127.0.0.1',()=>console.log('KH-VN demo API: http://localhost:3001/api/health'));
