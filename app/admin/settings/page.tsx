import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { MediaField } from "@/components/admin/MediaField";
import { saveSiteSettings } from "@/lib/actions/admin";
import { formOptions } from "@/lib/admin-options";
import { requireAdmin } from "@/lib/auth";
import { BRAND_COLOR, FONT_FAMILY, PALETTE } from "@/lib/constants";
import { queryOne } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "الإعدادات" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await requireAdmin();
  const settings = getSettings();
  const admin = queryOne<{ name: string; email: string }>("SELECT name, email FROM users WHERE id = ?", session.sub);
  const library = formOptions().library;
  const links = [...settings.socialLinks, { label: "", url: "" }, { label: "", url: "" }, { label: "", url: "" }, { label: "", url: "" }].slice(0, 4);
  return (
    <>
      <header className="page-head"><h1>الإعدادات</h1></header>
      {(await searchParams).saved === "1" ? <p className="saved-note">تم الحفظ.</p> : null}
      <ActionForm action={saveSiteSettings}>
        <fieldset className="group">
          <legend>عام</legend>
          <label className="field"><span>اسم الموقع</span><input name="site_name" defaultValue={settings.siteName} /></label>
          <label className="field"><span>الوصف</span><textarea name="site_description" defaultValue={settings.siteDescription} /></label>
          <label className="field"><span>البريد</span><input name="contact_email" defaultValue={settings.contactEmail} /></label>
          <label className="field"><span>ملاحظة التواصل</span><input name="contact_note" defaultValue={settings.contactNote} /></label>
          <MediaField name="logo_id" label="الشعار" initialId={settings.logoId} library={library} />
        </fieldset>
        <fieldset className="group">
          <legend>الهوية — مقفلة</legend>
          <div className="locked-note">
            <p>اللون الأساسي ثابت: {BRAND_COLOR}</p>
            <p>الخط ثابت: {FONT_FAMILY}</p>
            <div className="swatches" style={{ marginTop: "0.6rem" }}>
              {PALETTE.map((color) => (
                <span key={color.hex}><span className="swatch" style={{ background: color.hex }} /> {color.label}</span>
              ))}
            </div>
          </div>
        </fieldset>
        <fieldset className="group">
          <legend>المحتوى</legend>
          <label className="field"><span>عدد القصص في الاستكشاف</span><input name="default_item_count" type="number" min={4} max={24} defaultValue={settings.defaultItemCount} /></label>
          <label className="field">
            <span>كثافة الصفحة</span>
            <select name="density" defaultValue={settings.density}>
              <option value="comfortable">مريحة</option>
              <option value="compact">أقرب</option>
            </select>
          </label>
        </fieldset>
        <fieldset className="group">
          <legend>الاكتشاف</legend>
          <div className="fields-2">
            <Weight name="view_weight" label="وزن المشاهدات" value={settings.viewWeight} />
            <Weight name="favorite_weight" label="وزن الحفظ" value={settings.favoriteWeight} />
            <Weight name="priority_weight" label="وزن الأولوية" value={settings.priorityWeight} />
            <Weight name="rec_w_category" label="التصنيف" value={settings.weights.category} />
            <Weight name="rec_w_tag" label="الوسوم" value={settings.weights.tag} />
            <Weight name="rec_w_author" label="المؤلف" value={settings.weights.author} />
            <Weight name="rec_w_genre" label="النوع الأدبي" value={settings.weights.genre} />
            <Weight name="rec_w_age" label="العمر" value={settings.weights.age} />
            <Weight name="rec_w_popularity" label="الرواج" value={settings.weights.popularity} />
            <Weight name="rec_w_recency" label="الحداثة" value={settings.weights.recency} />
            <Weight name="rec_w_featured" label="التمييز" value={settings.weights.featured} />
            <Weight name="rec_w_priority" label="أولوية التحرير" value={settings.weights.priority} />
            <label className="field"><span>نافذة وصل حديثًا بالأيام</span><input name="recent_days" type="number" min={7} max={180} defaultValue={settings.recentDays} /></label>
          </div>
        </fieldset>
        <fieldset className="group">
          <legend>تحسين الظهور</legend>
          <label className="field"><span>عنوان الصفحة</span><input name="seo_title" defaultValue={settings.seoTitle} /></label>
          <label className="field"><span>الوصف</span><textarea name="seo_description" defaultValue={settings.seoDescription} /></label>
          <MediaField name="social_image_id" label="صورة المشاركة" initialId={settings.socialImageId} library={library} />
        </fieldset>
        <fieldset className="group">
          <legend>التواصل</legend>
          <label className="field"><span>إنستغرام</span><input name="instagram" defaultValue={settings.instagram} placeholder="https://" /></label>
          {links.map((link, index) => (
            <div className="fields-2" key={index}>
              <label className="field"><span>اسم الرابط</span><input name={`social_label_${index}`} defaultValue={link.label} /></label>
              <label className="field"><span>الرابط</span><input name={`social_url_${index}`} defaultValue={link.url} /></label>
            </div>
          ))}
        </fieldset>
        <fieldset className="group">
          <legend>حساب الإدارة</legend>
          <label className="field"><span>الاسم</span><input name="admin_name" defaultValue={admin?.name ?? ""} /></label>
          <p className="quiet">{admin?.email}</p>
          <div className="fields-2">
            <label className="field"><span>كلمة المرور الحالية</span><input name="current_password" type="password" autoComplete="current-password" /></label>
            <label className="field"><span>كلمة مرور جديدة</span><input name="new_password" type="password" autoComplete="new-password" /></label>
          </div>
        </fieldset>
        <SubmitButton>حفظ الإعدادات</SubmitButton>
      </ActionForm>
    </>
  );
}

function Weight({ name, label, value }: { name: string; label: string; value: number }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} type="number" min={0} max={20} defaultValue={value} />
    </label>
  );
}
