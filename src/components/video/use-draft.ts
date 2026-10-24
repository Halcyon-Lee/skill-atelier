"use client";
import { useCallback,useSyncExternalStore } from "react";
const memory=new Map<string,string>();
const EVENT="atelier-video-draft";
export function useVideoDraft(key:string):[string,(value:string)=>void] {
  const subscribe=useCallback((change:()=>void)=>{
    const handler=(event:Event)=>{if(!(event instanceof StorageEvent)||event.key===key||event.key===null)change();};
    window.addEventListener("storage",handler);window.addEventListener(EVENT,handler);
    return()=>{window.removeEventListener("storage",handler);window.removeEventListener(EVENT,handler);};
  },[key]);
  const snapshot=useCallback(()=>{try{return (localStorage.getItem(key)??memory.get(key)??"").slice(0,2000);}catch{return memory.get(key)??"";}},[key]);
  const value=useSyncExternalStore(subscribe,snapshot,()=>"");
  const update=useCallback((next:string)=>{memory.set(key,next);try{localStorage.setItem(key,next);}catch{}window.dispatchEvent(new Event(EVENT));},[key]);
  return [value,update];
}
