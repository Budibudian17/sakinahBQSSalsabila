import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { SalsabillaShell } from "@/components/sakinah-shell";

export const Route = createFileRoute("/infaq")({
  head: () => ({ meta: [
    { title: "Infaq — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Kelola infaq dan sedekah santriwati BQS Salsabilla Ruang Muslimah." },
    { property: "og:title", content: "Infaq — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Kelola infaq dan sedekah santriwati BQS Salsabilla Ruang Muslimah." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: InfaqPage,
});

function InfaqPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to keuangan page since infaq is now part of keuangan
    router.navigate({ to: '/keuangan' });
  }, [router]);

  return <SalsabillaShell>
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  </SalsabillaShell>;
}
