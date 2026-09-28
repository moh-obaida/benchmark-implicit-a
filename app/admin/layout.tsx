import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "الإدارة",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return children;
  return <AdminShell name={session.name}>{children}</AdminShell>;
}
