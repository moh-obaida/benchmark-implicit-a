import { FavoriteButton } from "@/components/FavoriteButton";
import { ageLabel, readingLabel } from "@/lib/format";
import type { StoryCard as StoryCardData } from "@/lib/stories";

export function StoryCard({ story, saved = false }: { story: StoryCardData; saved?: boolean }) {
  const meta = [readingLabel(story.readingMinutes), ageLabel(story.ageMin, story.ageMax)].filter(Boolean);
  return (
    <article className="story-card">
      <a className="story-card-link" href={`/stories/${story.slug}`}>
        <div className="cover" style={{ background: story.categoryColor || "#EEDCEE" }}>
          {story.coverId ? (
            <img src={`/media/${story.coverId}`} alt={story.title} width={800} height={1067} loading="lazy" decoding="async" />
          ) : null}
        </div>
        <div className="story-card-body">
          {story.categoryName ? <p className="story-cat">{story.categoryName}</p> : null}
          <h3>{story.title}</h3>
          {story.authorName ? <p className="quiet">{story.authorName}</p> : null}
          {meta.length ? <p className="story-meta">{meta.join(" · ")}</p> : null}
        </div>
      </a>
      <FavoriteButton storyId={story.id} saved={saved} compact />
    </article>
  );
}
