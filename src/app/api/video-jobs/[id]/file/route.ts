import path from "node:path";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { findJob } from "@/lib/video/jobs";
import { jobDirectory,streamVideo } from "@/lib/video/files";
export async function GET(request: Request,{params}:{params:Promise<{id:string}>}) {
  const user=await getSessionUser();
  if(!user) return Response.json({error:"请先登录。"},{status:401});
  const {id}=await params,job=findJob(getDb(),id);
  if(!job || (job.user_id!==user.id && user.role!=="admin") || job.status!=="succeeded") return Response.json({error:"视频尚不可用。"},{status:404});
  return streamVideo(request,path.join(jobDirectory(job.id),"film.mp4"),{downloadName:new URL(request.url).searchParams.has("download")?`atelier-${job.style_slug}-${job.id}.mp4`:undefined});
}
export const HEAD=GET;
