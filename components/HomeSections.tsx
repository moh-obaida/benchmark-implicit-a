import { CategoryIcon } from "@/components/icons";
import { SearchForm } from "@/components/SearchForm";
import { StoryRails } from "@/components/StoryRails";
import { storyCountLabel } from "@/lib/format";
import type { ResolvedSection } from "@/lib/homepage";

export function HomeSections({
  sections,
  saved,
}: {
  sections: ResolvedSection[];
  saved: Set<string>;
}) {
  let usedH1 = false;
  return (
    <div className="shell">
      {sections.map((section) => {
        if (section.kind === "hero") {
          const heading = usedH1 ? "h2" : "h1";
          usedH1 = true;
          const Title = heading;
          return (
            <section className="hero section-block" key={section.id}>
              <div>
                <p className="hero-kicker">{section.kicker}</p>
                <Title>{section.title}</Title>
                {section.text ? <p className="hero-text">{section.text}</p> : null}
                <div style={{ marginTop: "1.2rem" }}>
                  <SearchForm large placeholder="ابحث عن قصة، مؤلف، تصنيف، أو وسم" />
                </div>
              </div>
              {section.story ? (
                <a href={`/stories/${section.story.slug}`}>
                  <div className="story-cover" style={{ background: section.story.categoryColor || "#EEDCEE" }}>
                    {section.story.coverId ? (
                      <img
                        src={`/media/${section.story.coverId}`}
                        alt={section.story.title}
                        width={800}
                        height={1067}
                        fetchPriority="high"
                      />
                    ) : null}
                  </div>
                  <p className="hero-story">
                    {section.story.title}
                    {section.story.authorName ? ` — ${section.story.authorName}` : ""}
                  </p>
                </a>
              ) : null}
            </section>
          );
        }
        if (section.kind === "announcement") {
          return (
            <section key={section.id} className="section-block" style={{ background: section.accent || "#EEDCEE", borderRadius: 14, padding: "1rem 1.1rem" }}>
              <h2 style={{ margin: 0 }}>{section.title}</h2>
              {section.body ? <p style={{ margin: "0.3rem 0 0" }}>{section.body}</p> : null}
            </section>
          );
        }
        return (
          <section key={section.id} className="section-block" style={section.accent ? { ["--accent" as string]: section.accent } : undefined}>
            <div className={"accent" in section && section.accent ? "section-head section-accent" : "section-head"}>
              <div>
                <h2>{section.title}</h2>
                {"subtitle" in section && section.subtitle ? <p className="section-kicker">{section.subtitle}</p> : null}
              </div>
              {section.kind === "categories" ? <a className="text-link" href="/categories">كل التصنيفات</a> : null}
              {section.kind === "stories" ? <a className="text-link" href="/explore">استكشف</a> : null}
            </div>
            {section.kind === "categories" ? (
              section.categories.length ? (
                <div className="category-grid">
                  {section.categories.map((category) => (
                    <a key={category.id} className="category-tile" href={`/categories/${category.slug}`} style={{ background: category.color }}>
                      <CategoryIcon name={category.icon} />
                      <span>
                        <strong>{category.name}</strong>
                        {category.storyCount ? storyCountLabel(category.storyCount) : category.description}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p>لا توجد تصنيفات هنا حتى الآن.</p>
              )
            ) : null}
            {section.kind === "stories" ? <StoryRails stories={section.stories} layout={section.layout} saved={saved} /> : null}
            {section.kind === "authors" ? (
              <div className="author-grid">
                {section.authors.map((author) => (
                  <a key={author.id} className="author-card" href={`/authors/${author.slug}`}>
                    {author.imageId ? (
                      <img className="avatar" src={`/media/${author.imageId}`} alt="" width={400} height={400} />
                    ) : (
                      <span className="avatar-fallback" />
                    )}
                    <span>
                      <h3>{author.name}</h3>
                      <p className="quiet">{storyCountLabel(author.storyCount)}</p>
                    </span>
                  </a>
                ))}
              </div>
            ) : null}
            {section.kind === "banner" ? (
              <article className="surface-card" style={{ display: "grid", gridTemplateColumns: section.mediaId ? "160px 1fr" : "1fr", gap: "1rem", padding: "1rem" }}>
                {section.mediaId ? <img src={`/media/${section.mediaId}`} alt="" style={{ borderRadius: 12, width: "100%", height: 160, objectFit: "cover" }} /> : null}
                <div>
                  <h3 style={{ margin: 0 }}>{section.title}</h3>
                  {section.body ? <p>{section.body}</p> : null}
                  {section.href ? <a className="text-link" href={section.href}>افتح</a> : null}
                </div>
              </article>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
