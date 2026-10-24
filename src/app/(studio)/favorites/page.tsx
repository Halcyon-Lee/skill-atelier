import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight,Bookmark } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { VIDEO_STYLES } from "@/lib/video/catalog";
import { getFavoriteStyles } from "@/lib/video/server";
import { StyleGallery } from "@/components/video/style-gallery";
export const metadata={title:"收藏的风格"};
export default async function FavoritesPage() {const user=await getSessionUser();if(!user)redirect('/login?next=/favorites');const favorites=getFavoriteStyles(user.id),styles=VIDEO_STYLES.filter(style=>favorites.includes(style.slug));return <div className="shell py-10 sm:py-14"><p className="eyebrow text-accent">SAVE YOUR INSPIRATION</p><h1 className="mb-9 mt-3 text-3xl font-medium sm:text-4xl">收藏的风格</h1>{styles.length?<StyleGallery styles={styles} favorites={favorites} loggedIn/>:<div className="rounded-2xl border border-dashed border-line py-20 text-center"><Bookmark size={32} className="mx-auto text-faint"/><p className="mt-5 text-lg">把心动的画风，留给下一个故事。</p><Link href="/#styles" className="btn btn-primary mt-6">发现风格<ArrowUpRight size={16}/></Link></div>}</div>;}
