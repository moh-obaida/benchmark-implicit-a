import { ICONS, PALETTE } from "@/lib/constants";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { MediaField } from "@/components/admin/MediaField";
import { CheckFilter } from "@/components/admin/Pickers";
import { saveCategory } from "@/lib/actions/admin";

export function CategoryForm({
  category,
  stories,
  selected,
  library,
}: {
  category: {
    id?: string;
    name?: string;
    slug?: string;
    description?: string | null;
    image_id?: string | null;
    icon?: string;
    color?: string;
    sort_order?: number;
    published?: number;
    show_on_home?: number;
    show_in_nav?: number;
    featured?: number;
  };
  stories: { id: string; title: string }[];
  selected: string[];
  library: { id: string; alt: string | null }[];
}) {
  return (
    <ActionForm action={saveCategory}>
      {category.id ? <input type="hidden" name="id" value={category.id} /> : null}
      <input type="hidden" name="sync_stories" value="on" />
      <fieldset className="group">
        <legend>التصنيف</legend>
        <div className="fields-2">
          <label className="field"><span>الاسم</span><input name="name" required defaultValue={category.name ?? ""} /></label>
          <label className="field"><span>المسار</span><input name="slug" defaultValue={category.slug ?? ""} /></label>
        </div>
        <label className="field"><span>الوصف</span><textarea name="description" defaultValue={category.description ?? ""} /></label>
        <label className="field"><span>الترتيب</span><input name="sort_order" type="number" defaultValue={category.sort_order ?? 0} /></label>
        <fieldset>
          <legend>اللون المعتمد</legend>
          <div className="swatches">
            {PALETTE.map((color) => (
              <label key={color.hex}>
                <input type="radio" name="color" value={color.hex} defaultChecked={(category.color ?? "#EEDCEE") === color.hex} />
                <span className="swatch" style={{ background: color.hex }} />
                {color.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="field">
          <span>الأيقونة</span>
          <select name="icon" defaultValue={category.icon ?? "quill"}>
            {ICONS.map((icon) => (
              <option key={icon.key} value={icon.key}>{icon.label}</option>
            ))}
          </select>
        </label>
        <MediaField name="image_id" label="صورة التصنيف" initialId={category.image_id} library={library} />
        <label><input type="checkbox" name="published" defaultChecked={category.published !== 0} /> ظاهر للزوار</label>
        <label><input type="checkbox" name="show_on_home" defaultChecked={category.show_on_home !== 0} /> في الصفحة الرئيسية</label>
        <label><input type="checkbox" name="show_in_nav" defaultChecked={category.show_in_nav === 1} /> في التنقل</label>
        <label><input type="checkbox" name="featured" defaultChecked={category.featured === 1} /> تصنيف بارز</label>
      </fieldset>
      <CheckFilter items={stories} name="story_ids" selected={selected} label="القصص داخل التصنيف" />
      <SubmitButton>حفظ التصنيف</SubmitButton>
    </ActionForm>
  );
}
