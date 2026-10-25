import { getDb } from "@/lib/db";
import { listPublicVideos } from "@/lib/gallery/model";
import { GalleryShell } from "@/components/gallery/shell";
import { VideoWall } from "@/components/gallery/video-wall";
import { requireMember } from "@/lib/gallery/server";

export default async function HomePage() {
  await requireMember("/");
  const videos = listPublicVideos(getDb());
  return <GalleryShell>
    <section className="shell py-8 sm:py-10" aria-label="视频案例">
      <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">视频案例</h1>
      <p className="mb-8 mt-2 text-sm text-muted">{videos.length > 0 ? `共 ${videos.length} 条。` : ""}点开任意一条，可以看到它的实现方式、制作时长和所需条件。</p>
      <VideoWall videos={videos} />
    </section>
  </GalleryShell>;
}
