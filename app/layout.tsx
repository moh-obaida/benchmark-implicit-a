import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import { getSettings } from "@/lib/settings";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings();
  const image = settings.socialImageId ? `/media/${settings.socialImageId}` : undefined;
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: { default: settings.seoTitle, template: `%s — ${settings.siteName}` },
    description: settings.seoDescription,
    openGraph: {
      title: settings.seoTitle,
      description: settings.seoDescription,
      locale: "ar",
      images: image ? [image] : undefined,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = getSettings();
  return (
    <html lang="ar" dir="rtl" data-density={settings.density} className={tajawal.variable}>
      <body className={tajawal.className}>{children}</body>
    </html>
  );
}
