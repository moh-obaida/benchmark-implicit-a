import { Mark } from "@/components/icons";
import { MobileNav } from "@/components/MobileNav";
import { SearchForm } from "@/components/SearchForm";
import { listCategories } from "@/lib/stories";
import { formatNumber } from "@/lib/format";

export function Header({
  name,
  favoriteCount,
}: {
  name: string | null;
  favoriteCount: number;
}) {
  const categories = listCategories({ nav: true });
  return (
    <header className="site-header">
      <div className="brand-line" />
      <div className="shell header-row">
        <a className="brand" href="/">
          <Mark />
          <span>يراع</span>
        </a>
        <nav className="nav-links" aria-label="التنقل الرئيسي">
          <a href="/">الرئيسية</a>
          <details className="nav-details">
            <summary>التصنيفات</summary>
            <div className="nav-panel">
              <a href="/categories">كل التصنيفات</a>
              {categories.map((category) => (
                <a key={category.id} href={`/categories/${category.slug}`}>
                  {category.name}
                </a>
              ))}
            </div>
          </details>
          <a href="/explore">استكشف</a>
        </nav>
        <div className="header-tools">
          <div className="header-search">
            <SearchForm />
          </div>
          <a className="header-account" href="/favorites">
            المفضلة{favoriteCount ? ` (${formatNumber(favoriteCount)})` : ""}
          </a>
          <a className="header-account" href="/account">
            {name || "الحساب"}
          </a>
          <MobileNav>
            <a href="/">الرئيسية</a>
            <a href="/categories">التصنيفات</a>
            {categories.map((category) => (
              <a key={category.id} href={`/categories/${category.slug}`}>
                {category.name}
              </a>
            ))}
            <a href="/explore">استكشف</a>
            <a href="/search">البحث</a>
            <a href="/favorites">المفضلة</a>
            <a href="/account">{name || "الحساب"}</a>
          </MobileNav>
        </div>
      </div>
    </header>
  );
}
