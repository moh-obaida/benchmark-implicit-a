"use client";

import { useEffect, useState, useTransition } from "react";
import { moveSection, reorderSections, toggleSection } from "@/lib/actions/admin";

type Item = { id: string; title: string; typeLabel: string; enabled: boolean };

export function SectionBoard({ items }: { items: Item[] }) {
  const [list, setList] = useState(items);
  const [dragId, setDragId] = useState<string | null>(null);
  const signature = items.map((item) => `${item.id}:${item.enabled}:${item.title}`).join("|");
  useEffect(() => {
    setList(items);
  }, [signature, items]);
  const [pending, startTransition] = useTransition();

  function commit(next: Item[]) {
    setList(next);
    startTransition(() => reorderSections(next.map((item) => item.id)));
  }

  return (
    <div>
      {list.map((item) => (
        <article
          key={item.id}
          className="section-admin"
          draggable
          onDragStart={() => setDragId(item.id)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            if (!dragId || dragId === item.id) return;
            const next = [...list];
            const from = next.findIndex((entry) => entry.id === dragId);
            const to = next.findIndex((entry) => entry.id === item.id);
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            setDragId(null);
            commit(next);
          }}
        >
          <div className="row-actions" style={{ justifyContent: "space-between" }}>
            <div>
              <strong>{item.title}</strong>
              <p className="quiet">{item.typeLabel} · {item.enabled ? "ظاهر" : "مخفي"}{pending ? " · جارٍ الترتيب" : ""}</p>
            </div>
            <div className="row-actions">
              <span className="btn-ghost" aria-hidden="true">اسحب</span>
              <form action={moveSection}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="dir" value="up" />
                <button className="btn-ghost" type="submit">أعلى</button>
              </form>
              <form action={moveSection}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="dir" value="down" />
                <button className="btn-ghost" type="submit">أسفل</button>
              </form>
              <form action={toggleSection}>
                <input type="hidden" name="id" value={item.id} />
                <button className="btn-quiet" type="submit">{item.enabled ? "إخفاء" : "إظهار"}</button>
              </form>
              <a className="btn" href={`/admin/homepage/${item.id}`}>تعديل</a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
