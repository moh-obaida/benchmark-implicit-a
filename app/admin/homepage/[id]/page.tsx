import { notFound } from "next/navigation";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/ActionForm";
import { MediaField } from "@/components/admin/MediaField";
import { CheckFilter, ManualOrder } from "@/components/admin/Pickers";
import { deleteSection, saveHomepageSection } from "@/lib/actions/admin";
import { formOptions } from "@/lib/admin-options";
import { requireAdmin } from "@/lib/auth";
import { LAYOUTS, PALETTE, STORY_SECTION_TYPES, sectionTypeLabel } from "@/lib/constants";
import { queryAll } from "@/lib/db";
import { toLocalInput } from "@/lib/format";
import { getHomeSection } from "@/lib/homepage";

export const metadata = { title: "تعديل قسم" };

export default async function EditSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const section = getHomeSection((await params).id);
  if (!section) notFound();
  const options = formOptions();
  const items = queryAll<{ story_id: string | null; pinned: number; excluded: number }>(
    "SELECT story_id, pinned, excluded FROM section_items WHERE section_id = ? ORDER BY sort_order ASC",
    section.id,
  );
  const manual = items.filter((item) => item.story_id && item.excluded !== 1).map((item) => item.story_id as string);
  const pinned = items.filter((item) => item.pinned === 1 && item.story_id).map((item) => item.story_id as string);
  const excluded = items.filter((item) => item.excluded === 1 && item.story_id).map((item) => item.story_id as string);
  const storySection = STORY_SECTION_TYPES.has(section.type);
  return (
    <>
      <header className="page-head">
        <h1>{section.title}</h1>
        <p className="quiet">{sectionTypeLabel(section.type)}</p>
      </header>
      {(await searchParams).saved === "1" ? <p className="saved-note">تم الحفظ.</p> : null}
      <ActionForm action={saveHomepageSection}>
        <input type="hidden" name="id" value={section.id} />
        <fieldset className="group">
          <legend>النص والترتيب</legend>
          <label className="field"><span>العنوان</span><input name="title" defaultValue={section.title} required /></label>
          <label className="field"><span>السطر التعريفي</span><input name="subtitle" defaultValue={section.subtitle} /></label>
          <div className="fields-2">
            <label className="field"><span>يظهر من</span><input type="datetime-local" name="visible_from" defaultValue={toLocalInput(section.visibleFrom)} /></label>
            <label className="field"><span>يختفي بعد</span><input type="datetime-local" name="visible_until" defaultValue={toLocalInput(section.visibleUntil)} /></label>
          </div>
          <fieldset>
            <legend>لون القسم المعتمد</legend>
            <div className="swatches">
              <label><input type="radio" name="accent" value="" defaultChecked={!section.accent} /> بدون</label>
              {PALETTE.map((color) => (
                <label key={color.hex}>
                  <input type="radio" name="accent" value={color.hex} defaultChecked={section.accent === color.hex} />
                  <span className="swatch" style={{ background: color.hex }} />
                  {color.label}
                </label>
              ))}
            </div>
          </fieldset>
        </fieldset>
        {section.type === "hero" ? (
          <fieldset className="group">
            <legend>الترحيب</legend>
            <label className="field"><span>سطر صغير</span><input name="kicker" defaultValue={section.config.kicker ?? ""} /></label>
            <label className="field"><span>العنوان الكبير</span><input name="hero_title" defaultValue={section.config.heroTitle ?? ""} /></label>
            <label className="field"><span>النص</span><textarea name="hero_text" defaultValue={section.config.heroText ?? ""} /></label>
            <label className="field">
              <span>قصة الغلاف</span>
              <select name="hero_story_id" defaultValue={section.config.heroStoryId ?? ""}>
                <option value="">اختيار تلقائي</option>
                {options.stories.map((story) => <option key={story.id} value={story.id}>{story.title}</option>)}
              </select>
            </label>
          </fieldset>
        ) : null}
        {section.type === "banner" ? (
          <fieldset className="group">
            <legend>اللافتة</legend>
            <label className="field"><span>العنوان</span><input name="banner_title" defaultValue={section.config.bannerTitle ?? ""} /></label>
            <label className="field"><span>النص</span><textarea name="banner_body" defaultValue={section.config.bannerBody ?? ""} /></label>
            <MediaField name="media_id" label="الصورة" initialId={section.config.mediaId} library={options.library} />
            <label className="field">
              <span>الرابط</span>
              <select name="link_type" defaultValue={section.config.linkType ?? "none"}>
                <option value="none">بدون</option>
                <option value="explore">استكشف</option>
                <option value="story">قصة</option>
                <option value="category">تصنيف</option>
              </select>
            </label>
            <label className="field"><span>معرّف القصة أو التصنيف</span><input name="link_id" defaultValue={section.config.linkId ?? ""} /></label>
          </fieldset>
        ) : null}
        {section.type === "announcement" ? (
          <fieldset className="group">
            <legend>التنبيه</legend>
            <label className="field"><span>النص</span><textarea name="announcement_body" defaultValue={section.config.announcementBody ?? ""} /></label>
          </fieldset>
        ) : null}
        {storySection || section.type === "categories" || section.type === "authors" ? (
          <fieldset className="group">
            <legend>المحتوى</legend>
            <label className="field">
              <span>طريقة الاختيار</span>
              <select name="mode" defaultValue={section.mode}>
                <option value="automatic">تلقائي</option>
                <option value="manual">اختيار يدوي</option>
              </select>
            </label>
            <label className="field"><span>عدد العناصر</span><input name="item_count" type="number" min={1} max={24} defaultValue={section.itemCount} /></label>
            {storySection ? (
              <>
                <label className="field">
                  <span>نمط العرض</span>
                  <select name="layout" defaultValue={section.layout}>
                    {LAYOUTS.map((layout) => <option key={layout.id} value={layout.id}>{layout.label}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>تصفية بتصنيف</span>
                  <select name="category_id" defaultValue={section.categoryId ?? ""}>
                    <option value="">كل التصنيفات</option>
                    {options.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <ManualOrder stories={options.stories} selected={section.mode === "manual" ? manual : []} />
                <CheckFilter items={options.stories} name="pinned_ids" selected={pinned} label="تثبيت في البداية عند الوضع التلقائي" />
                <CheckFilter items={options.stories} name="excluded_ids" selected={excluded} label="إخفاء من القسم التلقائي" />
              </>
            ) : null}
            {section.type === "categories" ? (
              <CheckFilter
                items={options.categories.map((category) => ({ id: category.id, title: category.name }))}
                name="category_ids"
                selected={section.config.categoryIds ?? []}
                label="تصنيفات الاختيار اليدوي"
              />
            ) : null}
            {section.type === "authors" ? (
              <CheckFilter
                items={options.authors.map((author) => ({ id: author.id, title: author.name }))}
                name="author_ids"
                selected={section.config.authorIds ?? []}
                label="مؤلفو الاختيار اليدوي"
              />
            ) : null}
          </fieldset>
        ) : null}
        <SubmitButton>حفظ القسم</SubmitButton>
      </ActionForm>
      <form action={deleteSection} style={{ marginTop: "1rem" }}>
        <input type="hidden" name="id" value={section.id} />
        <ConfirmButton label="حذف القسم" message="حذف هذا القسم من الصفحة الرئيسية؟" />
      </form>
    </>
  );
}
