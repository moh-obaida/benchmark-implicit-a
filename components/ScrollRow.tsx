"use client";

import { useRef } from "react";

export function ScrollRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  function move(direction: number) {
    ref.current?.scrollBy({ left: direction * 240, behavior: "smooth" });
  }
  return (
    <div className="scroll-row">
      <button type="button" className="icon-btn" aria-label="السابق" onClick={() => move(1)}>
        ‹
      </button>
      <div className="scroll-track" ref={ref}>
        {children}
      </div>
      <button type="button" className="icon-btn" aria-label="التالي" onClick={() => move(-1)}>
        ›
      </button>
    </div>
  );
}
