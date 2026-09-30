import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Construction } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";

export const Route = createFileRoute("/admin-inspeksi")({
  head: () => ({ meta: [
    { title: "Inspeksi — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Laporan inspeksi dan monitoring BQS Salsabilla Ruang Muslimah." },
    { property: "og:title", content: "Inspeksi — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Laporan inspeksi dan monitoring BQS Salsabilla Ruang Muslimah." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdminInspeksiPage,
});

function AdminInspeksiPage() {
  return <AdminShell>
    <div className="mb-6 sm:mb-8">
      <Link to="/admin" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:mb-5"><ArrowLeft size={12} /> Kembali ke dashboard</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Inspeksi & Monitoring</p>
          <h1 className="page-title">Laporan Inspeksi <span className="text-rose">✦</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Kelola laporan inspeksi dan monitoring kegiatan.</p>
        </div>
      </div>
    </div>

    <div className="grid gap-6">
      <section className="overflow-hidden rounded-md border border-border bg-card shadow-soft">
        <div className="border-b border-border px-4 py-4 sm:px-7 sm:py-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-primary sm:size-15" />
            <h2 className="section-title">Fitur Inspeksi</h2>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">Sistem laporan inspeksi dan monitoring.</p>
        </div>
        <div className="p-4 sm:p-7">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Construction size={40} className="text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Fitur dalam Pengembangan</h3>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">
              Fitur inspeksi dan monitoring sedang dalam tahap pengembangan. Fitur ini akan segera tersedia untuk memantau dan melaporkan kegiatan santriwati.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-secondary/30 p-4">
                <h4 className="mb-2 text-sm font-semibold">📋 Laporan Harian</h4>
                <p className="text-xs text-muted-foreground">Pantau aktivitas santriwati secara real-time</p>
              </div>
              <div className="rounded-md border border-border bg-secondary/30 p-4">
                <h4 className="mb-2 text-sm font-semibold">🔍 Monitoring Kehadiran</h4>
                <p className="text-xs text-muted-foreground">Tracking kehadiran dan keterlambatan</p>
              </div>
              <div className="rounded-md border border-border bg-secondary/30 p-4">
                <h4 className="mb-2 text-sm font-semibold">📊 Statistik Performa</h4>
                <p className="text-xs text-muted-foreground">Analisis performa dan perkembangan</p>
              </div>
              <div className="rounded-md border border-border bg-secondary/30 p-4">
                <h4 className="mb-2 text-sm font-semibold">⚠️ Alert System</h4>
                <p className="text-xs text-muted-foreground">Notifikasi untuk keperluan inspeksi</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AdminShell>;
}