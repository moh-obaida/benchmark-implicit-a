"use client";

import { useState } from "react";

type Item = { id: string; title: string };

export function CheckFilter({
  items,
  name,
  selected,
  label,
}: {
  items: Item[];
  name: string;
  selected: string[];
  label: string;
}) {
  const [q, setQ] = useState("");
  const picked = new Set(selected);
  return (
    <div className="field">
      <span>{label}</span>
      <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="تصفية العناوين" />
      <div className="check-list">
        {items.map((item) => (
          <label key={item.id} className={item.title.includes(q.trim()) ? "" : "hidden"}>
            <input type="checkbox" name={name} value={item.id} defaultChecked={picked.has(item.id)} />
            <span>{item.title}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function ManualOrder({ stories, selected }: { stories: Item[]; selected: string[] }) {
  const [order, setOrder] = useState(selected);
  const [q, setQ] = useState("");
  const titles = new Map(stories.map((story) => [story.id, story.title]));

  function move(id: string, direction: number) {
    const index = order.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= order.length) return;
    const next = [...order];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setOrder(next);
  }

  return (
    <div className="field">
      <span>القصص المختارة بالترتيب</span>
      <input type="hidden" name="manual_ids" value={order.join(",")} />
      <ol className="check-list">
        {order.map((id) => (
          <li key={id} style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginBottom: "0.35rem" }}>
            <span style={{ flex: 1 }}>{titles.get(id) || id}</span>
            <button className="btn-ghost" type="button" onClick={() => move(id, -1)}>أعلى</button>
            <button className="btn-ghost" type="button" onClick={() => move(id, 1)}>أسفل</button>
            <button className="btn-ghost" type="button" onClick={() => setOrder(order.filter((item) => item !== id))}>إزالة</button>
          </li>
        ))}
      </ol>
      <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="أضف قصة" />
      <div className="row-actions" style={{ marginTop: "0.4rem" }}>
        {stories
          .filter((story) => story.title.includes(q.trim()) && !order.includes(story.id))
          .slice(0, 8)
          .map((story) => (
            <button key={story.id} className="btn-ghost" type="button" onClick={() => setOrder([...order, story.id])}>
              {story.title}
            </button>
          ))}
      </div>
    </div>
  );
}
