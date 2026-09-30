import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft, Users, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin-login")({
  head: () => ({ meta: [
    { title: "Login Admin — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Halaman login untuk admin BQS Salsabilla Ruang Muslimah." },
    { property: "og:title", content: "Login Admin — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Halaman login untuk admin BQS Salsabilla Ruang Muslimah." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck size={32} />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Login Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">Halaman login admin telah digabung ke halaman login utama</p>
        </div>

        <div className="rounded-md border border-border bg-card p-6 shadow-soft">
          <p className="text-sm text-muted-foreground mb-4">
            Silakan gunakan halaman login utama untuk masuk sebagai:
          </p>
          <ul className="text-left text-sm space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              Siswi Santriwati
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-foreground"></span>
              Guru Pengajar
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-foreground"></span>
              Guru Manajemen
            </li>
          </ul>
          <Link to="/login" className="block">
            <Button className="w-full h-11" size="default">
              Ke Halaman Login Utama
            </Button>
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft size={12} /> Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
