import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Users, BookOpenText, CalendarDays, CreditCard, Heart, QrCode, TrendingUp, CheckCircle2, GraduationCap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin-shell";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Dashboard Admin — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Dashboard manajemen kajian dan santriwati BQS Salsabilla Ruang Muslimah." },
    { property: "og:title", content: "Dashboard Admin — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Dashboard manajemen kajian dan santriwati BQS Salsabilla Ruang Muslimah." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  return <AdminShell>
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Panel Manajemen</p><h1 className="page-title">Dashboard Admin <span className="text-rose">✦</span></h1><p className="mt-2 text-sm text-muted-foreground">Kelola kajian, santriwati, dan operasional BQS Salsabilla.</p></div><span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"><GraduationCap size={12} className="text-primary" /> Admin Panel</span></div>
    </div>

    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <Link to="/admin-siswa" className="group">
        <section className="overflow-hidden rounded-md border border-border bg-card shadow-soft transition-all hover:border-primary/50">
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-sage-light text-primary"><Users size={20} /></div>
            <h2 className="section-title">Manajemen Siswi</h2>
            <p className="mt-2 text-xs text-muted-foreground">Kelola data santriwati, pendaftaran, dan profil siswi.</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary group-hover:gap-3 transition-all">Kelola Sekarang <ArrowLeft size={12} className="rotate-180" /></div>
          </div>
        </section>
      </Link>

      <Link to="/admin-materi" className="group">
        <section className="overflow-hidden rounded-md border border-border bg-card shadow-soft transition-all hover:border-primary/50">
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-lavender-light text-lavender-foreground"><BookOpenText size={20} /></div>
            <h2 className="section-title">Manajemen Materi</h2>
            <p className="mt-2 text-xs text-muted-foreground">Tambah, edit, dan hapus materi kajian serta dokumentasi.</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary group-hover:gap-3 transition-all">Kelola Sekarang <ArrowLeft size={12} className="rotate-180" /></div>
          </div>
        </section>
      </Link>

      <Link to="/admin-jadwal" className="group">
        <section className="overflow-hidden rounded-md border border-border bg-card shadow-soft transition-all hover:border-primary/50">
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-rose-light text-rose-foreground"><CalendarDays size={20} /></div>
            <h2 className="section-title">Jadwal Kajian</h2>
            <p className="mt-2 text-xs text-muted-foreground">Atur jadwal kajian rutin dan kegiatan khusus.</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary group-hover:gap-3 transition-all">Kelola Sekarang <ArrowLeft size={12} className="rotate-180" /></div>
          </div>
        </section>
      </Link>

      <Link to="/admin-keuangan" className="group">
        <section className="overflow-hidden rounded-md border border-border bg-card shadow-soft transition-all hover:border-primary/50">
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-sage-light text-primary"><CreditCard size={20} /></div>
            <h2 className="section-title">Keuangan</h2>
            <p className="mt-2 text-xs text-muted-foreground">Pantau pembayaran SPP, infaq, dan keuangan kajian.</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary group-hover:gap-3 transition-all">Kelola Sekarang <ArrowLeft size={12} className="rotate-180" /></div>
          </div>
        </section>
      </Link>

      <Link to="/admin-infaq" className="group">
        <section className="overflow-hidden rounded-md border border-border bg-card shadow-soft transition-all hover:border-primary/50">
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-lavender-light text-lavender-foreground"><Heart size={20} /></div>
            <h2 className="section-title">Infaq & Sedekah</h2>
            <p className="mt-2 text-xs text-muted-foreground">Kelola data infaq, sedekah, dan laporan keuangan amal.</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary group-hover:gap-3 transition-all">Kelola Sekarang <ArrowLeft size={12} className="rotate-180" /></div>
          </div>
        </section>
      </Link>

      <Link to="/admin-absensi" className="group">
        <section className="overflow-hidden rounded-md border border-border bg-card shadow-soft transition-all hover:border-primary/50">
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-rose-light text-rose-foreground"><QrCode size={20} /></div>
            <h2 className="section-title">Absensi QR</h2>
            <p className="mt-2 text-xs text-muted-foreground">Generate QR untuk absen siswi dan guru manajemen.</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary group-hover:gap-3 transition-all">Mulai Absensi <ArrowLeft size={12} className="rotate-180" /></div>
          </div>
        </section>
      </Link>
    </div>

    <div className="mt-7 grid gap-6 sm:mt-9 sm:grid-cols-2">
      <section className="rounded-md border border-border bg-sage-light p-5 sm:p-7">
        <div className="mb-4 flex h-10 w-10 items-center justify-center text-primary"><TrendingUp size={20} /></div>
        <h2 className="font-display text-lg font-bold text-foreground sm:text-xl">Statistik Hari Ini</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Pantau aktivitas kajian dan kehadiran santriwati hari ini untuk evaluasi dan perbaikan.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Siswi</p>
            <p className="font-display text-2xl font-bold text-primary sm:text-3xl">128</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hadir Hari Ini</p>
            <p className="font-display text-2xl font-bold text-primary sm:text-3xl">112</p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5 shadow-soft sm:p-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="eyebrow">Status Kajian</p>
            <h2 className="section-title mt-1">Kajian Jumat Malam</h2>
          </div>
          <span className="text-primary"><CheckCircle2 size={20} /></span>
        </div>
        <div className="flex items-baseline gap-2">
          <strong className="font-display text-3xl font-bold text-primary sm:text-4xl">Aktif</strong>
          <span className="text-xs text-muted-foreground">Jumat, 19.00 WIB</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-[87%] rounded-full bg-primary" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">87% siswi sudah check-in untuk kajian hari ini</p>
      </section>
    </div>
  </AdminShell>;
}
