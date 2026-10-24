import { notFound,redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { findJob } from "@/lib/video/jobs";
import { getVideoStyle } from "@/lib/video/catalog";
import { publicJob } from "@/lib/video/server";
import { JobView } from "@/components/video/job-view";
export default async function WorkPage({params}:{params:Promise<{id:string}>}) {const {id}=await params,user=await getSessionUser();if(!user)redirect(`/login?next=${encodeURIComponent(`/works/${id}`)}`);const job=findJob(getDb(),id);if(!job||(job.user_id!==user.id&&user.role!=="admin"))notFound();const style=getVideoStyle(job.style_slug);if(!style)notFound();return <div className="shell py-8 sm:py-12"><JobView key={job.id} initialJob={publicJob(job)} style={style}/></div>;}
