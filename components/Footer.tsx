import { listCategories } from "@/lib/stories";
import type { PublicSettings } from "@/lib/settings";
import { safeHttpUrl } from "@/lib/format";

export function Footer({ settings }: { settings: PublicSettings }) {
  const categories = listCategories({ nav: true }).slice(0, 6);
  const instagram = safeHttpUrl(settings.instagram);
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <h2>{settings.siteName}</h2>
          <p className="footer-note">{settings.siteDescription}</p>
          {settings.contactEmail ? <p className="footer-note">{settings.contactEmail}</p> : null}
          {settings.contactNote ? <p className="footer-note">{settings.contactNote}</p> : null}
        </div>
        <div>
          <h2>تجوّل</h2>
          <ul>
            <li><a href="/">الرئيسية</a></li>
            <li><a href="/categories">التصنيفات</a></li>
            <li><a href="/explore">استكشف</a></li>
            <li><a href="/search">البحث</a></li>
            <li><a href="/favorites">المفضلة</a></li>
          </ul>
        </div>
        <div>
          <h2>تصنيفات</h2>
          <ul>
            {categories.map((category) => (
              <li key={category.id}>
                <a href={`/categories/${category.slug}`}>{category.name}</a>
              </li>
            ))}
          </ul>
          {instagram ? (
            <p style={{ marginTop: "0.8rem" }}>
              <a className="text-link" href={instagram}>إنستغرام</a>
            </p>
          ) : null}
          {settings.socialLinks.map((link) => {
            const href = safeHttpUrl(link.url);
            if (!href) return null;
            return (
              <p key={href}>
                <a className="text-link" href={href}>{link.label}</a>
              </p>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
