import { SectionBoard } from "@/components/admin/SectionBoard";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { createHomepageSection } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { SECTION_TYPES, sectionTypeLabel } from "@/lib/constants";
import { listHomeSections } from "@/lib/homepage";

export const metadata = { title: "إدارة الصفحة الرئيسية" };

export default async function HomepageAdminPage() {
  await requireAdmin();
  const sections = listHomeSections(true);
  return (
    <>
      <header className="page-head">
        <h1>إدارة الصفحة الرئيسية</h1>
        <p>رتّب الأقسام وأظهرها أو أخفها. اسحب القسم أو استخدم أعلى وأسفل. التصميم نفسه يبقى محميًا.</p>
      </header>
      <SectionBoard
        items={sections.map((section) => ({
          id: section.id,
          title: section.title,
          typeLabel: sectionTypeLabel(section.type),
          enabled: section.enabled,
        }))}
      />
      <div className="locked-note" style={{ margin: "1rem 0" }}>
        الترويسة والتذييل جزء من تنقل يراع، ولا يُحذفان. نص التذييل وبيانات التواصل من الإعدادات.
      </div>
      <ActionForm action={createHomepageSection} className="surface-card" >
        <fieldset className="group">
          <legend>إضافة قسم</legend>
          <div className="fields-2">
            <label className="field">
              <span>النوع</span>
              <select name="type">
                {SECTION_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </label>
            <label className="field"><span>العنوان</span><input name="title" placeholder="عنوان القسم" /></label>
          </div>
          <SubmitButton>إضافة قسم</SubmitButton>
        </fieldset>
      </ActionForm>
    </>
  );
}
