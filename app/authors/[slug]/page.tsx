import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { PublicShell } from "@/components/PublicShell";
import { StoryCard } from "@/components/StoryCard";
import { getSession } from "@/lib/auth";
import { decodeParam, paragraphs } from "@/lib/format";
import { favoriteIds, getAuthor, getAuthorStories } from "@/lib/stories";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const author = getAuthor(decodeParam((await params).slug));
  return { title: author?.name ?? "مؤلف" };
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const author = getAuthor(decodeParam((await params).slug));
  if (!author) notFound();
  const stories = getAuthorStories(author.id, undefined, 24);
  const saved = favoriteIds((await getSession())?.sub ?? null);
  return (
    <PublicShell>
      <div className="shell" style={{ paddingBottom: "2.5rem" }}>
        <header className="page-head" style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: "1rem", alignItems: "center" }}>
          {author.image_id ? (
            <img className="avatar" src={`/media/${author.image_id}`} alt="" width={400} height={400} style={{ width: 96, height: 96 }} />
          ) : (
            <span className="avatar-fallback" style={{ width: 96, height: 96 }} />
          )}
          <div>
            <h1>{author.name}</h1>
            {paragraphs(author.bio).map((paragraph) => (
              <p key={paragraph.slice(0, 20)}>{paragraph}</p>
            ))}
          </div>
        </header>
        {stories.length ? (
          <div className="story-grid">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} saved={saved.has(story.id)} />
            ))}
          </div>
        ) : (
          <EmptyState title="لا توجد قصص هنا حتى الآن." />
        )}
      </div>
    </PublicShell>
  );
}
