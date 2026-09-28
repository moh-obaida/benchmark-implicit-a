import { loginAdmin } from "@/lib/actions/admin";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { Mark } from "@/components/icons";

export const metadata = { title: "دخول الإدارة" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = (await searchParams).next || "/admin";
  return (
    <div className="shell" style={{ padding: "4rem 0", maxWidth: 480 }}>
      <Mark />
      <h1 style={{ marginTop: "0.8rem" }}>دخول الإدارة</h1>
      <p className="quiet">هذه الصفحة للمسؤولين عن محتوى يراع.</p>
      <ActionForm action={loginAdmin}>
        <input type="hidden" name="next" value={next.startsWith("/admin") ? next : "/admin"} />
        <label className="field">
          <span>البريد</span>
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label className="field" style={{ marginTop: "0.7rem" }}>
          <span>كلمة المرور</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <div style={{ marginTop: "0.9rem" }}>
          <SubmitButton>دخول</SubmitButton>
        </div>
      </ActionForm>
      <p style={{ marginTop: "1.2rem" }}>
        <a className="text-link" href="/">العودة إلى يراع</a>
      </p>
    </div>
  );
}
