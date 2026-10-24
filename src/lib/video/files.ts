import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
export function videoDataDirectory() {
  return path.dirname(process.env.DATABASE_PATH || path.join(process.cwd(),"data","atelier.db"));
}
export function jobDirectory(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid job id");
  return path.join(videoDataDirectory(),"video-jobs",id);
}
export function parseByteRange(header: string | null, size: number): { start: number; end: number } | null | false {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return false;
  const suffix = !match[1];
  const amount = Number(match[2]);
  const start = suffix ? Math.max(0,size-amount) : Number(match[1]);
  const end = suffix || !match[2] ? size-1 : Math.min(size-1,Number(match[2]));
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || (suffix && amount<=0) || start<0 || start>=size || end<start) return false;
  return { start,end };
}
export function streamVideo(request: Request, filename: string, options: { downloadName?: string; public?: boolean } = {}) {
  let size: number;
  try { size = fs.statSync(filename).size; } catch { return Response.json({error:"视频文件暂不可用。"},{status:404}); }
  const headers = new Headers({"Content-Type":"video/mp4","Accept-Ranges":"bytes","Cache-Control":options.public?"public, max-age=86400":"private, no-store","X-Content-Type-Options":"nosniff"});
  if(options.downloadName) headers.set("Content-Disposition",`attachment; filename="${options.downloadName}"`);
  const range = parseByteRange(request.headers.get("range"),size);
  if(range===false) { headers.set("Content-Range",`bytes */${size}`); return new Response(null,{status:416,headers}); }
  const start = range?.start ?? 0, end=range?.end ?? size-1;
  headers.set("Content-Length",String(end-start+1));
  if(range) headers.set("Content-Range",`bytes ${start}-${end}/${size}`);
  if(request.method==="HEAD") return new Response(null,{status:range?206:200,headers});
  const stream=Readable.toWeb(fs.createReadStream(filename,{start,end})) as ReadableStream<Uint8Array>;
  return new Response(stream,{status:range?206:200,headers});
}
