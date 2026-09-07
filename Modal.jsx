import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
export default function Modal({title,children,onClose,wide=false}) {
  const ref=useRef(null),closeRef=useRef(onClose),id=useId();closeRef.current=onClose;
  useEffect(()=>{ const dialog=ref.current; dialog.showModal();dialog.querySelector('input')?.focus(); const close=e=>{e.preventDefault();closeRef.current();}; dialog.addEventListener('cancel',close); return()=>{dialog.removeEventListener('cancel',close);dialog.close();}; },[]);
  return <dialog ref={ref} className={'modal '+(wide?'wide':'')} aria-labelledby={id} onClick={e=>{if(e.target===ref.current)onClose();}}><div className="modal-head"><h2 id={id}>{title}</h2><button className="icon-button" aria-label="Đóng" onClick={onClose}><X/></button></div>{children}</dialog>;
}
