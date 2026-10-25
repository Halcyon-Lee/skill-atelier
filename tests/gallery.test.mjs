import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { migrateGallery,parseVideoInput,createVideo,updateVideo,setVideoFile,listPublicVideos,findPublicVideo,findPublicFiles,recordConsultClick,getSiteSettings,saveSiteSetting,formatCount,DEFAULT_CONSULT_HEADLINE } from '../src/lib/gallery/model.ts';

const SECRET='SECRET-SKILL-firecrawl+remotion';
const form=(extra={})=>({title:'探店 15 秒爆款',slug:'',summary:'为火锅店做的探店短片',category:'本地生活',tags:'探店，餐饮',aspect_ratio:'9:16',duration_seconds:'15',
  douyin_url:'https://www.douyin.com/video/7300000000000000000',plays:'1,284,000',likes:'52000',comments:'',shares:'',metrics_as_of:'2026-10-20',
  skill_count:'3',production_minutes:'20',technique_hint:'AI 分镜 + 自动剪辑',skills_used:SECRET,status:'draft',sort_order:'',...extra});
function db(){const d=new DatabaseSync(':memory:');migrateGallery(d);migrateGallery(d);return d;}
function published(d,extra={}){const v=createVideo(d,parseVideoInput(form(extra)));setVideoFile(d,v.id,'film_path',`${v.id}/film.mp4`);setVideoFile(d,v.id,'poster_path',`${v.id}/poster.webp`);setVideoFile(d,v.id,'metrics_proof_path',`${v.id}/proof.webp`);return updateVideo(d,v.id,parseVideoInput(form({...extra,status:'published',display_authorized:'on'})));}

test('input parsing normalizes counts, tags and requires an as-of date for metrics',()=>{
  const input=parseVideoInput(form());
  assert.equal(input.plays,1284000);assert.equal(input.comments,null);assert.deepEqual(input.tags,['探店','餐饮']);assert.equal(input.display_authorized,false);
  assert.throws(()=>parseVideoInput(form({metrics_as_of:''})),/截止日期/);
  assert.throws(()=>parseVideoInput(form({douyin_url:'https://evil.test/douyin.com/x'})),/抖音/);
  assert.throws(()=>parseVideoInput(form({plays:'-1'})),/负数/);
  assert.throws(()=>parseVideoInput(form({slug:'Bad Slug'})),/链接名/);
});

test('codes are sequential and slugs default to the code',()=>{
  const d=db();try{
    const a=createVideo(d,parseVideoInput(form())),b=createVideo(d,parseVideoInput(form()));
    assert.equal(a.code,'V001');assert.equal(b.code,'V002');assert.equal(b.slug,'v002');
    assert.throws(()=>createVideo(d,parseVideoInput(form({slug:'v001'}))),/已被使用/);
  }finally{d.close();}
});

test('publishing requires film, cover and display authorization',()=>{
  const d=db();try{
    assert.throws(()=>createVideo(d,parseVideoInput(form({status:'published'}))),/先上传/);
    const v=createVideo(d,parseVideoInput(form()));
    assert.throws(()=>updateVideo(d,v.id,parseVideoInput(form({status:'published',display_authorized:'on'}))),/成片/);
    setVideoFile(d,v.id,'film_path',`${v.id}/film.mp4`);
    assert.throws(()=>updateVideo(d,v.id,parseVideoInput(form({status:'published',display_authorized:'on'}))),/封面/);
    setVideoFile(d,v.id,'poster_path',`${v.id}/poster.webp`);
    assert.throws(()=>updateVideo(d,v.id,parseVideoInput(form({status:'published'}))),/授权/);
    const done=updateVideo(d,v.id,parseVideoInput(form({status:'published',display_authorized:'on'})));
    assert.equal(done.status,'published');assert.ok(done.published_at);
  }finally{d.close();}
});

test('public reads only return published videos and never expose internal fields',()=>{
  const d=db();try{
    createVideo(d,parseVideoInput(form()));
    const v=published(d,{featured:'on'});
    const list=listPublicVideos(d);
    assert.deepEqual(list.map(x=>x.id),[v.id]);
    const serialized=JSON.stringify([list,findPublicVideo(d,v.slug),findPublicFiles(d,v.id)]);
    for(const hidden of [SECRET,'skills_used','metrics_proof_path','proof.webp','consult_clicks','display_authorized'])assert.ok(!serialized.includes(hidden),`public data leaked ${hidden}`);
    assert.equal(list[0].has_film,true);assert.equal(list[0].featured,true);
    assert.equal(list[0].credit_name,'');assert.equal(list[0].credits_url,null);
    updateVideo(d,v.id,parseVideoInput(form({status:'hidden',display_authorized:'on'})));
    assert.equal(listPublicVideos(d).length,0);assert.equal(findPublicVideo(d,v.slug),null);assert.equal(findPublicFiles(d,v.id),null);
  }finally{d.close();}
});

test('consult clicks only count for published videos',()=>{
  const d=db();try{
    const draft=createVideo(d,parseVideoInput(form())),v=published(d);
    assert.equal(recordConsultClick(d,draft.id),false);assert.equal(recordConsultClick(d,v.id),true);recordConsultClick(d,v.id);
    assert.equal(d.prepare('SELECT consult_clicks n FROM showcase_videos WHERE id=?').get(v.id).n,2);
  }finally{d.close();}
});

test('site settings fall back to defaults',()=>{
  const d=db();try{
    assert.deepEqual(getSiteSettings(d),{wechat_qr_path:null,wechat_id:'',consult_headline:DEFAULT_CONSULT_HEADLINE});
    saveSiteSetting(d,'wechat_id','atelier-ai');saveSiteSetting(d,'wechat_id','atelier-video');
    assert.equal(getSiteSettings(d).wechat_id,'atelier-video');
  }finally{d.close();}
});

test('counts are formatted in Chinese units',()=>{
  assert.equal(formatCount(null),'—');assert.equal(formatCount(9999),'9999');assert.equal(formatCount(12345),'1.2万');
  assert.equal(formatCount(1284000),'128.4万');assert.equal(formatCount(100000),'10万');assert.equal(formatCount(123456789),'1.2亿');
});

test('attribution fields are validated and public',()=>{
  const d=db();try{
    assert.throws(()=>parseVideoInput(form({credit_url:'http://insecure.test'})),/https/);
    const v=published(d,{credit_name:'LemoLab',credit_url:'https://github.com/lemomo-ai/lemo-opuscar',license:'CC BY 4.0',credits_url:'https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/x/demo/CREDITS'});
    const pub=findPublicVideo(d,v.slug);
    assert.equal(pub.credit_name,'LemoLab');assert.equal(pub.license,'CC BY 4.0');assert.match(pub.credits_url,/CREDITS$/);
  }finally{d.close();}
});

test('method, scenarios and conditions are stored and public',()=>{
  const d=db();try{
    const v=published(d,{method_tags:'代码生成，ComfyUI + 视频模型，代码生成',technique_hint:'AI 编写代码逐帧绘制，再合成配乐。',scenarios:'产品发布、品牌短片',conditions:'提供文案和品牌素材，约 3 个工作日'});
    const pub=findPublicVideo(d,v.slug);
    assert.deepEqual(pub.method_tags,['代码生成','ComfyUI + 视频模型']);assert.equal(pub.scenarios,'产品发布、品牌短片');assert.match(pub.conditions,/3 个工作日/);
    assert.throws(()=>parseVideoInput(form({conditions:'x'.repeat(501)})),/制作条件/);
  }finally{d.close();}
});
