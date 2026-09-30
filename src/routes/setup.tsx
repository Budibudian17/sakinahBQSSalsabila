import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, ShieldCheck, Mail, Lock, User, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSetupStatus, setupFirstAdmin } from "@/lib/auth.functions";

export const Route = createFileRoute("/setup")({
  head: () => ({ meta: [
    { title: "Setup Admin — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Setup admin pertama untuk BQS Salsabilla Ruang Muslimah." },
    { property: "og:title", content: "Setup Admin — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Setup admin pertama untuk BQS Salsabilla Ruang Muslimah." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  // Check if setup is needed
  useEffect(() => {
    getSetupStatus().then((status) => {
      setNeedsSetup(status.needsSetup);
      if (!status.needsSetup) {
        navigate({ to: "/login" });
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Kata sandi tidak cocok");
      return;
    }

    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter");
      return;
    }

    setIsLoading(true);

    try {
      await setupFirstAdmin({ fullName, email, password } as any);
      setSuccess(true);
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat admin");
    } finally {
      setIsLoading(false);
    }
  };

  if (needsSetup === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Memeriksa status setup...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Setup Berhasil!</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Akun admin telah berhasil dibuat. Anda akan diarahkan ke halaman login.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-2">
        {/* Left side - Setup Form */}
        <div className="flex flex-col justify-center px-4 py-10 sm:px-8 sm:py-12 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-[420px]">
            {/* Logo */}
            <Link to="/" className="mb-6 flex items-center gap-3 sm:mb-8" aria-label="BQS Salsabilla Beranda">
              <img src="/logopengajianbaru.webp" alt="BQS Salsabilla Logo" className="h-14 w-14 sm:h-16 sm:w-16" />
              <span className="flex flex-col leading-none">
                <span className="font-display text-[24px] font-bold tracking-normal text-primary sm:text-[27px]">sakinah<span className="text-rose">.</span></span>
                <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Ruang Muslimah</span>
              </span>
            </Link>

            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
                <ShieldCheck size={12} />
                Setup Awal
              </div>
              <h1 className="mt-2 font-display text-[1.75rem] font-bold leading-tight text-foreground sm:text-[2rem] sm:text-[2.25rem]">
                Buat Admin Pertama <span className="text-rose">✦</span>
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Setup akun admin pertama untuk mengelola sistem BQS Salsabilla Ruang Muslimah.
              </p>
            </div>

            {/* Setup Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-semibold">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Contoh: Aisyah Rahman"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-10 sm:h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@sakinah.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 sm:h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold">Kata Sandi</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10 sm:h-11"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold">Konfirmasi Kata Sandi</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Ulangi kata sandi"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-10 sm:h-11"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-10 sm:h-11" disabled={isLoading}>
                {isLoading ? "Memproses..." : "Buat Admin"} <ArrowRight size={16} className="ml-2" />
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                >
                  Sudah punya akun? Masuk
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Right side - Decorative */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:px-12 lg:py-12 xl:px-16">
          <div className="relative overflow-hidden rounded-2xl bg-banner p-8 sm:p-10 xl:p-12">
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-card/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                <ShieldCheck size={14} /> Administrator
              </div>
              <h2 className="font-display text-[2rem] font-bold leading-tight text-foreground sm:text-[2.5rem] xl:text-[2.75rem]">
                Kelola sistem dengan mudah
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-foreground/80 sm:text-base">
                Sebagai admin, Anda dapat mengelola jadwal kajian, data santri, absensi, nilai, dan keuangan dalam satu platform terintegrasi.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-card text-primary">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Full Control</p>
                    <p className="text-[10px] text-muted-foreground">Akses penuh sistem</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-card text-rose">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">User Management</p>
                    <p className="text-[10px] text-muted-foreground">Kelola santri & guru</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10" />
            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-rose/10" />
          </div>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            © 2026 BQS Salsabilla Ruang Muslimah · 
          </p>
        </div>
      </div>
    </div>
  );
}
