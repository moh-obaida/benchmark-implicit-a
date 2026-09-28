import { ConfirmButton } from "@/components/admin/ActionForm";
import { deleteCategory } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { queryAll } from "@/lib/db";

export const metadata = { title: "التصنيفات" };

export default async function CategoriesAdminPage() {
  await requireAdmin();
  const categories = queryAll<{
    id: string;
    name: string;
    published: number;
    featured: number;
    sort_order: number;
    color: string;
    story_count: number;
  }>(
    `SELECT c.id, c.name, c.published, c.featured, c.sort_order, c.color,
            (SELECT COUNT(*) FROM story_categories sc WHERE sc.category_id = c.id) AS story_count
     FROM categories c ORDER BY c.sort_order ASC, c.name ASC`,
  );
  return (
    <>
      <header className="page-head"><h1>التصنيفات</h1></header>
      <p><a className="btn" href="/admin/categories/new">+ إضافة تصنيف</a></p>
      <table className="admin-table">
        <thead>
          <tr><th>الاسم</th><th>القصص</th><th>الحالة</th><th>الترتيب</th><th></th></tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td data-label="الاسم"><span className="swatch" style={{ background: category.color, marginInlineEnd: 8 }} />{category.name}</td>
              <td data-label="القصص">{category.story_count}</td>
              <td data-label="الحالة">{category.published ? "منشور" : "مخفي"}{category.featured ? " · بارز" : ""}</td>
              <td data-label="الترتيب">{category.sort_order}</td>
              <td data-label="إجراءات">
                <div className="row-actions">
                  <a className="btn-ghost" href={`/admin/categories/${category.id}`}>تعديل</a>
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={category.id} />
                    <ConfirmButton label="حذف" message="حذف التصنيف؟ القصص تبقى من غير هذا التصنيف." />
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
