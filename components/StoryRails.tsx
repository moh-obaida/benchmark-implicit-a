import { ScrollRow } from "@/components/ScrollRow";
import { StoryCard } from "@/components/StoryCard";
import type { StoryCard as StoryCardData } from "@/lib/stories";

export function StoryRails({
  stories,
  layout,
  saved,
}: {
  stories: StoryCardData[];
  layout: "grid" | "carousel" | "spotlight";
  saved: Set<string>;
}) {
  if (!stories.length) return <EmptyInline />;
  if (layout === "carousel") {
    return (
      <ScrollRow>
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} saved={saved.has(story.id)} />
        ))}
      </ScrollRow>
    );
  }
  return (
    <div className={layout === "spotlight" ? "spotlight" : "story-grid"}>
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} saved={saved.has(story.id)} />
      ))}
    </div>
  );
}

function EmptyInline() {
  return (
    <div className="empty-state">
      <h3>لا توجد قصص هنا حتى الآن.</h3>
    </div>
  );
}
