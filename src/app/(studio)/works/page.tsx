import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getVideoJobs,publicJob } from "@/lib/video/server";
import { VIDEO_STYLES } from "@/lib/video/catalog";
import { JobsList } from "@/components/video/job-view";
export const metadata:Metadata={title:"我的作品"};
export default async function WorksPage() {const user=await getSessionUser();if(!user)redirect('/login?next=/works');return <div className="shell py-10 sm:py-14"><p className="eyebrow text-accent">MADE BY YOU</p><h1 className="mt-3 text-3xl font-medium sm:text-4xl">我的作品</h1><p className="mb-9 mt-4 text-sm text-muted">每一个想法，都值得拥有自己的片尾。</p><JobsList initialJobs={getVideoJobs(user.id).map(publicJob)} styles={VIDEO_STYLES}/></div>;}
