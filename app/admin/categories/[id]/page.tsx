import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { formOptions } from "@/lib/admin-options";
import { requireAdmin } from "@/lib/auth";
import { queryAll, queryOne } from "@/lib/db";

export const metadata = { title: "تعديل تصنيف" };

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const id = (await params).id;
  const category = queryOne<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_id: string | null;
    icon: string;
    color: string;
    sort_order: number;
    published: number;
    show_on_home: number;
    show_in_nav: number;
    featured: number;
  }>("SELECT * FROM categories WHERE id = ?", id);
  if (!category) notFound();
  const selected = queryAll<{ story_id: string }>("SELECT story_id FROM story_categories WHERE category_id = ?", id).map((row) => row.story_id);
  const options = formOptions();
  return (
    <>
      <header className="page-head"><h1>تعديل التصنيف</h1></header>
      {(await searchParams).saved === "1" ? <p className="saved-note">تم الحفظ.</p> : null}
      <CategoryForm category={category} stories={options.stories} selected={selected} library={options.library} />
    </>
  );
}
