// Import the LemoLab / Lemo-Opuscar demo films (CC BY 4.0) into the public showcase.
// Downloads each release film, re-encodes it for web playback, fetches the poster and publishes it
// with attribution. Re-runnable: films already imported are skipped unless --force is passed.
//   npm run showcase:import-lemolab [-- --only=swiss-motion,ink-wash] [-- --force] [-- --refresh]
// --refresh only updates titles, categories, scenarios and method text of films already imported (no downloads).
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { DatabaseSync } from 'node:sqlite';
import { runProcess } from './video-process.mjs';
import { migrateGallery,createVideo,updateVideo,parseVideoInput,setVideoFile,setSourceKey,findBySourceKey } from '../src/lib/gallery/model.ts';
import { galleryRoot,resolveGalleryPath,saveImage,removeGalleryFile } from '../src/lib/gallery/files.ts';

if(fs.existsSync('.env.local'))process.loadEnvFile('.env.local');
const catalog=JSON.parse(fs.readFileSync('catalog/showcase/lemolab.json','utf8'));
const args=process.argv.slice(2),force=args.includes('--force'),refresh=args.includes('--refresh');
const only=args.find(a=>a.startsWith('--only='))?.slice(7).split(',');
const databasePath=process.env.DATABASE_PATH||path.join(process.cwd(),'data/atelier.db');
if(!fs.existsSync(databasePath)){console.error('Open the website once to initialize the database first.');process.exit(1);}
const db=new DatabaseSync(databasePath);db.exec('PRAGMA busy_timeout=5000;');migrateGallery(db);
const ffmpeg=process.env.VIDEO_FFMPEG_BIN||'ffmpeg',ffprobe=process.env.VIDEO_FFPROBE_BIN||'ffprobe';
const cache=path.join(path.dirname(databasePath),'showcase-import');fs.mkdirSync(cache,{recursive:true});
const RAW=`https://raw.githubusercontent.com/lemomo-ai/lemo-opuscar/${catalog.commit}`;

async function download(url,target){
  const response=await fetch(url,{headers:{'User-Agent':'ATELIER-showcase-import/1.0'}});
  if(!response.ok||!response.body)throw new Error(`${url}: HTTP ${response.status}`);
  const temp=`${target}.part`;
  await pipeline(Readable.fromWeb(response.body),fs.createWriteStream(temp));
  fs.renameSync(temp,target);
}
const ASPECTS={'9:16':9/16,'16:9':16/9,'1:1':1,'3:4':3/4};
function nearestAspect(width,height){return Object.entries(ASPECTS).sort((a,b)=>Math.abs(a[1]-width/height)-Math.abs(b[1]-width/height))[0][0];}

// Everything except the file-derived aspect ratio and duration, shared by new imports and --refresh.
function metadata([slug,styleName,film,summary,category,scenarios],index,fileFields){
  return parseVideoInput({
    title:`${styleName}｜${film}`,slug:`lemolab-${slug}`,summary,category,tags:styleName,...fileFields,
    douyin_url:'',plays:'',likes:'',comments:'',shares:'',metrics_as_of:'',skill_count:'',production_minutes:'',
    method_tags:catalog.method.tags.join('，'),technique_hint:catalog.method.note,scenarios,conditions:'',
    skills_used:`Lemo-Opuscar 风格「${styleName}」：${catalog.repository}/blob/${catalog.commit}/styles/${slug}/STYLE.md`,
    // CC BY 4.0 grants display rights; the film is re-encoded, which the attribution says.
    display_authorized:'on',status:'published',featured:'',sort_order:String(-(index+1)),
    credit_name:catalog.credit,credit_url:catalog.repository,license:`${catalog.license} · 本站已压缩转码`,
    credits_url:`${catalog.repository}/blob/${catalog.commit}/styles/${slug}/demo/CREDITS`,
  });
}
async function importFilm(entry,index){
  const [slug]=entry;
  const key=`lemolab:${slug}`,existing=findBySourceKey(db,key);
  if(refresh){
    if(!existing){console.log(`${slug}: not imported yet, skipped`);return;}
    const updated=updateVideo(db,existing.id,metadata(entry,index,{aspect_ratio:existing.aspect_ratio,duration_seconds:String(existing.duration_seconds??'')}));
    console.log(`${slug}: refreshed ${updated.code} → ${updated.category}`);return;
  }
  if(existing?.film_path&&fs.existsSync(resolveGalleryPath(existing.film_path))&&!force){console.log(`${slug}: already imported (${existing.code})`);return;}
  const original=path.join(cache,`${slug}.mp4`),encoded=path.join(cache,`${slug}.web.mp4`);
  if(!fs.existsSync(original))await download(`${catalog.repository}/releases/download/films/${slug}.mp4`,original);
  const head=Buffer.alloc(12);const fd=fs.openSync(original,'r');fs.readSync(fd,head,0,12,0);fs.closeSync(fd);
  if(head.subarray(4,8).toString('latin1')!=='ftyp')throw new Error(`${slug}: not an MP4`);
  // Web delivery: at most 1080 lines, H.264 + AAC, moov atom first so playback starts before the download finishes.
  await runProcess(ffmpeg,['-y','-v','error','-i',original,'-vf',"scale='min(1920,iw)':-2",'-c:v','libx264','-preset','medium','-crf','26','-pix_fmt','yuv420p',
    '-c:a','aac','-b:a','128k','-movflags','+faststart',encoded],{timeout:60*60*1000});
  const probe=JSON.parse(await runProcess(ffprobe,['-v','error','-select_streams','v:0','-show_entries','stream=width,height:format=duration','-of','json',encoded],{timeout:30000}));
  const {width,height}=probe.streams[0],duration=Number(probe.format.duration);
  const input=metadata(entry,index,{aspect_ratio:nearestAspect(width,height),duration_seconds:String(Math.round(duration*10)/10)});
  const video=existing??createVideo(db,{...input,status:'draft'});
  if(!existing)setSourceKey(db,video.id,key);
  const relative=path.join(video.id,`film-${randomUUID().slice(0,8)}.mp4`);
  fs.mkdirSync(path.dirname(resolveGalleryPath(relative)),{recursive:true});
  fs.renameSync(encoded,resolveGalleryPath(relative));
  setVideoFile(db,video.id,'film_path',relative);removeGalleryFile(existing?.film_path??null);
  const poster=await fetch(`${RAW}/styles/${slug}/poster.jpg`);
  if(!poster.ok)throw new Error(`${slug}: poster HTTP ${poster.status}`);
  setVideoFile(db,video.id,'poster_path',await saveImage(new File([await poster.arrayBuffer()],'poster.jpg',{type:'image/jpeg'}),video.id,'poster',1280));
  removeGalleryFile(existing?.poster_path??null);
  const published=updateVideo(db,video.id,input);
  fs.rmSync(original,{force:true});
  console.log(`${slug}: ${published.code} ${input.aspect_ratio} ${input.duration_seconds}s ${(fs.statSync(resolveGalleryPath(relative)).size/1048576).toFixed(1)} MiB`);
}

const films=catalog.films.filter(([slug])=>!only||only.includes(slug));
const queue=films.map(film=>[film,catalog.films.indexOf(film)]),failures=[];
async function worker(){for(let item;(item=queue.shift());){try{await importFilm(...item);}catch(error){failures.push(item[0][0]);console.error(`${item[0][0]}: FAILED ${error.message}`);}}}
await Promise.all([worker(),worker()]);
console.log(`Done: ${films.length-failures.length}/${films.length} films in ${galleryRoot()}${failures.length?`; failed: ${failures.join(', ')} (re-run to retry)`:''}`);
db.close();
if(failures.length)process.exitCode=1;
