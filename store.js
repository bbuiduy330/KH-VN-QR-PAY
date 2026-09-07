import {initialState,validateState,STORAGE_KEY} from '@khvn/core/demo';
export function loadState(){ const raw=localStorage.getItem(STORAGE_KEY);return raw?validateState(JSON.parse(raw)):initialState(); }
export async function changeState(action) {
  if(!navigator.locks) throw new Error('Trình duyệt chưa hỗ trợ khóa giao dịch. Hãy dùng Chrome, Edge hoặc Safari mới để test thanh toán.');
  return navigator.locks.request('khvn-demo-write',()=>{const state=loadState();const result=action(state);localStorage.setItem(STORAGE_KEY,JSON.stringify(result.state));return result;});
}
export async function resetState(){
  if(!navigator.locks) throw new Error('Cần trình duyệt hỗ trợ Web Locks.');
  return navigator.locks.request('khvn-demo-write',()=>{const state=initialState();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return {state};});
}
