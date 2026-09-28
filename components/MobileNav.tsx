"use client";

import { useEffect, useState } from "react";

export function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <>
      <button className="btn-ghost menu-button" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        القائمة
      </button>
      <div className="mobile-panel" data-open={open}>
        <div onClick={() => setOpen(false)}>{children}</div>
      </div>
    </>
  );
}
