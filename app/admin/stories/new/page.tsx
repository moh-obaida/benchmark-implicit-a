import { StoryForm } from "@/components/admin/StoryForm";
import { requireAdmin } from "@/lib/auth";
import { formOptions } from "@/lib/admin-options";

export const metadata = { title: "إضافة قصة" };

export default async function NewStoryPage() {
  await requireAdmin();
  const options = formOptions();
  return (
    <>
      <header className="page-head"><h1>إضافة قصة</h1></header>
      <StoryForm
        story={{ published: 0 }}
        authors={options.authors}
        categories={options.categories.map((category) => ({ ...category, title: category.name }))}
        stories={options.stories}
        library={options.library}
        primaryCategoryId=""
        categoryIds={[]}
        tags=""
        relatedIds={[]}
        extraImageIds=""
      />
    </>
  );
}
