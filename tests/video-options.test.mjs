import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { DEFAULT_VIDEO_OPTIONS,parseVideoOptions,videoDimensions,sceneCount,jobOptions } from '../src/lib/video/options.ts';
import { migrateVideo } from '../src/lib/video/migration.ts';
import { enqueueJob } from '../src/lib/video/jobs.ts';
import { storyboardSchema,validateStoryboard } from '../src/lib/video/storyboard.ts';
import { renderFrame } from '../scripts/video-renderer.mjs';
const custom={aspectRatio:'9:16',resolution:'720p',duration:15,pace:'fast'};
const style={slug:'swiss-motion',sourceCommit:'test-commit',renderer:'swiss-v1'};
const script='从零散的便签开始，把团队灵感整理成清晰的计划。';
const scene={headline:'让灵感各就其位',body:'从一个想法，走向下一步行动。',composition:'grid',elements:[.2,.4,.6,.8]};
const board=count=>({title:'创作参数测试',accent:'#e9402c',scenes:Array.from({length:count},()=>({...scene}))});
function db(){const d=new DatabaseSync(':memory:');d.exec('PRAGMA foreign_keys=ON;CREATE TABLE users(id INTEGER PRIMARY KEY);INSERT INTO users VALUES(1);');migrateVideo(d);return d;}

test('generation parameters use explicit enums and keep backward-compatible defaults',()=>{
  assert.deepEqual(parseVideoOptions(),DEFAULT_VIDEO_OPTIONS);
  assert.deepEqual(parseVideoOptions({resolution:'720p'}),{...DEFAULT_VIDEO_OPTIONS,resolution:'720p'});
  assert.deepEqual(parseVideoOptions(custom),custom);
  for(const input of [null,[],{aspectRatio:'4:3'},{resolution:'4K'},{duration:'30'},{duration:601},{pace:'turbo'},{music:true},{constructor:'unexpected'},{fps:120}])assert.throws(()=>parseVideoOptions(input));
});

test('all six aspect and resolution combinations produce exact even dimensions',async()=>{
  for(const [aspectRatio,resolution,width,height] of [
    ['16:9','720p',1280,720],['16:9','1080p',1920,1080],['9:16','720p',720,1280],['9:16','1080p',1080,1920],['1:1','720p',720,720],['1:1','1080p',1080,1080],
  ]){
    const options=parseVideoOptions({aspectRatio,resolution});assert.deepEqual(videoDimensions(options),{width,height});
    const image=await sharp(Buffer.from(renderFrame(board(5),2,options))).png().toBuffer();
    const metadata=await sharp(image).metadata();assert.equal(metadata.width,width);assert.equal(metadata.height,height);
  }
});

test('upgrading old tasks adds default options without changing their content',()=>{
  const d=new DatabaseSync(':memory:');
  try{
    d.exec("CREATE TABLE users(id INTEGER PRIMARY KEY);CREATE TABLE video_jobs(id TEXT PRIMARY KEY,user_id INTEGER,status TEXT,created_at TEXT,script TEXT);INSERT INTO video_jobs VALUES('legacy',1,'succeeded','2026-10-24','原有脚本');");
    migrateVideo(d);migrateVideo(d);
    const row=d.prepare("SELECT * FROM video_jobs WHERE id='legacy'").get();assert.equal(row.script,'原有脚本');assert.equal(row.status,'succeeded');assert.deepEqual(jobOptions(row),DEFAULT_VIDEO_OPTIONS);
  }finally{d.close();}
});

test('task snapshots and idempotency include all selected options',()=>{
  const d=db();try{const key=randomUUID(),job=enqueueJob(d,1,style,script,key,null,custom);assert.deepEqual(jobOptions(job),custom);assert.equal(enqueueJob(d,1,style,script,key,null,custom).id,job.id);assert.throws(()=>enqueueJob(d,1,style,script,key,null,{...custom,resolution:'1080p'}),/内容不一致/);}finally{d.close();}
});

test('retries preserve original settings and do not silently use current defaults',()=>{
  const d=db();try{const original=enqueueJob(d,1,style,script,randomUUID(),null,custom);d.prepare("UPDATE video_jobs SET status='failed' WHERE id=?").run(original.id);assert.throws(()=>enqueueJob(d,1,style,script,randomUUID(),original.id),/只能重试/);const retry=enqueueJob(d,1,style,script,randomUUID(),original.id,custom);assert.deepEqual(jobOptions(retry),custom);assert.equal(retry.retry_of,original.id);}finally{d.close();}
});

test('chosen durations determine storyboard lengths and schema validation',()=>{
  for(const [duration,count] of [[15,3],[30,5],[60,10]]){const options=parseVideoOptions({duration});assert.equal(sceneCount(options),count);assert.equal(storyboardSchema(count).properties.scenes.minItems,count);assert.equal(validateStoryboard(board(count),count).scenes.length,count);assert.throws(()=>validateStoryboard(board(count+1),count));}
});

