import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, BookOpenText, CalendarDays, Clock3, CreditCard, GraduationCap, MapPin, QrCode, UsersRound, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BQS SalsabillaShell } from "@/components/sakinah-shell";
import { WeeklyCalendar } from "@/components/weekly-calendar";
import { EmptyState } from "@/components/empty-state";
import { supabase } from "@/integrations/supabase/client";
import banner from "/coverphoto.webp";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Dashboard — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Dashboard kajian remaja muslimah BQS Salsabilla: jadwal, hafalan, kehadiran, dan informasi infaq dalam satu tempat." },
    { property: "og:title", content: "Dashboard — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Dashboard kajian remaja muslimah BQS Salsabilla: jadwal, hafalan, kehadiran, dan informasi infaq dalam satu tempat." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: DashboardPage,
});

type ScheduleItem = {
  subject: string;
  category: string;
  teacher: string;
  day: string;
  room: string;
  iconClass: string;
};

function DashboardPage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState({ total: 0, present: 0, percentage: 0 });
  const [memorizationData, setMemorizationData] = useState({ total: 0, completed: 0 });
  const [infaqData, setInfaqData] = useState({ total: 0, amount: 0 });
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [announcement, setAnnouncement] = useState<any>(null);
  const [ustadzahInfo, setUstadzahInfo] = useState({ name: 'Belum ada', subject: 'Menunggu penugasan' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles' as any)
        .select('*')
        .eq('id' as any, user.id as any)
        .single();
      setUserProfile(profile);

      // Fetch attendance data
      const { data: attendance } = await supabase
        .from('qr_attendance' as any)
        .select('*')
        .eq('user_id' as any, user.id as any);

      const totalAttendance = attendance?.length || 0;
      const presentAttendance = attendance?.filter((a: any) => a.status === 'Hadir').length || 0;
      const attendancePercentage = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;

      setAttendanceData({
        total: totalAttendance,
        present: presentAttendance,
        percentage: attendancePercentage
      });

      // Fetch memorization data
      const { data: memorization } = await supabase
        .from('memorization' as any)
        .select('*')
        .eq('user_id' as any, user.id as any);

      const totalMemorization = memorization?.length || 0;
      const completedMemorization = memorization?.filter((m: any) => m.status === 'completed').length || 0;

      setMemorizationData({
        total: totalMemorization,
        completed: completedMemorization
      });

      // Fetch infaq data for current month
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: infaq } = await supabase
        .from('keuangan' as any)
        .select('*')
        .eq('user_id' as any, user.id as any)
        .eq('kategori' as any, 'infaq' as any)
        .gte('tanggal' as any, currentMonth + '-01')
        .lte('tanggal' as any, currentMonth + '-31');

      const totalInfaq = infaq?.length || 0;
      const infaqAmount = infaq?.reduce((sum: number, item: any) => sum + (item.nominal || 0), 0) || 0;

      setInfaqData({
        total: totalInfaq,
        amount: infaqAmount
      });

      // Fetch schedule and announcement
      const { data: schedules } = await supabase
        .from('schedules' as any)
        .select('*')
        .order('sort_order', { ascending: true });

      if (schedules && schedules.length > 0) {
        const scheduleData = schedules.map((s: any) => ({
          subject: s.subject,
          category: s.category,
          teacher: s.teacher,
          day: s.day_label,
          room: s.room,
          iconClass: 'bg-sage-light text-primary'
        }));
        setSchedule(scheduleData);

        // Get announcement from schedule (is_announcement = true or has announcement field)
        const announcementSchedule = schedules.find((s: any) => s.is_announcement === true || s.announcement);
        if (announcementSchedule) {
          setAnnouncement({
            title: (announcementSchedule as any).announcement_title || (announcementSchedule as any).subject,
            description: (announcementSchedule as any).announcement || (announcementSchedule as any).subject,
            date: (announcementSchedule as any).announcement_date || (announcementSchedule as any).day_label,
            time: (announcementSchedule as any).announcement_time || '08.00 WIB'
          });
        }
      }

      // Fetch latest material for ustadzah info
      try {
        const { data: latestMaterial } = await supabase
          .from('materi' as any)
          .select('ustadzah, kategori')
          .eq('status' as any, 'Terbit' as any)
          .is('is_deleted' as any, false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestMaterial) {
          setUstadzahInfo({
            name: (latestMaterial as any).ustadzah,
            subject: (latestMaterial as any).kategori
          });
        }
      } catch (error) {
        // If materi table doesn't exist or no data, keep default values
        console.log('No materi data available');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const stats = [
    {
      label: "Kehadiran Kajian",
      value: `${attendanceData.percentage}%`,
      detail: `${attendanceData.present} dari ${attendanceData.total} kajian`,
      icon: UsersRound,
      iconClass: "text-primary",
      progress: true,
      progressValue: attendanceData.percentage
    },
    {
      label: "Hafalan Surah",
      value: memorizationData.completed.toString(),
      detail: `${memorizationData.total} surah ditargetkan`,
      icon: BookOpenText,
      iconClass: "text-rose-foreground"
    },
    {
      label: "Infaq Bulan Ini",
      value: formatCurrency(infaqData.amount),
      detail: infaqData.total > 0 ? `${infaqData.total} transaksi` : "Belum ada data",
      icon: CreditCard,
      iconClass: "text-amber-foreground"
    },
    {
      label: "Ustadzah Pembimbing",
      value: ustadzahInfo.name,
      detail: ustadzahInfo.subject,
      icon: GraduationCap,
      iconClass: "text-lavender-foreground"
    },
  ];

  return <BQS SalsabillaShell>
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="eyebrow">Ruang Belajarmu</p>
        <h1 className="page-title">Dashboard <span className="text-rose">✦</span></h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Selamat datang kembali, {userProfile?.full_name || 'Santri'}. Mari tumbuh bersama hari ini.
        </p>
      </div>
      <WeeklyCalendar />
    </div>

    <section aria-label="Ringkasan status" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return <div key={stat.label} className="min-w-0 rounded-md border border-border bg-card p-3 shadow-soft sm:p-5">
          <div className={`mb-3 flex h-8 w-8 items-center justify-center sm:mb-5 sm:h-10 sm:w-10 ${stat.iconClass}`}>
            <Icon size={16} strokeWidth={1.8} className="sm:size-20" />
          </div>
          <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">{stat.label}</p>
          <p className="mt-1.5 truncate font-display text-lg font-bold text-foreground sm:mt-2 sm:text-2xl">{stat.value}</p>
          <p className="mt-0.5 text-[9px] text-muted-foreground sm:mt-1 sm:text-[11px]">{stat.detail}</p>
          {stat.progress && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary sm:mt-4">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stat.progressValue}%` }} />
            </div>
          )}
        </div>;
      })}
    </section>

    {announcement && (
      <section className="relative mt-6 min-h-[180px] overflow-hidden rounded-md bg-banner sm:mt-7 sm:min-h-[255px]" aria-label="Pengumuman kajian">
        <img src={banner} alt="Para remaja muslimah belajar bersama dalam kelompok kajian" width={1536} height={768} className="absolute inset-0 h-full w-full object-cover object-[60%_center]" />
        <div className="banner-overlay absolute inset-0" />
        <div className="relative z-10 flex min-h-[180px] max-w-[470px] flex-col items-start justify-center px-4 py-4 sm:min-h-[255px] sm:px-9 sm:py-7">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-primary sm:mb-3 sm:px-3 sm:py-1 sm:text-[10px]">Pengumuman spesial</span>
          <h2 className="font-display text-lg font-bold leading-tight text-foreground sm:text-2xl sm:text-[31px]">{announcement.title}</h2>
          <p className="mt-2 max-w-[330px] text-[11px] leading-relaxed text-foreground/80 sm:mt-2.5 sm:text-sm">{announcement.description}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-primary sm:mt-5 sm:gap-2 sm:text-xs">
            <CalendarDays size={3} className="sm:size-5" /> {announcement.date} <span className="mx-1 text-foreground/30">·</span> {announcement.time}
          </div>
        </div>
      </section>
    )}

    <section className="mt-6 sm:mt-9"><div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Agenda Belajar</p><h2 className="section-title mt-1">Jadwal Kajian</h2></div><Link to="/jadwal" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-opacity hover:opacity-70">Lihat riwayat kajian <ArrowRight size={15} /></Link></div>
      {schedule.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Belum ada jadwal kajian"
          description="Jadwal kajian belum ditambahkan. Hubungi admin untuk informasi lebih lanjut."
          variant="muted"
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card shadow-soft"><div className="overflow-x-auto"><table className="w-full min-w-[320px] text-left sm:min-w-[690px]"><thead className="bg-secondary/60 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]"><tr><th className="px-3 py-3 sm:px-6 sm:py-4">Kitab / Materi</th><th className="px-2 py-3 sm:px-5 sm:py-4">Ustadzah</th><th className="px-2 py-3 sm:px-5 sm:py-4">Hari / Jam</th><th className="px-3 py-3 sm:px-6 sm:py-4">Ruangan</th></tr></thead><tbody>{schedule.map((item) => <tr key={item.subject} className="border-t border-border text-[11px] sm:text-[13px]"><td className="px-3 py-3 sm:px-6 sm:py-4"><div className="flex items-center gap-2 sm:gap-3"><span className={`flex h-5 w-5 shrink-0 items-center justify-center sm:h-6 sm:w-6 text-primary`}><BookOpenText size={10} className="sm:size-12" /></span><div><p className="font-bold text-foreground text-[10px] sm:text-xs">{item.subject}</p><p className="mt-0.5 text-[8px] text-muted-foreground sm:text-[10px]">{item.category}</p></div></div></td><td className="whitespace-nowrap px-2 py-3 text-muted-foreground text-[10px] sm:px-5 sm:py-4 sm:text-xs">{item.teacher}</td><td className="whitespace-nowrap px-2 py-3 text-[10px] sm:px-5 sm:py-4 sm:text-xs"><span className="inline-flex items-center gap-1 text-foreground"><Clock3 size={3} className="text-muted-foreground sm:size-5" /> {item.day}</span></td><td className="whitespace-nowrap px-3 py-3 text-[10px] sm:px-6 sm:py-4 sm:text-xs"><span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin size={3} className="sm:size-5" /> {item.room}</span></td></tr>)}</tbody></table></div></div>
      )}
    </section>

    <section className="mt-6 grid gap-4 sm:mt-7 sm:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-md border border-border bg-sage-light px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center text-primary sm:h-10 sm:w-10"><QrCode size={18} className="sm:size-20" /></span><div><p className="text-sm font-bold">Sudah siap untuk kajian berikutnya?</p><p className="mt-0.5 text-xs text-muted-foreground">Catat kehadiranmu dengan mudah saat tiba di lokasi.</p></div></div><Button asChild className="w-full sm:w-auto"><Link to="/absensi">Absen dengan QR <ArrowRight size={16} /></Link></Button></div>
      <div className="flex flex-col gap-4 rounded-md border border-border bg-sage-light px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center text-primary sm:h-10 sm:w-10"><CreditCard size={18} className="sm:size-20" /></span><div><p className="text-sm font-bold">Catat keuangan pembelajaranmu</p><p className="mt-0.5 text-xs text-muted-foreground">Input pembayaran SPP, infaq, dan pengeluaran.</p></div></div><Button asChild className="w-full sm:w-auto"><Link to="/keuangan">Kelola Keuangan <ArrowRight size={16} /></Link></Button></div>
    </section>
  </BQS SalsabillaShell>;
}
