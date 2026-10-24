import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { findJob } from "@/lib/video/jobs";
import { getVideoRuntime, publicJob } from "@/lib/video/server";
export async function GET(_request: Request,{params}:{params:Promise<{id:string}>}) {
  const user=await getSessionUser();
  if(!user) return Response.json({error:"请先登录。"},{status:401});
  const {id}=await params,job=findJob(getDb(),id);
  if(!job || (job.user_id!==user.id && user.role!=="admin")) return Response.json({error:"找不到这项任务。"},{status:404});
  return Response.json({job:publicJob(job),runtime:getVideoRuntime()},{headers:{"Cache-Control":"private, no-store"}});
}
