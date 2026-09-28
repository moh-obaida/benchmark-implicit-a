import { EmptyState } from "@/components/EmptyState";
import { Filters } from "@/components/Filters";
import { Pagination } from "@/components/Pagination";
import { PublicShell } from "@/components/PublicShell";
import { SearchForm } from "@/components/SearchForm";
import { StoryCard } from "@/components/StoryCard";
import { getSession } from "@/lib/auth";
import { storyCountLabel } from "@/lib/format";
import { favoriteIds, getFilterOptions, queryStories } from "@/lib/stories";

export const metadata = { title: "استكشف" };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const values = readQuery(params);
  const result = queryStories({
    q: values.q,
    category: values.category,
    genre: values.genre,
    age: values.age,
    type: values.type,
    author: values.author,
    sort: values.sort || "newest",
    page: Number(values.page || 1),
  });
  const session = await getSession();
  const saved = favoriteIds(session?.sub ?? null);
  const filtered = Boolean(values.q || values.category || values.genre || values.age || values.type || values.author);
  return (
    <PublicShell>
      <div className="shell">
        <header className="page-head">
          <h1>استكشف</h1>
          <p>كل القصص المنشورة في مكان واحد. صفِّها أو رتّبها كما تريد.</p>
        </header>
        <SearchForm initial={values.q} action="/explore" placeholder="ابحث داخل المكتبة" />
        <Filters action="/explore" values={values} options={getFilterOptions()} />
        <p className="quiet">{storyCountLabel(result.total)}</p>
        {result.items.length ? (
          <div className="story-grid" style={{ marginTop: "1rem" }}>
            {result.items.map((story) => (
              <StoryCard key={story.id} story={story} saved={saved.has(story.id)} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={filtered ? "ما لقينا قصة تطابق بحثك." : "لا توجد قصص هنا حتى الآن."}
            href="/explore"
            action={filtered ? "مسح التصفية" : undefined}
          />
        )}
        <Pagination
          page={result.page}
          pages={result.pages}
          makeHref={(page) => {
            const query = new URLSearchParams({ ...values, page: String(page) });
            return `/explore?${query.toString()}`;
          }}
        />
      </div>
    </PublicShell>
  );
}

function readQuery(params: Record<string, string | string[] | undefined>) {
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] || "" : value || "";
  };
  return {
    q: read("q"),
    category: read("category"),
    genre: read("genre"),
    age: read("age"),
    type: read("type"),
    author: read("author"),
    sort: read("sort"),
    page: read("page"),
  };
}
