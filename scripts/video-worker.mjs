import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { migrateVideo } from '../src/lib/video/migration.ts';
import { acquireWorker,claimJob,failAbandonedJobs,transitionJob,JOB_TIMEOUT_MS } from '../src/lib/video/jobs.ts';
import { planVideo,agentReady } from './video-agent.mjs';
import { renderVideo } from './video-renderer.mjs';
import { runProcess } from './video-process.mjs';
import { jobOptions } from '../src/lib/video/options.ts';
if(fs.existsSync('.env.local'))process.loadEnvFile('.env.local');
const databasePath=process.env.DATABASE_PATH||path.join(process.cwd(),'data/atelier.db');
if(!fs.existsSync(databasePath)){console.error('Open the website once to initialize the database before starting the worker.');process.exit(1);}
const db=new DatabaseSync(databasePath);db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');migrateVideo(db);
const token=randomUUID();if(!acquireWorker(db,token)){console.error('Another video worker is already running.');db.close();process.exit(1);}
let stopped=false,controller,currentJob,ready=false,message='制作服务启动中';
function heartbeat(){
  const update=db.prepare("UPDATE video_worker SET heartbeat_at=?,ready=?,message=?,renderers=? WHERE id=1 AND token=?").run(Date.now(),ready?1:0,message,JSON.stringify(['swiss-v1']),token);
  if(!Number(update.changes)){ready=false;controller?.abort();stopped=true;return;}
  if(currentJob)db.prepare("UPDATE video_jobs SET heartbeat_at=? WHERE id=? AND worker_token=? AND status IN ('planning','rendering','compositing')").run(Date.now(),currentJob.id,token);
}
const heart=setInterval(heartbeat,5000);
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{stopped=true;controller?.abort();});
console.log('Video worker started (single job, swiss-v1).');
try{
  let checked=0;
  while(!stopped){
    if(Date.now()-checked>30000){
      ready=await agentReady();message=ready?'制作服务已连接。':'制作服务尚未连接生成账号，脚本可先保存。';
      if(ready)try{await runProcess(process.env.VIDEO_FFMPEG_BIN||'ffmpeg',['-version'],{timeout:5000});await runProcess(process.env.VIDEO_FFPROBE_BIN||'ffprobe',['-version'],{timeout:5000});}catch{ready=false;message='视频制作环境正在准备，请稍后再试。';}
      checked=Date.now();heartbeat();
    }
    failAbandonedJobs(db);
    const job=ready?claimJob(db,token):undefined;
    if(!job){await new Promise(resolve=>setTimeout(resolve,1500));continue;}
    currentJob=job;controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),JOB_TIMEOUT_MS);
    try{
      const styles=JSON.parse(fs.readFileSync('catalog/video/styles.json','utf8'));
      const style=styles.find(item=>item.slug===job.style_slug);
      if(job.renderer!=='swiss-v1'||job.style_slug!=='swiss-motion'||style?.sourceCommit!==job.style_version)throw new Error('Unsupported renderer version');
      const directory=path.join(path.dirname(databasePath),'video-jobs',job.id);fs.mkdirSync(directory,{recursive:true});
      fs.writeFileSync(path.join(directory,'input.json'),JSON.stringify({script:job.script,style:job.style_slug,sourceVersion:job.style_version,renderer:job.renderer,options:jobOptions(job)},null,2));
      const storyboard=await planVideo(job,directory,controller.signal);
      transitionJob(db,job.id,token,'rendering',{title:storyboard.title});
      const bytes=await renderVideo(storyboard,directory,{signal:controller.signal,options:jobOptions(job),onCompositing:()=>transitionJob(db,job.id,token,'compositing')});
      transitionJob(db,job.id,token,'succeeded',{bytes});console.log(`Completed ${job.id}`);
    }catch(error){
      const reason=controller.signal.aborted?'制作被中断或超时，脚本已保存，可以重试。':'这次制作未能完成，脚本已保存，请稍后重试。';
      try{transitionJob(db,job.id,token,'failed',{error:reason});}catch{}
      console.error(`Failed ${job.id}: ${error.name}`);
    }finally{clearTimeout(timeout);currentJob=undefined;controller=undefined;}
    if(process.argv.includes('--once'))break;
  }
}finally{
  clearInterval(heart);db.prepare('DELETE FROM video_worker WHERE id=1 AND token=?').run(token);db.close();console.log('Video worker stopped.');
}
