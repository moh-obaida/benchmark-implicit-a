"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/lib/actions/public";

export function FavoriteButton({
  storyId,
  saved,
  compact = false,
}: {
  storyId: string;
  saved: boolean;
  compact?: boolean;
}) {
  const [on, setOn] = useState(saved);
  const [pending, startTransition] = useTransition();
  const label = on ? "إزالة من المفضلة" : "حفظ القصة";

  return (
    <button
      type="button"
      className={compact ? "save-button" : on ? "btn-quiet" : "btn"}
      aria-pressed={on}
      aria-label={label}
      disabled={pending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        startTransition(async () => {
          const result = await toggleFavorite(storyId);
          if (result.ok) setOn(result.saved);
        });
      }}
    >
      {compact ? (on ? "محفوظة" : "حفظ") : label}
    </button>
  );
}
