import path from "node:path";
import fs from "node:fs";
import { getVideoStyle } from "@/lib/video/catalog";
import { streamVideo,videoDataDirectory } from "@/lib/video/files";
export async function GET(request: Request,{params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params,style=getVideoStyle(slug);
  if(!style) return Response.json({error:"样片不存在。"},{status:404});
  const filename=path.join(videoDataDirectory(),"video-previews",style.slug+".mp4");
  if(!fs.existsSync(filename)) return Response.redirect(style.sampleUrl,307);
  return streamVideo(request,filename,{public:true});
}
export const HEAD=GET;
