import { notFound } from "next/navigation";
import { AuthorForm } from "@/components/admin/AuthorForm";
import { formOptions } from "@/lib/admin-options";
import { requireAdmin } from "@/lib/auth";
import { queryAll, queryOne } from "@/lib/db";

export const metadata = { title: "تعديل مؤلف" };

export default async function EditAuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const id = (await params).id;
  const author = queryOne<{ id: string; name: string; slug: string; bio: string | null; image_id: string | null; featured: number }>(
    "SELECT id, name, slug, bio, image_id, featured FROM authors WHERE id = ?",
    id,
  );
  if (!author) notFound();
  const stories = queryAll<{ id: string; title: string; slug: string }>(
    "SELECT id, title, slug FROM stories WHERE author_id = ? ORDER BY title",
    id,
  );
  return (
    <>
      <header className="page-head"><h1>تعديل المؤلف</h1></header>
      {(await searchParams).saved === "1" ? <p className="saved-note">تم الحفظ.</p> : null}
      <AuthorForm author={author} library={formOptions().library} />
      <section style={{ marginTop: "1.4rem" }}>
        <h2>قصصه</h2>
        {stories.length ? (
          <ul>
            {stories.map((story) => (
              <li key={story.id}><a className="text-link" href={`/admin/stories/${story.id}`}>{story.title}</a></li>
            ))}
          </ul>
        ) : (
          <p>لا توجد قصص هنا حتى الآن.</p>
        )}
      </section>
    </>
  );
}
