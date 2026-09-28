import { PublicShell } from "@/components/PublicShell";
import { logoutReader, saveReaderProfile } from "@/lib/actions/public";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { ActionForm } from "@/components/admin/ActionForm";

export const metadata = { title: "الحساب" };

export default async function AccountPage() {
  const session = await getSession();
  const user = session
    ? queryOne<{ name: string; email: string | null; role: string }>(
        "SELECT name, email, role FROM users WHERE id = ?",
        session.sub,
      )
    : null;
  return (
    <PublicShell>
      <div className="shell" style={{ paddingBottom: "3rem", maxWidth: 720 }}>
        <header className="page-head">
          <h1>الحساب</h1>
          <p>
            التصفح والبحث وقراءة القصص لا تحتاج حسابًا. الحفظ يعمل فورًا على هذا الجهاز. أدخل اسمك وبريدك إذا أردت استرجاع المفضلة لاحقًا.
          </p>
        </header>
        <ActionForm action={saveReaderProfile} className="surface-card">
          <label className="field">
            <span>الاسم</span>
            <input name="name" defaultValue={user?.email ? user.name : ""} required minLength={2} autoComplete="name" />
          </label>
          <label className="field">
            <span>البريد</span>
            <input name="email" type="email" defaultValue={user?.email ?? ""} required autoComplete="email" />
          </label>
          <button className="btn" type="submit">حفظ البيانات</button>
        </ActionForm>
        {user?.email && user.role !== "admin" ? (
          <form action={logoutReader} style={{ marginTop: "1rem" }}>
            <button className="btn-ghost" type="submit">خروج</button>
          </form>
        ) : null}
      </div>
    </PublicShell>
  );
}
