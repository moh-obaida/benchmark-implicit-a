"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="shell" style={{ padding: "3rem 0" }}>
      <div className="empty-state">
        <h1>حدث أمر غير متوقع.</h1>
        <p>أعد المحاولة. إذا استمر الأمر، ارجع إلى الرئيسية.</p>
        <p style={{ marginTop: "0.9rem", display: "flex", gap: "0.5rem" }}>
          <button className="btn" type="button" onClick={reset}>إعادة المحاولة</button>
          <a className="btn-ghost" href="/">الرئيسية</a>
        </p>
      </div>
    </div>
  );
}
