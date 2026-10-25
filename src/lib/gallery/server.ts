import "server-only";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export async function isMember() {
  return !!(await getSessionUser());
}
export async function isAdmin() {
  return (await getSessionUser())?.role === "admin";
}
/** The gallery is members-only: visitors without a session go to the login page and come back afterwards. */
export async function requireMember(next: string) {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}
/** For pages and APIs that are internal-only: everyone else sees a plain 404. */
export async function requireAdminOr404() {
  const user = await getSessionUser();
  if (user?.role !== "admin") notFound();
  return user;
}
