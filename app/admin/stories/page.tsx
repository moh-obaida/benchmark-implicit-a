import { ConfirmButton } from "@/components/admin/ActionForm";
import { deleteDemoContent, deleteStory, toggleStoryPublished } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { queryAll } from "@/lib/db";
import { formatNumber, nowIso } from "@/lib/format";

export const metadata = { title: "القصص" };

export default async function StoriesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const status = params.status || "all";
  const q = (params.q || "").trim();
  const now = nowIso();
  const where = ["1 = 1"];
  const values: unknown[] = [];
  if (status === "live") {
    where.push("s.published = 1 AND (s.publish_at IS NULL OR s.publish_at <= ?)");
    values.push(now);
  } else if (status === "draft") where.push("s.published = 0");
  else if (status === "scheduled") {
    where.push("s.published = 1 AND s.publish_at > ?");
    values.push(now);
  } else if (status === "demo") where.push("s.is_demo = 1");
  if (q) {
    where.push("s.title LIKE ?");
    values.push(`%${q.replace(/[%_]/g, "")}%`);
  }
  const stories = queryAll<{
    id: string;
    title: string;
    slug: string;
    published: number;
    publish_at: string | null;
    featured: number;
    view_count: number;
    author_name: string | null;
    category_name: string | null;
  }>(
    `SELECT s.id, s.title, s.slug, s.published, s.publish_at, s.featured, s.view_count, a.name AS author_name,
            (SELECT c.name FROM story_categories sc JOIN categories c ON c.id = sc.category_id
             WHERE sc.story_id = s.id ORDER BY sc.is_primary DESC LIMIT 1) AS category_name
     FROM stories s
     LEFT JOIN authors a ON a.id = s.author_id
     WHERE ${where.join(" AND ")}
     ORDER BY s.updated_at DESC`,
    ...values,
  );
  return (
    <>
      <header className="page-head">
        <h1>القصص</h1>
      </header>
      <div className="row-actions" style={{ marginBottom: "1rem" }}>
        <a className="btn" href="/admin/stories/new">+ إضافة قصة</a>
        <a className={status === "all" ? "btn-quiet" : "btn-ghost"} href="/admin/stories">الكل</a>
        <a className={status === "live" ? "btn-quiet" : "btn-ghost"} href="/admin/stories?status=live">المنشورة</a>
        <a className={status === "draft" ? "btn-quiet" : "btn-ghost"} href="/admin/stories?status=draft">المسودات</a>
        <a className={status === "demo" ? "btn-quiet" : "btn-ghost"} href="/admin/stories?status=demo">التجربية</a>
        <form action={deleteDemoContent}>
          <ConfirmButton label="حذف كل المحتوى التجريبي" message="سيُحذف المحتوى التجريبي. لا يمكن التراجع." />
        </form>
      </div>
      <form method="get" className="search-row" style={{ marginBottom: "1rem" }}>
        {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
        <input name="q" defaultValue={q} placeholder="ابحث في العناوين" />
        <button className="btn" type="submit">بحث</button>
      </form>
      {stories.length ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>العنوان</th>
              <th>المؤلف</th>
              <th>التصنيف</th>
              <th>الحالة</th>
              <th>مميزة</th>
              <th>المشاهدات</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {stories.map((story) => {
              const live = story.published === 1 && (!story.publish_at || story.publish_at <= now);
              const scheduled = story.published === 1 && !!story.publish_at && story.publish_at > now;
              return (
                <tr key={story.id}>
                  <td data-label="العنوان">{story.title}</td>
                  <td data-label="المؤلف">{story.author_name || "—"}</td>
                  <td data-label="التصنيف">{story.category_name || "—"}</td>
                  <td data-label="الحالة">
                    <span className={live ? "status status-live" : scheduled ? "status status-soon" : "status status-draft"}>
                      {live ? "منشورة" : scheduled ? "مجدولة" : "مسودة"}
                    </span>
                  </td>
                  <td data-label="مميزة">{story.featured ? "نعم" : "لا"}</td>
                  <td data-label="المشاهدات">{formatNumber(story.view_count)}</td>
                  <td data-label="إجراءات">
                    <div className="row-actions">
                      <a className="btn-ghost" href={`/admin/stories/${story.id}`}>تعديل</a>
                      {live ? <a className="btn-ghost" href={`/stories/${story.slug}`}>عرض</a> : <a className="btn-ghost" href={`/stories/${story.slug}?preview=1`}>معاينة</a>}
                      <form action={toggleStoryPublished}>
                        <input type="hidden" name="id" value={story.id} />
                        <button className="btn-quiet" type="submit">{story.published ? "إلغاء النشر" : "نشر"}</button>
                      </form>
                      <form action={deleteStory}>
                        <input type="hidden" name="id" value={story.id} />
                        <ConfirmButton label="حذف" message="حذف القصة؟ لا يمكن التراجع." />
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="empty-state"><h2>لا توجد قصص هنا حتى الآن.</h2></div>
      )}
    </>
  );
}
