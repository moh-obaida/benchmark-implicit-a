import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { FavoriteButton } from "@/components/FavoriteButton";
import { PublicShell } from "@/components/PublicShell";
import { StoryCard } from "@/components/StoryCard";
import { ViewBeacon } from "@/components/ViewBeacon";
import { getSession } from "@/lib/auth";
import { ageLabel, decodeParam, paragraphs, readingLabel, safeHttpUrl } from "@/lib/format";
import { recommendStories } from "@/lib/recommendations";
import { favoriteIds, getAuthorStories, getPublicStory, getRelatedStories, type StoryCard as StoryCardData } from "@/lib/stories";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const story = getPublicStory(decodeParam((await params).slug), true);
  if (!story) return { title: "قصة" };
  return {
    title: story.title,
    description: story.shortDescription || undefined,
    openGraph: story.coverId ? { images: [`/media/${story.coverId}`] } : undefined,
  };
}

export default async function StoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const slug = decodeParam((await params).slug);
  const preview = (await searchParams).preview === "1";
  const session = await getSession();
  const story = getPublicStory(slug, preview && session?.role === "admin");
  if (!story) notFound();
  const saved = favoriteIds(session?.sub ?? null);
  const seen = (await cookies()).get("yaraa_seen")?.value?.split(",").filter(Boolean) ?? [];
  const related = getRelatedStories(story.id, 4);
  const similar = recommendStories({
    focusStoryId: story.id,
    userId: session?.sub,
    seenIds: seen,
    limit: 4,
    excludeIds: [story.id, ...related.map((item) => item.id)],
  });
  const more = story.authorId ? getAuthorStories(story.authorId, story.id, 4) : [];
  const meta = [
    story.categoryName,
    story.genre,
    story.storyType,
    readingLabel(story.readingMinutes),
    ageLabel(story.ageMin, story.ageMax),
  ].filter(Boolean);
  const audio = safeHttpUrl(story.audioUrl);
  const video = safeHttpUrl(story.videoUrl);
  const source = safeHttpUrl(story.externalSource) || (story.externalSource && !story.externalSource.startsWith("http") ? story.externalSource : null);

  return (
    <PublicShell>
      <article className="shell" style={{ paddingBottom: "2.5rem" }}>
        {preview && session?.role === "admin" ? <p className="saved-note">معاينة مسودة — غير ظاهرة للزوار.</p> : <ViewBeacon id={story.id} />}
        <nav className="crumbs" aria-label="مسار التنقل">
          <ol>
            <li><a href="/explore">استكشف</a></li>
            {story.categorySlug ? (
              <li><a href={`/categories/${story.categorySlug}`}>{story.categoryName}</a></li>
            ) : null}
            <li><span aria-current="page">{story.title}</span></li>
          </ol>
        </nav>
        <div className="story-layout">
          <div>
            <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.4rem)", lineHeight: 1.25, margin: 0 }}>{story.title}</h1>
            {story.authorName ? (
              <p>
                <a className="text-link" href={story.authorSlug ? `/authors/${story.authorSlug}` : "#"}>
                  {story.authorName}
                </a>
              </p>
            ) : null}
            {meta.length ? <p className="meta-row">{meta.join(" · ")}</p> : null}
            <FavoriteButton storyId={story.id} saved={saved.has(story.id)} />
            {story.shortDescription ? <p className="hero-text">{story.shortDescription}</p> : null}
            <div className="prose" style={{ marginTop: "1.2rem" }}>
              {paragraphs(story.fullDescription).map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
            {story.narrator || story.seriesName ? (
              <p className="quiet">
                {story.narrator ? `الراوي: ${story.narrator}` : ""}
                {story.seriesName ? ` السلسلة: ${story.seriesName}` : ""}
                {story.episodeNumber ? ` · ${story.episodeNumber}` : ""}
              </p>
            ) : null}
            {source ? <p className="quiet">المصدر: {typeof source === "string" && source.startsWith("http") ? <a className="text-link" href={source}>{source}</a> : source}</p> : null}
            {audio ? <audio controls src={audio} style={{ width: "100%", marginTop: "0.8rem" }}>استماع</audio> : null}
            {video ? <p><a className="text-link" href={video}>مشاهدة</a></p> : null}
            {story.tags.length ? (
              <ul className="tag-list">
                {story.tags.map((tag) => (
                  <li key={tag.slug}><a href={`/search?q=${encodeURIComponent(tag.name)}`}>{tag.name}</a></li>
                ))}
              </ul>
            ) : null}
            {story.categories.length > 1 ? (
              <p className="quiet">
                {story.categories.map((category) => (
                  <a key={category.slug} href={`/categories/${category.slug}`} style={{ marginInlineEnd: "0.8rem" }}>
                    {category.name}
                  </a>
                ))}
              </p>
            ) : null}
            {story.images.length ? (
              <div className="gallery">
                {story.images.map((image) => (
                  <img key={image.id} src={`/media/${image.id}`} alt={image.alt || story.title} />
                ))}
              </div>
            ) : null}
            {story.authorBio ? (
              <section style={{ marginTop: "2rem" }}>
                <h2>عن المؤلف</h2>
                <p>{story.authorBio}</p>
              </section>
            ) : null}
          </div>
          <div className="story-cover" style={{ background: story.categoryColor || "#EEDCEE" }}>
            {story.coverId ? <img src={`/media/${story.coverId}`} alt={story.title} width={800} height={1067} /> : null}
          </div>
        </div>
        <StoryRow title="قصص مرتبطة" stories={related} saved={saved} />
        <StoryRow title="من المؤلف نفسه" stories={more} saved={saved} />
        <StoryRow title="قصص قريبة" stories={similar} saved={saved} />
      </article>
    </PublicShell>
  );
}

function StoryRow({
  title,
  stories,
  saved,
}: {
  title: string;
  stories: StoryCardData[];
  saved: Set<string>;
}) {
  if (!stories.length) return null;
  return (
    <section style={{ marginTop: "2.2rem" }}>
      <h2>{title}</h2>
      <div className="story-grid">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} saved={saved.has(story.id)} />
        ))}
      </div>
    </section>
  );
}
