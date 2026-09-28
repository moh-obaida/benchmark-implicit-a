"use client";

import { useEffect } from "react";
import { recordView } from "@/lib/actions/public";

export function ViewBeacon({ id }: { id: string }) {
  useEffect(() => {
    const key = `yaraa-view:${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void recordView(id);
  }, [id]);
  return null;
}
