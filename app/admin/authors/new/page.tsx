import { AuthorForm } from "@/components/admin/AuthorForm";
import { formOptions } from "@/lib/admin-options";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "إضافة مؤلف" };

export default async function NewAuthorPage() {
  await requireAdmin();
  return (
    <>
      <header className="page-head"><h1>إضافة مؤلف</h1></header>
      <AuthorForm author={{}} library={formOptions().library} />
    </>
  );
}
