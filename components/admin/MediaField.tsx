"use client";

import { useState } from "react";

type MediaItem = { id: string; alt: string | null };

export function MediaField({
  name,
  label,
  initialId,
  library,
}: {
  name: string;
  label: string;
  initialId?: string | null;
  library: MediaItem[];
}) {
  const [id, setId] = useState(initialId ?? "");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  function upload(file: File) {
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("الملف ليس صورة من الأنواع المسموحة.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة أكبر من ٥ ميغابايت.");
      return;
    }
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
        const body = JSON.parse(xhr.responseText) as { id: string };
        setId(body.id);
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

  return (
    <div className="field">
      <span>{label}</span>
      <input type="hidden" name={name} value={id} />
      {id ? <img src={`/media/${id}`} alt="" style={{ width: 120, height: 160, objectFit: "cover", borderRadius: 12 }} /> : null}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
        }}
      />
      {progress != null ? (
        <div className="progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} role="progressbar">
          <span style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      <label className="field">
        <span>أو اختر من المكتبة</span>
        <select value={id} onChange={(event) => setId(event.target.value)}>
          <option value="">بدون صورة</option>
          {library.map((item) => (
            <option key={item.id} value={item.id}>
              {item.alt || item.id}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
