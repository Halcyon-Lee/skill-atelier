import { VideoShell } from "@/components/video/shell";
import { requireAdminOr404 } from "@/lib/gallery/server";
// Self-serve creation is retired from the public site; the studio stays for the team to make samples.
export default async function StudioLayout({children}:{children:React.ReactNode}) { await requireAdminOr404(); return <VideoShell>{children}</VideoShell>; }
