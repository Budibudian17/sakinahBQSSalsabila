import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, BookOpenText, Lock, Mail, Sparkles, GraduationCap, Users, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getSetupStatus } from "@/lib/auth.functions";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Masuk — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Masuk ke akun BQS Salsabilla Ruang Muslimah untuk mengakses dashboard kajian dan absensi." },
    { property: "og:title", content: "Masuk — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Masuk ke akun BQS Salsabilla Ruang Muslimah untuk mengakses dashboard kajian dan absensi." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<"siswi" | "guru" | "admin" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  // Check if setup is needed
  useEffect(() => {
    getSetupStatus().then((status) => {
      setNeedsSetup(status.needsSetup);
      if (status.needsSetup) {
        navigate({ to: "/setup" });
      }
    });
  }, [navigate]);

  const handleRoleSelect = (role: "siswi" | "guru" | "admin") => {
    setSelectedRole(role);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Check user role in user_roles table
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles' as any)
          .select('role')
          .eq('user_id' as any, data.user.id as any);

        if (rolesError) {
          setError('Gagal memuat role pengguna');
          setIsLoading(false);
          return;
        }

        const userRole = (roles as any)?.[0]?.role;

        if (!userRole) {
          setError('Role tidak ditemukan untuk pengguna ini');
          setIsLoading(false);
          return;
        }

        // Validasi role yang dipilih dengan role dari database
        if (selectedRole === "admin" && userRole !== "admin") {
          setError('Anda tidak memiliki akses sebagai admin');
          setIsLoading(false);
          return;
        }

        if (selectedRole === "siswi" && userRole !== "santri") {
          setError('Anda tidak memiliki akses sebagai santri');
          setIsLoading(false);
          return;
        }

        if (selectedRole === "guru" && userRole !== "guru") {
          setError('Anda tidak memiliki akses sebagai guru');
          setIsLoading(false);
          return;
        }

        // Redirect berdasarkan role dari database
        switch (userRole) {
          case "admin":
            navigate({ to: "/admin" });
            break;
          case "guru":
            navigate({ to: "/guru" });
            break;
          case "santri":
            navigate({ to: "/" });
            break;
          default:
            setError('Role tidak dikenali');
            setIsLoading(false);
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-2">
        {/* Left side - Login Form */}
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
              <p className="eyebrow">Selamat Datang</p>
              <h1 className="mt-2 font-display text-[1.75rem] font-bold leading-tight text-foreground sm:text-[2rem] sm:text-[2.25rem]">
                Masuk ke akunmu <span className="text-rose">✦</span>
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Lanjutkan perjalanan belajar ilmu agamamu bersama BQS Salsabilla Ruang Muslimah.
              </p>
            </div>

            {!selectedRole ? (
              /* Role Selection */
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground">Pilih role kamu:</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 justify-start gap-3"
                  onClick={() => handleRoleSelect("siswi")}
                >
                  <Users size={18} className="text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-bold">Siswi Santriwati</p>
                    <p className="text-[10px] text-muted-foreground">Untuk santriwati yang belajar</p>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 justify-start gap-3"
                  onClick={() => handleRoleSelect("guru")}
                >
                  <GraduationCap size={18} className="text-rose-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-bold">Guru Pengajar</p>
                    <p className="text-[10px] text-muted-foreground">Untuk guru biasa mengajar</p>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 justify-start gap-3"
                  onClick={() => handleRoleSelect("admin")}
                >
                  <ShieldCheck size={18} className="text-amber-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-bold">Guru Manajemen</p>
                    <p className="text-[10px] text-muted-foreground">Untuk admin panel</p>
                  </div>
                </Button>
              </div>
            ) : (
              /* Login Form */
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {error && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold">Kata Sandi</Label>
                    <a href="#" className="text-xs font-semibold text-primary hover:opacity-70">
                      Lupa kata sandi?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-10 sm:h-11"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-10 sm:h-11" disabled={isLoading}>
                  {isLoading ? "Memproses..." : "Masuk Sekarang"} <ArrowRight size={16} className="ml-2" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-10 text-xs"
                  onClick={() => setSelectedRole(null)}
                >
                  ← Kembali ke pilihan role
                </Button>
              </form>
            )}


          </div>
        </div>

        {/* Right side - Decorative */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:px-12 lg:py-12 xl:px-16">
          <div className="relative overflow-hidden rounded-2xl bg-banner p-8 sm:p-10 xl:p-12">
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-card/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                <BookOpenText size={14} /> Belajar Bersama
              </div>
              <h2 className="font-display text-[2rem] font-bold leading-tight text-foreground sm:text-[2.5rem] xl:text-[2.75rem]">
                Tumbuh dalam ilmu, berkah dalam setiap langkah
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-foreground/80 sm:text-base">
                Bergabunglah dengan komunitas muslimah yang semangat menuntut ilmu agama. Jadwal kajian, hafalan, dan kehadiran dalam satu platform yang mudah.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-card text-primary">
                    <BookOpenText size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Kajian Rutin</p>
                    <p className="text-[10px] text-muted-foreground">Setiap minggu</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-card text-rose">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Hafalan Surah</p>
                    <p className="text-[10px] text-muted-foreground">Tracking progres</p>
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
