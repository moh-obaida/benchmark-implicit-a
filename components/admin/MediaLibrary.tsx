"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MediaLibrary({
  items,
}: {
  items: { id: string; alt: string | null; width: number | null; height: number | null }[];
}) {
  const router = useRouter();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  function upload(file: File) {
    setError("");
    const data = new FormData();
    data.append("file", file);
    data.append("alt", file.name);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        router.refresh();
        return;
      }
      try {
        setError((JSON.parse(xhr.responseText) as { error?: string }).error || "تعذّر رفع الصورة.");
      } catch {
        setError("تعذّر رفع الصورة.");
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("تعذّر رفع الصورة.");
    };
    xhr.send(data);
  }

  async function remove(id: string) {
    if (!confirm("حذف هذه الصورة؟")) return;
    const response = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error || "تعذّر الحذف.");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <label className="field">
        <span>رفع صورة</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
          }}
        />
      </label>
      {progress != null ? (
        <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      <div className="media-grid" style={{ marginTop: "1rem" }}>
        {items.map((item) => (
          <article key={item.id}>
            <img src={`/media/${item.id}`} alt={item.alt || ""} />
            <div>
              <p className="quiet">{item.width && item.height ? `${item.width}×${item.height}` : item.id}</p>
              <button className="btn-danger" type="button" onClick={() => remove(item.id)}>حذف</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
