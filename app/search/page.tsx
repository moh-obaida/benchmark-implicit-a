import { EmptyState } from "@/components/EmptyState";
import { Filters } from "@/components/Filters";
import { Pagination } from "@/components/Pagination";
import { PublicShell } from "@/components/PublicShell";
import { SearchForm } from "@/components/SearchForm";
import { StoryCard } from "@/components/StoryCard";
import { getSession } from "@/lib/auth";
import { storyCountLabel } from "@/lib/format";
import { favoriteIds, getFilterOptions, queryStories } from "@/lib/stories";

export const metadata = { title: "البحث" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] || "" : value || "";
  };
  const values = {
    q: read("q"),
    category: read("category"),
    genre: read("genre"),
    age: read("age"),
    type: read("type"),
    author: read("author"),
    tag: read("tag"),
    sort: read("sort") || "newest",
    page: read("page"),
  };
  const session = await getSession();
  const saved = favoriteIds(session?.sub ?? null);
  const result = values.q || values.tag || values.category || values.genre || values.type || values.author || values.age
    ? queryStories({ ...values, page: Number(values.page || 1) })
    : null;

  return (
    <PublicShell>
      <div className="shell">
        <header className="page-head">
          <h1>البحث</h1>
          <p>ابحث بالعنوان أو المؤلف أو التصنيف أو الوسم.</p>
        </header>
        <SearchForm initial={values.q} large />
        <Filters action="/search" values={values} options={getFilterOptions()} />
        {!result ? (
          <EmptyState title="اكتب ما تبحث عنه." text="عنوان قصة، اسم مؤلف، تصنيف، أو وسم." />
        ) : result.items.length ? (
          <>
            <p className="quiet">{storyCountLabel(result.total)}</p>
            <div className="story-grid" style={{ marginTop: "1rem" }}>
              {result.items.map((story) => (
                <StoryCard key={story.id} story={story} saved={saved.has(story.id)} />
              ))}
            </div>
            <Pagination
              page={result.page}
              pages={result.pages}
              makeHref={(page) => `/search?${new URLSearchParams({ ...values, page: String(page) }).toString()}`}
            />
          </>
        ) : (
          <EmptyState title="ما لقينا قصة تطابق بحثك." href="/explore" action="تصفح المكتبة" />
        )}
      </div>
    </PublicShell>
  );
}
