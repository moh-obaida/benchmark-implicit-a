import { AGE_BUCKETS, SORTS } from "@/lib/constants";

export function Filters({
  action,
  values,
  options,
}: {
  action: string;
  values: Record<string, string>;
  options: {
    categories: { slug: string; name: string }[];
    genres: string[];
    types: string[];
    authors: { slug: string; name: string }[];
  };
}) {
  return (
    <form className="filters" action={action} method="get">
      {values.q ? <input type="hidden" name="q" value={values.q} /> : null}
      <label className="field">
        <span>التصنيف</span>
        <select name="category" defaultValue={values.category || ""}>
          <option value="">الكل</option>
          {options.categories.map((category) => (
            <option key={category.slug} value={category.slug}>{category.name}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>النوع الأدبي</span>
        <select name="genre" defaultValue={values.genre || ""}>
          <option value="">الكل</option>
          {options.genres.map((genre) => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>العمر</span>
        <select name="age" defaultValue={values.age || ""}>
          <option value="">الكل</option>
          {AGE_BUCKETS.map((bucket) => (
            <option key={bucket.id} value={bucket.id}>{bucket.label}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>نوع القصة</span>
        <select name="type" defaultValue={values.type || ""}>
          <option value="">الكل</option>
          {options.types.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>المؤلف</span>
        <select name="author" defaultValue={values.author || ""}>
          <option value="">الكل</option>
          {options.authors.map((author) => (
            <option key={author.slug} value={author.slug}>{author.name}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>الترتيب</span>
        <select name="sort" defaultValue={values.sort || "newest"}>
          {SORTS.map((sort) => (
            <option key={sort.id} value={sort.id}>{sort.label}</option>
          ))}
        </select>
      </label>
      <button className="btn" type="submit">تطبيق</button>
      <a className="btn-ghost" href={action}>مسح التصفية</a>
    </form>
  );
}
