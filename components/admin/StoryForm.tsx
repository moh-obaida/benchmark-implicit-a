import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { MediaField } from "@/components/admin/MediaField";
import { CheckFilter } from "@/components/admin/Pickers";
import { saveStory } from "@/lib/actions/admin";
import { toLocalInput } from "@/lib/format";

type Option = { id: string; title: string };
type CategoryOption = Option & { name: string };

export function StoryForm({
  story,
  authors,
  categories,
  stories,
  library,
  primaryCategoryId,
  categoryIds,
  tags,
  relatedIds,
  extraImageIds,
}: {
  story: {
    id?: string;
    title?: string;
    slug?: string;
    short_description?: string | null;
    full_description?: string | null;
    author_id?: string | null;
    cover_id?: string | null;
    age_min?: number | null;
    story_type?: string | null;
    genre?: string | null;
    reading_minutes?: number | null;
    age_max?: number | null;
    featured?: number;
    editor_pick?: number;
    published?: number;
    publish_at?: string | null;
    priority?: number;
    admin_notes?: string | null;
    display_order?: number;
    narrator?: string | null;
    series_name?: string | null;
    episode_number?: number | null;
    external_source?: string | null;
    audio_url?: string | null;
    video_url?: string | null;
  };
  authors: { id: string; name: string }[];
  categories: CategoryOption[];
  stories: Option[];
  library: { id: string; alt: string | null }[];
  primaryCategoryId: string;
  categoryIds: string[];
  tags: string;
  relatedIds: string[];
  extraImageIds: string;
}) {
  return (
    <ActionForm action={saveStory} className="form-layout">
      {story.id ? <input type="hidden" name="id" value={story.id} /> : null}
      <nav className="form-nav" aria-label="أقسام النموذج">
        <a href="#basic">المعلومات الأساسية</a>
        <a href="#media">الوسائط</a>
        <a href="#author">المؤلف</a>
        <a href="#category">التصنيف</a>
        <a href="#tags">الوسوم</a>
        <a href="#description">الوصف</a>
        <a href="#discovery">الاكتشاف</a>
        <a href="#display">العرض</a>
        <a href="#related">محتوى مرتبط</a>
        <a href="#publishing">النشر</a>
      </nav>
      <div>
        <fieldset className="group" id="basic">
          <legend>المعلومات الأساسية</legend>
          <label className="field"><span>العنوان</span><input name="title" required defaultValue={story.title ?? ""} /></label>
          <div className="fields-2" style={{ marginTop: "0.7rem" }}>
            <label className="field"><span>المسار</span><input name="slug" defaultValue={story.slug ?? ""} placeholder="يُنشأ من العنوان إن تُرك فارغًا" /></label>
            <label className="field"><span>نوع القصة</span><input name="story_type" defaultValue={story.story_type ?? ""} /></label>
            <label className="field"><span>الراوي</span><input name="narrator" defaultValue={story.narrator ?? ""} /></label>
            <label className="field"><span>السلسلة</span><input name="series_name" defaultValue={story.series_name ?? ""} /></label>
            <label className="field"><span>رقم الحلقة</span><input name="episode_number" type="number" defaultValue={story.episode_number ?? ""} /></label>
          </div>
        </fieldset>
        <fieldset className="group" id="media">
          <legend>الوسائط</legend>
          <MediaField name="cover_id" label="الغلاف" initialId={story.cover_id} library={library} />
          <label className="field" style={{ marginTop: "0.7rem" }}>
            <span>صور إضافية (معرّفات مفصولة بفاصلة)</span>
            <input name="extra_image_ids" defaultValue={extraImageIds} />
          </label>
          <div className="fields-2">
            <label className="field"><span>رابط صوت</span><input name="audio_url" defaultValue={story.audio_url ?? ""} /></label>
            <label className="field"><span>رابط فيديو</span><input name="video_url" defaultValue={story.video_url ?? ""} /></label>
          </div>
        </fieldset>
        <fieldset className="group" id="author">
          <legend>المؤلف</legend>
          <label className="field">
            <span>المؤلف</span>
            <select name="author_id" defaultValue={story.author_id ?? ""}>
              <option value="">بدون مؤلف</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>{author.name}</option>
              ))}
            </select>
          </label>
          <p><a className="text-link" href="/admin/authors/new">إضافة مؤلف</a></p>
        </fieldset>
        <fieldset className="group" id="category">
          <legend>التصنيف</legend>
          <label className="field">
            <span>التصنيف الأساسي</span>
            <select name="primary_category_id" defaultValue={primaryCategoryId}>
              <option value="">بدون تصنيف</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <CheckFilter items={categories.map((category) => ({ id: category.id, title: category.name }))} name="category_ids" selected={categoryIds} label="تصنيفات إضافية" />
        </fieldset>
        <fieldset className="group" id="tags">
          <legend>الوسوم</legend>
          <label className="field">
            <span>وسوم مفصولة بفاصلة</span>
            <input name="tags" defaultValue={tags} placeholder="ليل، مطر، بيت" />
          </label>
        </fieldset>
        <fieldset className="group" id="description">
          <legend>الوصف</legend>
          <label className="field"><span>وصف قصير</span><textarea name="short_description" defaultValue={story.short_description ?? ""} /></label>
          <label className="field" style={{ marginTop: "0.7rem" }}><span>الوصف الكامل</span><textarea name="full_description" defaultValue={story.full_description ?? ""} /></label>
        </fieldset>
        <fieldset className="group" id="discovery">
          <legend>الاكتشاف</legend>
          <div className="fields-2">
            <label className="field"><span>النوع الأدبي</span><input name="genre" defaultValue={story.genre ?? ""} /></label>
            <label className="field"><span>مدة القراءة بالدقائق</span><input name="reading_minutes" type="number" min={1} defaultValue={story.reading_minutes ?? ""} /></label>
            <label className="field"><span>العمر من</span><input name="age_min" type="number" min={0} defaultValue={story.age_min ?? ""} /></label>
            <label className="field"><span>العمر إلى</span><input name="age_max" type="number" min={0} defaultValue={story.age_max ?? ""} /></label>
            <label className="field"><span>أولوية الظهور</span><input name="priority" type="number" min={0} defaultValue={story.priority ?? 0} /></label>
          </div>
          <label><input type="checkbox" name="featured" defaultChecked={story.featured === 1} /> قصة مميزة</label>
          <label><input type="checkbox" name="editor_pick" defaultChecked={story.editor_pick === 1} /> من اختيارات يراع</label>
        </fieldset>
        <fieldset className="group" id="display">
          <legend>العرض</legend>
          <label className="field"><span>ترتيب العرض</span><input name="display_order" type="number" defaultValue={story.display_order ?? 0} /></label>
        </fieldset>
        <fieldset className="group" id="related">
          <legend>محتوى مرتبط</legend>
          <CheckFilter items={stories.filter((item) => item.id !== story.id)} name="related_ids" selected={relatedIds} label="قصص مرتبطة" />
        </fieldset>
        <fieldset className="group" id="publishing">
          <legend>النشر</legend>
          <label><input type="checkbox" name="published" defaultChecked={story.published === 1} /> منشورة</label>
          <label className="field"><span>موعد النشر</span><input type="datetime-local" name="publish_at" defaultValue={toLocalInput(story.publish_at)} /></label>
          <label className="field"><span>المصدر</span><input name="external_source" defaultValue={story.external_source ?? ""} /></label>
          <label className="field"><span>ملاحظات الإدارة — لا تظهر للزوار</span><textarea name="admin_notes" defaultValue={story.admin_notes ?? ""} /></label>
        </fieldset>
        <SubmitButton>حفظ القصة</SubmitButton>
      </div>
    </ActionForm>
  );
}
