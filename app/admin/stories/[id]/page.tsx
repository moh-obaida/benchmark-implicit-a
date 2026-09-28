import { notFound } from "next/navigation";
import { StoryForm } from "@/components/admin/StoryForm";
import { requireAdmin } from "@/lib/auth";
import { formOptions, storyRelations } from "@/lib/admin-options";
import { queryOne } from "@/lib/db";

export const metadata = { title: "تعديل قصة" };

export default async function EditStoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const id = (await params).id;
  const story = queryOne<Record<string, unknown>>("SELECT * FROM stories WHERE id = ?", id);
  if (!story) notFound();
  const options = formOptions();
  const relations = storyRelations(id);
  const saved = (await searchParams).saved === "1";
  return (
    <>
      <header className="page-head"><h1>تعديل القصة</h1></header>
      {saved ? <p className="saved-note">تم الحفظ.</p> : null}
      <StoryForm
        story={story as never}
        authors={options.authors}
        categories={options.categories.map((category) => ({ ...category, title: category.name }))}
        stories={options.stories}
        library={options.library}
        {...relations}
      />
    </>
  );
}
