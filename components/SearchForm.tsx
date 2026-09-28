"use client";

import { useEffect, useId, useRef, useState } from "react";

type Suggestion = { title: string; slug: string; author_name: string | null };

export function SearchForm({
  initial = "",
  large = false,
  action = "/search",
  placeholder = "ابحث عن قصة، مؤلف، أو تصنيف",
}: {
  initial?: string;
  large?: boolean;
  action?: string;
  placeholder?: string;
}) {
  const [q, setQ] = useState(initial);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQ(initial);
  }, [initial]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 1) {
      setItems([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!response.ok) return;
        const data = (await response.json()) as { items: Suggestion[] };
        setItems(data.items);
        setOpen(true);
        setActive(-1);
      } catch {
        return;
      }
    }, 220);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [q]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  return (
    <div className="search-box" ref={box}>
      <form action={action} method="get" role="search" className="search-row">
        <label className="sr-only" htmlFor={`${listId}-q`}>
          البحث
        </label>
        <input
          id={`${listId}-q`}
          name="q"
          value={q}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          onChange={(event) => setQ(event.target.value)}
          onFocus={() => items.length && setOpen(true)}
          onKeyDown={(event) => {
            if (!open || !items.length) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((value) => (value + 1) % items.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((value) => (value <= 0 ? items.length - 1 : value - 1));
            } else if (event.key === "Escape") {
              setOpen(false);
            } else if (event.key === "Enter" && active >= 0) {
              event.preventDefault();
              window.location.href = `/stories/${items[active].slug}`;
            }
          }}
        />
        {q && (
          <button
            className="btn-ghost"
            type="button"
            onClick={() => {
              setQ("");
              setOpen(false);
            }}
          >
            مسح
          </button>
        )}
        <button className={large ? "btn" : "btn-quiet"} type="submit">
          بحث
        </button>
      </form>
      {open && (
        <div className="suggest" id={listId} role="listbox">
          {items.length === 0 ? (
            <p>لا توجد اقتراحات بعد.</p>
          ) : (
            items.map((item, index) => (
              <a key={item.slug} href={`/stories/${item.slug}`} role="option" data-active={index === active} aria-selected={index === active}>
                {item.title}
                {item.author_name ? <span className="quiet"> — {item.author_name}</span> : null}
              </a>
            ))
          )}
          {q.trim() && <a href={`${action}?q=${encodeURIComponent(q.trim())}`}>عرض كل النتائج</a>}
        </div>
      )}
    </div>
  );
}
