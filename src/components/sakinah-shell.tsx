import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  Bell, BookOpenText, CalendarDays, ChevronDown, CircleHelp, CreditCard,
  LayoutDashboard, LogOut, Menu, QrCode, Settings, UserRound, X, Wifi, WifiOff, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import avatar from "@/assets/santri-avatar.jpg";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useClickOutside } from "@/hooks/use-click-outside";
import { supabase } from "@/integrations/supabase/client";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" as const },
  { label: "Jadwal Kajian", icon: CalendarDays, to: "/jadwal" as const },
  { label: "Materi Kajian", icon: FileText, to: "/materi" as const },
  { label: "Nilai & Hafalan", icon: BookOpenText, to: "/nilai" as const },
  { label: "Keuangan", icon: CreditCard, to: "/keuangan" as const },
  { label: "Absen QR", icon: QrCode, to: "/absensi" as const },
];

const supportNavigation = [
  { label: "Pusat Bantuan", icon: CircleHelp, to: "/help" as const },
];

export function SalsabillaShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const router = useRouter();
  const { isOnline, showOfflineAlert, dismissOfflineAlert } = useOnlineStatus();
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useClickOutside(notificationsRef, () => setNotificationsOpen(false), notificationsOpen);
  useClickOutside(profileDropdownRef, () => setProfileDropdownOpen(false), profileDropdownOpen);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setProfileDropdownOpen(false);
      router.navigate({ to: '/login' });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles' as any)
            .select('*')
            .eq('id' as any, user.id as any)
            .single();
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {menuOpen && <div className="fixed inset-0 z-40 bg-overlay lg:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border bg-sidebar transition-transform duration-300 lg:w-[252px] lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex h-[80px] items-center justify-between px-6 lg:h-[92px] lg:px-7">
          <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3" aria-label="BQS Salsabilla Beranda">
            <img src="/logopengajianbaru.webp" alt="BQS Salsabilla Logo" className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16" />
            <span className="flex flex-col leading-none"><span className="font-display text-[24px] font-bold tracking-normal text-primary lg:text-[27px]">sakinah<span className="text-rose">.</span></span><span className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Ruang Muslimah</span></span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Tutup menu"><X /></Button>
        </div>
        <div className="mx-6 mb-8 border-t border-border" />
        <nav className="flex-1 px-3" aria-label="Navigasi utama">
          <p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Menu Utama</p>
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to;
              const common = `group flex h-11 w-full items-center gap-3 rounded-md px-4 text-left text-[13px] font-semibold transition-colors ${active ? "bg-nav-active text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`;
              return (
                <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)} className={common} aria-current={active ? "page" : undefined}>
                  <Icon size={18} strokeWidth={1.8} className="shrink-0" /> {item.label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                </Link>
              );
            })}
          </div>

          <div className="mx-6 my-6 border-t border-border" />
          
          <p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Dukungan</p>
          <div className="space-y-1">
            {supportNavigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to;
              const common = `group flex h-11 w-full items-center gap-3 rounded-md px-4 text-left text-[13px] font-semibold transition-colors ${active ? "bg-nav-active text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`;
              return (
                <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)} className={common} aria-current={active ? "page" : undefined}>
                  <Icon size={18} strokeWidth={1.8} className="shrink-0" /> {item.label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                </Link>
              );
            })}
          </div>

        </nav>
        <div className="mx-6 border-t border-border" />
        <div className="px-3 py-5">
          <p className="px-4 text-[10px] text-muted-foreground/70">© 2026 BQS Salsabilla · </p>
        </div>
      </aside>

      <div className="lg:ml-[252px]">
        {showOfflineAlert && (
          <div className="sticky top-0 z-50 mx-auto max-w-[1510px] bg-amber-50 border-b border-amber-200 px-4 py-3 sm:px-8 lg:px-10 xl:px-12">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <WifiOff size={16} className="text-amber-600" />
                <p className="text-xs font-semibold text-amber-800 sm:text-sm">
                  Kamu sedang offline. Beberapa fitur mungkin terbatas.
                </p>
              </div>
              <button
                onClick={dismissOfflineAlert}
                className="text-amber-600 hover:text-amber-800"
                aria-label="Tutup notifikasi"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md sm:h-[76px] sm:px-8 lg:px-10 xl:px-12">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="outline" size="icon" className="shrink-0 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Buka menu"><Menu /></Button>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-foreground sm:text-[13px]">Assalamu'alaikum, {userProfile?.full_name || 'Santri'} <span className="inline-block">✦</span></p>
              <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-[11px]">Semoga harimu penuh berkah</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3 sm:gap-5">
            <div className="relative" ref={notificationsRef}>
              <Button 
                variant="outline" 
                size="icon" 
                aria-label="Notifikasi" 
                aria-expanded={notificationsOpen} 
                onClick={() => setNotificationsOpen(!notificationsOpen)} 
                className="relative rounded-full border-border bg-card h-9 w-9 sm:h-10 sm:w-10"
              >
                <Bell size={16} className="sm:size-18" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose ring-2 ring-card" />
              </Button>
              {notificationsOpen && <div className="absolute right-0 top-12 z-50 w-[min(82vw,300px)] rounded-md border border-border bg-card p-4 shadow-panel"><p className="text-sm font-bold">Pengingat kajian</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Kajian Tafsir Al-Qur'an dimulai Jumat pukul 19.00 di Ruang Aisyah.</p></div>}
            </div>
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className={`rounded-full border-border bg-card h-9 w-9 sm:h-10 sm:w-10 ${isOnline ? 'text-green-600' : 'text-amber-600'}`}
                aria-label={isOnline ? "Online" : "Offline"}
                title={isOnline ? "Online" : "Offline"}
              >
                {isOnline ? <Wifi size={16} className="sm:size-18" /> : <WifiOff size={16} className="sm:size-18" />}
              </Button>
            </div>
            <div className="hidden h-8 w-px bg-border sm:block" />
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 sm:gap-2.5 rounded-md p-1 hover:bg-secondary transition-colors"
                aria-label="Menu profil"
                aria-expanded={profileDropdownOpen}
              >
                <img src={userProfile?.avatar_url || avatar} alt={`Foto profil ${userProfile?.full_name || 'Santri'}`} width={816} height={816} className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-secondary sm:h-9 sm:w-9" />
                <div className="hidden min-w-0 sm:block"><p className="text-xs font-bold">{userProfile?.full_name || 'Santri'}</p><p className="mt-0.5 text-[10px] text-muted-foreground">NIS {userProfile?.rt || '20240087'}</p></div>
                <ChevronDown size={14} className="text-muted-foreground sm:block" />
              </button>
              {profileDropdownOpen && (
                <div className="absolute right-0 top-12 z-50 w-[min(82vw,240px)] rounded-md border border-border bg-card p-2 shadow-panel">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-10 px-3 text-xs font-semibold text-foreground hover:text-primary"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <UserRound size={16} /> Profil Santri
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-10 px-3 text-xs font-semibold text-foreground hover:text-primary"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Settings size={16} /> Pengaturan
                  </Button>
                  <div className="my-1 border-t border-border" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-10 px-3 text-xs font-semibold text-foreground hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} /> Log Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1510px] overflow-x-hidden px-4 pb-16 pt-6 sm:px-5 sm:pt-8 lg:px-10 lg:pt-10 xl:px-12">{children}</main>
      </div>
    </div>
  );
}
