import { requireAdmin } from "@/lib/auth";
import { listMedia } from "@/lib/media";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

export const metadata = { title: "الوسائط" };

export default async function MediaAdminPage() {
  await requireAdmin();
  const items = listMedia();
  return (
    <>
      <header className="page-head">
        <h1>الوسائط</h1>
        <p>ارفع أغلفة القصص وصور المؤلفين واللافتات. الملفات تُحفظ على الخادم، لا في المتصفح.</p>
      </header>
      <MediaLibrary
        items={items.map((item) => ({
          id: item.id,
          alt: item.alt,
          width: item.width,
          height: item.height,
        }))}
      />
    </>
  );
}
