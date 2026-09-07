import React,{useEffect,useRef,useState} from 'react';
import jsQR from 'jsqr';
import {Camera,ImageUp,ScanLine,LoaderCircle} from 'lucide-react';
export default function Scanner({onScan,onError}) {
  const video=useRef(null),file=useRef(null),stream=useRef(null),frame=useRef(null),alive=useRef(true);
  const [active,setActive]=useState(false),[busy,setBusy]=useState(false);
  function stop(){stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;cancelAnimationFrame(frame.current);if(alive.current)setActive(false);}
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;stop();};},[]);
  function read(source,width,height){
    const scale=Math.min(1,1600/Math.max(width,height)),canvas=document.createElement('canvas');canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0,canvas.width,canvas.height);
    const img=ctx.getImageData(0,0,canvas.width,canvas.height);return jsQR(img.data,img.width,img.height,{inversionAttempts:'attemptBoth'})?.data;
  }
  async function start(){
    setBusy(true);
    try {
      if(!navigator.mediaDevices?.getUserMedia) throw new Error('Trình duyệt chưa hỗ trợ camera. Anh có thể tải ảnh QR hoặc dùng mã mẫu bên dưới.');
      const result=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280}},audio:false});
      if(!alive.current){result.getTracks().forEach(t=>t.stop());return;}
      stream.current=result;video.current.srcObject=result;await video.current.play();setActive(true);
      let last=0;
      const tick=time=>{if(!alive.current || !stream.current)return;if(time-last>180 && video.current?.readyState>=2){last=time;const text=read(video.current,video.current.videoWidth,video.current.videoHeight);if(text){stop();onScan(text);return;}}frame.current=requestAnimationFrame(tick);};frame.current=requestAnimationFrame(tick);
    } catch(error){stop();onError(error.name==='NotAllowedError'?'Camera chưa được cho phép. Mở quyền camera của trình duyệt, hoặc chọn tải ảnh QR.':error.message);}
    finally{if(alive.current)setBusy(false);}
  }
  async function upload(event){
    const selected=event.target.files?.[0];event.target.value='';if(!selected)return;
    if(selected.size>12*1024*1024){onError('Chọn ảnh nhỏ hơn 12 MB.');return;}
    setBusy(true);stop();let bitmap;
    try{bitmap=await createImageBitmap(selected);const text=read(bitmap,bitmap.width,bitmap.height);if(!text)throw new Error('Chưa tìm thấy mã QR. Hãy chọn ảnh rõ, chụp đủ bốn góc của mã.');if(alive.current)onScan(text);}catch(error){if(alive.current)onError(error.message || 'Không đọc được ảnh này. Hãy thử PNG hoặc JPG.');}finally{bitmap?.close();if(alive.current)setBusy(false);}
  }
  return <><div className={'camera-box '+(active?'active':'')}><video ref={video} muted playsInline aria-label="Hình ảnh camera quét QR"/><div className="scan-outline">{!active&&<ScanLine size={66} strokeWidth={1.3}/>}</div>{!active&&<div className="camera-copy"><strong>Đặt mã QR trong khung hình</strong><span>Hỗ trợ KHQR và VietQR</span></div>}{active&&<div className="camera-live">Đang tìm mã QR…</div>}</div><div className="button-row"><button className="button primary" disabled={busy} onClick={active?stop:start}>{busy?<LoaderCircle className="spin"/>:<Camera/>}{active?'Tắt camera':'Mở camera'}</button><button className="button secondary" disabled={busy} onClick={()=>file.current.click()}><ImageUp/>Tải ảnh QR</button></div><input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={upload}/></>;
}
