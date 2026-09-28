"use client";

import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/lib/actions/admin";
import { Mark } from "@/components/icons";

const links = [
  { href: "/admin", label: "لوحة التحكم" },
  { href: "/admin/stories", label: "القصص" },
  { href: "/admin/categories", label: "التصنيفات" },
  { href: "/admin/authors", label: "المؤلفون" },
  { href: "/admin/homepage", label: "الصفحة الرئيسية" },
  { href: "/admin/media", label: "الوسائط" },
  { href: "/admin/settings", label: "الإعدادات" },
];

export function AdminShell({ name, children }: { name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <a className="brand" href="/admin" style={{ marginBottom: "1rem" }}>
          <Mark size={32} />
          <span>يراع</span>
        </a>
        <nav aria-label="إدارة المحتوى">
          {links.map((link) => {
            const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            return (
              <a key={link.href} href={link.href} aria-current={active ? "page" : undefined}>
                {link.label}
              </a>
            );
          })}
        </nav>
        <p className="quiet" style={{ marginTop: "1.2rem" }}>{name}</p>
        <form action={logoutAdmin}>
          <button className="btn-ghost" type="submit">خروج</button>
        </form>
        <p style={{ marginTop: "1rem" }}>
          <a className="text-link" href="/">عرض الموقع</a>
        </p>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
