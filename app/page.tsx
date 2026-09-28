import { cookies } from "next/headers";
import { HomeSections } from "@/components/HomeSections";
import { PublicShell } from "@/components/PublicShell";
import { getSession } from "@/lib/auth";
import { resolveHomepage } from "@/lib/homepage";
import { favoriteIds } from "@/lib/stories";

export default async function HomePage() {
  const session = await getSession();
  const seen = (await cookies()).get("yaraa_seen")?.value?.split(",").filter(Boolean) ?? [];
  const sections = resolveHomepage({ userId: session?.sub, seenIds: seen });
  const saved = favoriteIds(session?.sub ?? null);
  return (
    <PublicShell>
      <HomeSections sections={sections} saved={saved} />
    </PublicShell>
  );
}
