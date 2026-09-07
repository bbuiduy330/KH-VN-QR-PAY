import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
const api=spawn(process.execPath,['--env-file-if-exists=.env','services/api/server.mjs'],{stdio:'inherit'});
const web=spawn(process.execPath,[resolve('node_modules/vite/bin/vite.js'),'--host','0.0.0.0'],{cwd:'apps/web',stdio:'inherit'});
let closing=false;
const stop=()=>{ if(closing)return;closing=true;api.kill();web.kill(); };
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,stop);
for(const child of [api,web]) child.on('exit',code=>{stop();process.exitCode=code || 0;});
