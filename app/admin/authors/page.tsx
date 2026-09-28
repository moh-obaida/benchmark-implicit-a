import { ConfirmButton } from "@/components/admin/ActionForm";
import { deleteAuthor } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { queryAll } from "@/lib/db";

export const metadata = { title: "المؤلفون" };

export default async function AuthorsAdminPage() {
  await requireAdmin();
  const authors = queryAll<{ id: string; name: string; featured: number; story_count: number }>(
    `SELECT a.id, a.name, a.featured, (SELECT COUNT(*) FROM stories s WHERE s.author_id = a.id) AS story_count
     FROM authors a ORDER BY a.name ASC`,
  );
  return (
    <>
      <header className="page-head"><h1>المؤلفون</h1></header>
      <p><a className="btn" href="/admin/authors/new">+ إضافة مؤلف</a></p>
      <table className="admin-table">
        <thead><tr><th>الاسم</th><th>القصص</th><th>بارز</th><th></th></tr></thead>
        <tbody>
          {authors.map((author) => (
            <tr key={author.id}>
              <td data-label="الاسم">{author.name}</td>
              <td data-label="القصص">{author.story_count}</td>
              <td data-label="بارز">{author.featured ? "نعم" : "لا"}</td>
              <td data-label="إجراءات">
                <div className="row-actions">
                  <a className="btn-ghost" href={`/admin/authors/${author.id}`}>تعديل</a>
                  <form action={deleteAuthor}>
                    <input type="hidden" name="id" value={author.id} />
                    <ConfirmButton label="حذف" message="حذف المؤلف؟ القصص تبقى من غير اسمه." />
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
