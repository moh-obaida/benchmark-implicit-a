export function Mark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
      <rect width="36" height="36" rx="8" fill="#EEDCEE" />
      <path d="M19 7c.2 5.2.2 9.2-1.2 14.2-.7 2.4-1.8 4.2-1.6 6.3h4.2c.1-2.2-.6-4-1.2-6.4C17.6 16 17.2 12 17.4 7H19z" fill="#2C2826" />
      <path d="M13.5 29.5h9" stroke="#2C2826" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const paths: Record<string, string> = {
  quill: "M12 3c.2 4 .1 7-1 11-.6 2-1.4 3.4-1.2 5h3.2c.2-1.6-.4-3-.9-5C11 10 10.8 6.5 11 3h1zM8 20.5h8",
  book: "M5 5.5h6.2A2.8 2.8 0 0 1 14 8.3V19H7.2A2.2 2.2 0 0 0 5 21.2V5.5zM19 5.5h-6.2A2.8 2.8 0 0 0 10 8.3V19h6.8A2.2 2.2 0 0 1 19 21.2V5.5z",
  moon: "M14.5 4.5A7 7 0 1 1 8 16.2 5.6 5.6 0 1 0 14.5 4.5z",
  leaf: "M5 14c6-1 9-4 12-9-1 7-4 11-10 12 4 0 7 1 9 3-6-1-10-3-11-6z",
  compass: "M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zm2.2 4.2-1.2 3.2-3.2 1.2 1.2-3.2 3.2-1.2z",
  home: "M4 11.5 12 5l8 6.5V20H4v-8.5zM10 20v-5h4v5",
  spark: "M12 3.5 13.4 9 19 10.5 13.4 12 12 17.5 10.6 12 5 10.5 10.6 9 12 3.5z",
  family: "M8 10a2.2 2.2 0 1 0 0-4.4A2.2 2.2 0 0 0 8 10zm8 1a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM4.5 18.5c.4-2.4 2-3.6 3.6-3.6S11.2 16 11.6 18.5M12 18.5c.3-2 1.6-3.2 3.2-3.2 1.5 0 2.8 1.1 3.2 3.2",
  star: "M12 4.2 13.8 9l5 .4-3.9 3.1 1.2 4.8L12 14.8 7.9 17.3 9.1 12.5 5.2 9.4l5-.4L12 4.2z",
};

export function CategoryIcon({ name }: { name: string }) {
  const d = paths[name] ?? paths.quill;
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2C2826" strokeWidth="1.6" aria-hidden="true">
      <path d={d} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
