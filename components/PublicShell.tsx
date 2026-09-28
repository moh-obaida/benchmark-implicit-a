import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export async function PublicShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const settings = getSettings();
  const profile = session
    ? queryOne<{ name: string; email: string | null }>("SELECT name, email FROM users WHERE id = ?", session.sub)
    : null;
  const favoriteCount = session
    ? Number(queryOne<{ total: number }>("SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?", session.sub)?.total ?? 0)
    : 0;
  const displayName = profile?.email ? profile.name : null;
  return (
    <>
      <a className="skip-link" href="#main">تخطَّ إلى المحتوى</a>
      <Header name={displayName} favoriteCount={favoriteCount} />
      <main id="main">{children}</main>
      <Footer settings={settings} />
    </>
  );
}
