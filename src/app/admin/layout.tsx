import { redirect } from "next/navigation";
import { getSessionUser, isAdminRole } from "@/lib/auth";
import { AdminFrame } from "./AdminFrame";
import "@/styles/globals.css";
import "@/styles/admin.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/admin");
  if (!isAdminRole(user.role)) redirect("/");
  return <AdminFrame>{children}</AdminFrame>;
}
