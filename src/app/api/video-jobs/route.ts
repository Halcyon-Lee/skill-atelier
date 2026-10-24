import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getVideoStyle } from "@/lib/video/catalog";
import { enqueueJob, findJob } from "@/lib/video/jobs";
import { jobOptions,parseVideoOptions } from "@/lib/video/options";
import { getVideoJobs, getVideoRuntime, publicJob, sameOrigin } from "@/lib/video/server";
export async function GET() {
  const user=await getSessionUser();
  if(!user) return Response.json({error:"请先登录。"},{status:401});
  return Response.json({jobs:getVideoJobs(user.id).map(publicJob),runtime:getVideoRuntime()},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(request: Request) {
  const user=await getSessionUser();
  if(!user) return Response.json({error:"请先登录。"},{status:401});
  if(!sameOrigin(request)) return Response.json({error:"请求来源无效。"},{status:403});
  const limit=consumeRateLimit(`video-submit:${user.id}`,20,600);
  if(!limit.ok) return Response.json({error:"提交过于频繁，请稍后重试。"},{status:429});
  if(Number(request.headers.get("content-length"))>16000) return Response.json({error:"脚本内容过长。"},{status:413});
  try {
    const text=await request.text();
    if(text.length>16000) return Response.json({error:"脚本内容过长。"},{status:413});
    const body=JSON.parse(text);
    if(!body || typeof body!=="object" || Array.isArray(body)) throw new Error("请求格式无效。");
    let script=body.script,slug=body.styleSlug,retryOf: string|null=null;
    let options;
    if(body.retryOf) {
      if(typeof body.retryOf!=="string") throw new Error("重试任务无效。");
      const prior=findJob(getDb(),body.retryOf);
      if(!prior || prior.user_id!==user.id || prior.status!=="failed") return Response.json({error:"找不到可以重试的任务。"},{status:404});
      script=prior.script;slug=prior.style_slug;retryOf=prior.id;options=jobOptions(prior);
    }
    options ??= parseVideoOptions(body.options);
    const style=getVideoStyle(slug);
    if(!style) return Response.json({error:"找不到这个风格。"},{status:404});
    const runtime=getVideoRuntime();
    if(!runtime.ready || !style.renderer || !runtime.renderers.includes(style.renderer)) return Response.json({error:style.renderer?runtime.message:"这个风格正在准备中，可以先收藏。"},{status:503});
    const job=enqueueJob(getDb(),user.id,style,script,body.idempotencyKey,retryOf,options);
    return Response.json({job:publicJob(job)},{status:201});
  } catch(error) {
    return Response.json({error:error instanceof SyntaxError?"请求格式无效。":error instanceof Error?error.message:"提交失败，请稍后重试。"},{status:400});
  }
}
