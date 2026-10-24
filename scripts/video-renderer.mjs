import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import sharp from 'sharp';
import { runProcess } from './video-process.mjs';
import { parseVideoOptions,videoDimensions,sceneCount } from '../src/lib/video/options.ts';
import { validateStoryboard } from '../src/lib/video/storyboard.ts';
const FPS=24;
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function lines(text,max){const characters=Array.from(text);const out=[];while(characters.length)out.push(characters.splice(0,max).join(''));return out;}
function textBlock(text,x,y,size,max,color='#151515',weight=500){return `<text x="${x}" y="${y}" font-family="sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${lines(text,max).map((line,i)=>`<tspan x="${x}" dy="${i?size*1.32:0}">${escape(line)}</tspan>`).join('')}</text>`;}
function graphics(scene,p,accent,pace){
  const steps={calm:8,normal:12,fast:18}[pace],speed={calm:3,normal:5,fast:8}[pace];
  const beat=Math.floor(p*steps)/steps,ease=Math.min(1,p*speed),v=scene.elements;
  let shapes='';
  if(scene.composition==='grid')for(let i=0;i<24;i++){const x=(i%6)*116,y=Math.floor(i/6)*116;const scale=Math.max(.04,Math.min(1,ease*4-i*.09));shapes+=`<rect x="${x+56*(1-scale)}" y="${y+56*(1-scale)}" width="${108*scale}" height="${108*scale}" fill="${i%7===0?accent:i%3===0?'#151515':'#d9d5ce'}"/>`;}
  else if(scene.composition==='bars')v.forEach((a,i)=>{const h=410*a*ease;shapes+=`<rect x="${i*88}" y="${460-h}" width="68" height="${h}" fill="${i===Math.floor(beat*v.length)%v.length?accent:'#151515'}"/><rect x="${i*88}" y="478" width="68" height="4" fill="#151515"/>`;});
  else if(scene.composition==='steps')for(let i=0;i<6;i++)shapes+=`<rect x="${i*104}" y="${410-i*62*ease}" width="104" height="${70+i*62*ease}" fill="${i===5?accent:i%2?'#b7b3ac':'#151515'}"/>`;
  else if(scene.composition==='orbit'){for(let i=0;i<4;i++)shapes+=`<circle cx="340" cy="240" r="${65+i*58}" fill="none" stroke="${i%2?accent:'#151515'}" stroke-width="${i===2?30:2}"/>`;const a=beat*Math.PI*2;shapes+=`<rect x="${310+220*Math.cos(a)}" y="${210+220*Math.sin(a)}" width="60" height="60" fill="${accent}"/><circle cx="340" cy="240" r="30" fill="#151515"/>`;}
  else{shapes+=`<rect x="${30+80*ease}" y="${30+40*ease}" width="${560-160*ease}" height="${400-80*ease}" fill="${accent}"/><rect x="${130+50*ease}" y="${110+30*ease}" width="300" height="200" fill="#151515"/><rect x="${195+20*ease}" y="${160+20*ease}" width="170" height="100" fill="#f4f0e8"/>`;}
  return shapes;
}
export function renderFrame(board,t,rawOptions){
  const options=parseVideoOptions(rawOptions),{width,height}=videoDimensions(options);
  const portrait=options.aspectRatio==='9:16',square=options.aspectRatio==='1:1';
  const w=portrait||square?1080:1920,h=portrait?1920:1080;
  const section=options.duration/board.scenes.length,time=Math.max(0,Math.min(t,options.duration));
  const index=Math.min(board.scenes.length-1,Math.floor(time/section)),scene=board.scenes[index],p=Math.min(1,(time-index*section)/section);
  const accent=board.accent,progress=Math.floor(p*12)/12,footer=h-120;
  let grid='';for(let x=96;x<w-80;x+=144)grid+=`<path d="M${x} 172V${footer-14}" stroke="#d4d0c9" stroke-width="1"/>`;
  let content;
  if(portrait){
    content=`${textBlock(String(index+1).padStart(2,'0'),88,390,220,3,'#151515',700)}<rect x="96" y="440" width="${Math.max(8,700*progress)}" height="14" fill="${accent}"/>
      ${textBlock(scene.headline,96,566,76,11,'#151515',700)}${textBlock(scene.body,96,786,32,25,'#44403b',400)}
      <g transform="translate(200,1040) scale(.95)">${graphics(scene,p,accent,options.pace)}</g>`;
  }else if(square){
    content=`${textBlock(String(index+1).padStart(2,'0'),90,337,180,3,'#151515',700)}<rect x="96" y="370" width="${Math.max(8,700*progress)}" height="10" fill="${accent}"/>
      ${textBlock(scene.headline,96,455,60,13,'#151515',700)}${textBlock(scene.body,96,599,28,28,'#44403b',400)}
      <g transform="translate(370,655) scale(.5)">${graphics(scene,p,accent,options.pace)}</g>`;
  }else{
    content=`${textBlock(String(index+1).padStart(2,'0'),88,470,290,3,'#151515',700)}<rect x="96" y="514" width="${Math.max(8,560*progress)}" height="16" fill="${accent}"/>
      ${textBlock(scene.headline,96,647,78,8,'#151515',700)}${textBlock(scene.body,96,851,32,21,'#44403b',400)}
      <g transform="translate(1020,310)">${graphics(scene,p,accent,options.pace)}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#f1eee7"/>${grid}<path d="M96 145H${w-96}M96 ${footer}H${w-96}" stroke="#151515" stroke-width="3"/><rect x="96" y="78" width="25" height="25" fill="${accent}"/>${textBlock('ATELIER / MOTION STUDIES',145,99,22,50)}${textBlock(`FILM ${String(index+1).padStart(2,'0')} / ${String(board.scenes.length).padStart(2,'0')}`,w-355,99,22,30)}
    ${content}${textBlock(board.title,96,footer+47,22,60)}${textBlock(`${String(Math.floor(time)).padStart(2,'0')} / ${options.duration} SEC`,w-330,footer+47,20,30)}
    <rect x="96" y="${h-40}" width="${(w-192)*time/options.duration}" height="5" fill="${accent}"/></svg>`;
}
export async function renderVideo(board,directory,{signal,onCompositing=()=>{},options:rawOptions}={}){
  const options=parseVideoOptions(rawOptions),{width,height}=videoDimensions(options),frames=FPS*options.duration;
  validateStoryboard(board,sceneCount(options));
  const silent=path.join(directory,'picture.mp4'),partial=path.join(directory,'film.partial.mp4');
  fs.writeFileSync(path.join(directory,'poster.svg'),renderFrame(board,2,options));
  await sharp(Buffer.from(renderFrame(board,2,options))).jpeg({quality:90}).toFile(path.join(directory,'poster.jpg'));
  const encoder=spawn(process.env.VIDEO_FFMPEG_BIN||'ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','mjpeg','-r',String(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','veryfast','-crf','22','-pix_fmt','yuv420p',silent],{signal,stdio:['pipe','ignore','pipe']});
  let error='';encoder.stderr.on('data',chunk=>{error=(error+chunk).slice(-2000);});encoder.stdin.on('error',()=>{});
  const closed=new Promise((resolve,reject)=>{encoder.once('error',reject);encoder.once('close',code=>code===0?resolve():reject(new Error('Video encoder failed: '+error)));});
  // Attach a rejection handler immediately while frame production is still in progress.
  closed.catch(()=>{});
  try {
    for(let i=0;i<frames;i++){
      signal?.throwIfAborted();
      if(encoder.exitCode!==null)throw new Error('Encoder stopped before frames were complete');
      const image=await sharp(Buffer.from(renderFrame(board,i/FPS,options))).jpeg({quality:85}).toBuffer();
      if(!encoder.stdin.write(image))await Promise.race([once(encoder.stdin,'drain'),closed.then(()=>{throw new Error('Encoder closed early');})]);
    }
    encoder.stdin.end();await closed;signal?.throwIfAborted();await onCompositing();
    await runProcess(process.env.VIDEO_FFMPEG_BIN||'ffmpeg',['-hide_banner','-loglevel','error','-y','-i',silent,'-c:v','copy','-an','-t',String(options.duration),'-movflags','+faststart','-metadata',`title=${board.title}`,partial],{signal,timeout:120000});
    const result=JSON.parse(await runProcess(process.env.VIDEO_FFPROBE_BIN||'ffprobe',['-v','error','-show_entries','format=duration:stream=width,height,codec_type','-of','json',partial],{signal}));
    if(Number(result.format.duration)<frames/FPS-.1||!result.streams.some(s=>s.codec_type==='video'&&s.width===width&&s.height===height)||result.streams.some(s=>s.codec_type==='audio'))throw new Error('Output validation failed');
    const output=path.join(directory,'film.mp4');fs.renameSync(partial,output);fs.rmSync(silent,{force:true});
    return fs.statSync(output).size;
  }catch(error){encoder.kill('SIGKILL');throw error;}
}
