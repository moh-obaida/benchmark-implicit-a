import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { PublicShell } from "@/components/PublicShell";
import { StoryCard } from "@/components/StoryCard";
import { getSession } from "@/lib/auth";
import { decodeParam } from "@/lib/format";
import { favoriteIds, getCategory, queryStories } from "@/lib/stories";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const category = getCategory(decodeParam((await params).slug));
  return { title: category?.name ?? "تصنيف" };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const category = getCategory(decodeParam((await params).slug));
  if (!category) notFound();
  const result = queryStories({ category: category.slug, pageSize: 24 });
  const saved = favoriteIds((await getSession())?.sub ?? null);
  return (
    <PublicShell>
      <div className="shell">
        <nav className="crumbs" aria-label="مسار التنقل">
          <ol>
            <li><a href="/categories">التصنيفات</a></li>
            <li><span aria-current="page">{category.name}</span></li>
          </ol>
        </nav>
        <header className="page-head">
          <h1>{category.name}</h1>
          {category.description ? <p>{category.description}</p> : null}
        </header>
        {result.items.length ? (
          <div className="story-grid" style={{ margin: "1.2rem 0 2.5rem" }}>
            {result.items.map((story) => (
              <StoryCard key={story.id} story={story} saved={saved.has(story.id)} />
            ))}
          </div>
        ) : (
          <EmptyState title="لا توجد قصص هنا حتى الآن." href="/categories" action="تصفح التصنيفات" />
        )}
      </div>
    </PublicShell>
  );
}
