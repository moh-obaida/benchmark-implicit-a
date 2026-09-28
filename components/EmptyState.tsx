export function EmptyState({
  title,
  text,
  href,
  action,
}: {
  title: string;
  text?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      {text ? <p>{text}</p> : null}
      {href && action ? (
        <p style={{ marginTop: "0.9rem" }}>
          <a className="btn" href={href}>
            {action}
          </a>
        </p>
      ) : null}
    </div>
  );
}
