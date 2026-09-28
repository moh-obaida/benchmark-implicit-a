import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { MediaField } from "@/components/admin/MediaField";
import { saveAuthor } from "@/lib/actions/admin";

export function AuthorForm({
  author,
  library,
}: {
  author: {
    id?: string;
    name?: string;
    slug?: string;
    bio?: string | null;
    image_id?: string | null;
    featured?: number;
  };
  library: { id: string; alt: string | null }[];
}) {
  return (
    <ActionForm action={saveAuthor}>
      {author.id ? <input type="hidden" name="id" value={author.id} /> : null}
      <fieldset className="group">
        <legend>المؤلف</legend>
        <div className="fields-2">
          <label className="field"><span>الاسم</span><input name="name" required defaultValue={author.name ?? ""} /></label>
          <label className="field"><span>المسار</span><input name="slug" defaultValue={author.slug ?? ""} /></label>
        </div>
        <label className="field"><span>نبذة</span><textarea name="bio" defaultValue={author.bio ?? ""} /></label>
        <MediaField name="image_id" label="الصورة" initialId={author.image_id} library={library} />
        <label><input type="checkbox" name="featured" defaultChecked={author.featured === 1} /> مؤلف بارز</label>
      </fieldset>
      <SubmitButton>حفظ المؤلف</SubmitButton>
    </ActionForm>
  );
}
