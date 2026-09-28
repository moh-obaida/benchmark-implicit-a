export function Pagination({
  page,
  pages,
  makeHref,
}: {
  page: number;
  pages: number;
  makeHref: (page: number) => string;
}) {
  if (pages <= 1) return null;
  return (
    <nav className="pager" aria-label="الصفحات">
      {page > 1 ? <a className="btn-ghost" href={makeHref(page - 1)}>السابق</a> : null}
      <span>
        {page} / {pages}
      </span>
      {page < pages ? <a className="btn-ghost" href={makeHref(page + 1)}>التالي</a> : null}
    </nav>
  );
}
