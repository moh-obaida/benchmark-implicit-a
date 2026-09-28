import { PublicShell } from "@/components/PublicShell";

export default function NotFound() {
  return (
    <PublicShell>
      <div className="shell" style={{ padding: "3rem 0" }}>
        <div className="empty-state">
          <h1>هذه الصفحة غير موجودة.</h1>
          <p>عد إلى المكتبة وابحث عن قصة أخرى.</p>
          <p style={{ marginTop: "0.9rem" }}>
            <a className="btn" href="/">الرئيسية</a>
          </p>
        </div>
      </div>
    </PublicShell>
  );
}
