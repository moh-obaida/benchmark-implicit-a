import { CategoryIcon } from "@/components/icons";
import { PublicShell } from "@/components/PublicShell";
import { storyCountLabel } from "@/lib/format";
import { listCategories } from "@/lib/stories";

export const metadata = { title: "التصنيفات" };

export default function CategoriesPage() {
  const categories = listCategories();
  return (
    <PublicShell>
      <div className="shell">
        <header className="page-head">
          <h1>التصنيفات</h1>
          <p>اختر نوع الحكاية الذي يناسبك الآن.</p>
        </header>
        {categories.length ? (
          <div className="category-grid" style={{ margin: "1.4rem 0 2.5rem" }}>
            {categories.map((category) => (
              <a key={category.id} className="category-tile" href={`/categories/${category.slug}`} style={{ background: category.color }}>
                <CategoryIcon name={category.icon} />
                <span>
                  <strong>{category.name}</strong>
                  {category.description || storyCountLabel(category.story_count)}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p>لا توجد تصنيفات هنا حتى الآن.</p>
        )}
      </div>
    </PublicShell>
  );
}
