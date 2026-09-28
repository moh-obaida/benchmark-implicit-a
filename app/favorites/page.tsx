import { EmptyState } from "@/components/EmptyState";
import { PublicShell } from "@/components/PublicShell";
import { StoryCard } from "@/components/StoryCard";
import { getSession } from "@/lib/auth";
import { queryAll } from "@/lib/db";
import { getCardsByIds } from "@/lib/stories";

export const metadata = { title: "المفضلة" };

export default async function FavoritesPage() {
  const session = await getSession();
  const ids = session
    ? queryAll<{ story_id: string }>(
        "SELECT story_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC",
        session.sub,
      ).map((row) => row.story_id)
    : [];
  const stories = getCardsByIds(ids);
  return (
    <PublicShell>
      <div className="shell" style={{ paddingBottom: "2.5rem" }}>
        <header className="page-head">
          <h1>المفضلة</h1>
          <p>القصص التي حفظتها على هذا الجهاز. اربطها باسمك وبريدك إن أردت الرجوع إليها لاحقًا.</p>
        </header>
        {stories.length ? (
          <div className="story-grid">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} saved />
            ))}
          </div>
        ) : (
          <EmptyState title="لم تحفظ أي قصة بعد." href="/explore" action="استكشف القصص" />
        )}
      </div>
    </PublicShell>
  );
}
