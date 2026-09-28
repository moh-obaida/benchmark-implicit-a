import { requireAdmin } from "@/lib/auth";
import { queryAll, queryOne } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/format";

export const metadata = { title: "لوحة التحكم" };

export default async function DashboardPage() {
  await requireAdmin();
  const now = new Date().toISOString();
  const count = (sql: string, ...params: unknown[]) =>
    Number(queryOne<{ total: number }>(sql, ...params)?.total ?? 0);
  const stats = [
    ["القصص", count("SELECT COUNT(*) AS total FROM stories")],
    ["المنشورة", count("SELECT COUNT(*) AS total FROM stories WHERE published = 1 AND (publish_at IS NULL OR publish_at <= ?)", now)],
    ["المسودات", count("SELECT COUNT(*) AS total FROM stories WHERE published = 0")],
    ["المجدولة", count("SELECT COUNT(*) AS total FROM stories WHERE published = 1 AND publish_at > ?", now)],
    ["التصنيفات", count("SELECT COUNT(*) AS total FROM categories")],
    ["المؤلفون", count("SELECT COUNT(*) AS total FROM authors")],
    ["المشاهدات", count("SELECT COALESCE(SUM(view_count), 0) AS total FROM stories")],
    ["المحفوظات", count("SELECT COALESCE(SUM(favorite_count), 0) AS total FROM stories")],
    ["القصص المميزة", count("SELECT COUNT(*) AS total FROM stories WHERE featured = 1")],
  ];
  const activity = queryAll<{ id: string; summary: string; created_at: string }>(
    "SELECT id, summary, created_at FROM activity ORDER BY created_at DESC LIMIT 8",
  );
  return (
    <>
      <header className="page-head">
        <h1>لوحة يراع</h1>
        <p>المحتوى، الترتيب، والظهور. الهوية البصرية تبقى ثابتة.</p>
      </header>
      <div className="stat-grid">
        {stats.map(([label, value]) => (
          <article key={String(label)} className="stat-card">
            <span>{label}</span>
            <strong>{formatNumber(Number(value))}</strong>
          </article>
        ))}
      </div>
      <h2 style={{ marginTop: "1.6rem" }}>إجراءات سريعة</h2>
      <div className="quick-grid">
        <a href="/admin/stories/new">+ إضافة قصة</a>
        <a href="/admin/categories/new">+ إضافة تصنيف</a>
        <a href="/admin/authors/new">+ إضافة مؤلف</a>
        <a href="/admin/homepage">+ تعديل الصفحة الرئيسية</a>
      </div>
      <h2 style={{ marginTop: "1.6rem" }}>النشاط الأخير</h2>
      {activity.length ? (
        <ul>
          {activity.map((item) => (
            <li key={item.id}>
              {item.summary} <span className="quiet">{formatDate(item.created_at)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>لا توجد قصص هنا حتى الآن.</p>
      )}
    </>
  );
}
