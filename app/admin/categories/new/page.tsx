import { CategoryForm } from "@/components/admin/CategoryForm";
import { formOptions } from "@/lib/admin-options";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "إضافة تصنيف" };

export default async function NewCategoryPage() {
  await requireAdmin();
  const options = formOptions();
  return (
    <>
      <header className="page-head"><h1>إضافة تصنيف</h1></header>
      <CategoryForm category={{ published: 1, show_on_home: 1, color: "#EEDCEE", icon: "quill" }} stories={options.stories} selected={[]} library={options.library} />
    </>
  );
}
