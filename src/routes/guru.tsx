import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, BookOpenText, CalendarDays, Users, Clock3, TrendingUp, GraduationCap, ShieldCheck, CheckCircle2, AlertCircle, QrCode } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { TeacherShell } from "@/components/teacher-shell";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/guru")({
  head: () => ({ meta: [
    { title: "Dashboard Guru — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Dashboard pengajaran untuk guru BQS Salsabilla Ruang Muslimah." },
    { property: "og:title", content: "Dashboard Guru — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Dashboard pengajaran untuk guru BQS Salsabilla Ruang Muslimah." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: GuruDashboardPage,
});

type Schedule = {
  id: string;
  subject: string;
  teacher: string;
  day_label: string;
  room: string;
  category: string;
};

type Attendance = {
  id: string;
  lesson: string;
  scan_time: string;
  status: string;
  attended_on: string;
};

type User = {
  id: string;
  full_name: string;
  email: string;
};

function GuruDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<Schedule[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    assessedToday: 0,
    averageScore: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('User not authenticated');
      
      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles' as any)
        .select('*')
        .eq('id' as any, currentUser.id)
        .single();
      
      setUser(profileData as User);

      // Fetch schedules
      const { data: schedulesData } = await supabase
        .from('schedules' as any)
        .select('*')
        .order('sort_order', { ascending: true });

      setTodaySchedule((schedulesData || []) as Schedule[]);

      // Fetch recent attendance for this teacher
      const { data: attendanceData } = await supabase
        .from('attendance' as any)
        .select('*')
        .eq('user_id' as any, currentUser.id)
        .order('attended_on', { ascending: false })
        .limit(5);

      setRecentAttendance((attendanceData || []) as Attendance[]);

      // Fetch stats
      const { data: profilesData } = await supabase
        .from('profiles' as any)
        .select('id');

      const { data: nilaiData } = await supabase
        .from('nilai' as any)
        .select('score, assessed_at');

      const today = new Date().toISOString().split('T')[0];
      const assessedToday = (nilaiData || []).filter((n: any) => 
        n.assessed_at && n.assessed_at.startsWith(today)
      ).length;

      const averageScore = (nilaiData || []).length > 0
        ? Math.round((nilaiData as any[]).reduce((sum, n) => sum + n.score, 0) / (nilaiData as any[]).length)
        : 0;

      setStats({
        totalStudents: (profilesData || []).length,
        assessedToday,
        averageScore,
      });

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  if (loading) {
    return <TeacherShell>
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    </TeacherShell>;
  }

  return <TeacherShell>
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Dashboard Pengajaran</p>
          <h1 className="page-title">Selamat Datang, {user?.full_name || 'Guru'} <span className="text-rose">✦</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Pantau jadwal mengajar, nilai siswi, dan aktivitas kajianmu.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <GraduationCap size={12} className="text-primary" /> Guru Kajian
        </div>
      </div>
    </div>

    {error && (
      <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    )}

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(330px,.95fr)]">
      <section className="overflow-hidden rounded-md border border-border bg-card shadow-soft">
        <div className="border-b border-border px-4 py-4 sm:px-7 sm:py-5">
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-primary sm:size-15" />
            <h2 className="section-title">Jadwal Kajian</h2>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">Jadwal kajian yang tersedia.</p>
        </div>
        <div className="p-4 sm:p-7">
          <div className="space-y-3">
            {todaySchedule.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">Belum ada jadwal kajian</p>
            ) : (
              todaySchedule.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between rounded-md border border-border bg-secondary/60 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <BookOpenText size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{schedule.subject}</p>
                      <p className="text-xs text-muted-foreground">{schedule.day_label} · {schedule.room}</p>
                    </div>
                  </div>
                  <span className="inline-flex rounded-full bg-sage-light px-2.5 py-1 text-[10px] font-bold text-primary">
                    Aktif
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <div className="space-y-5 sm:space-y-6">
        <section className="rounded-md border border-border bg-sage-light p-5 sm:p-7">
          <div className="mb-4 flex h-10 w-10 items-center justify-center text-primary">
            <TrendingUp size={20} />
          </div>
          <h2 className="font-display text-lg font-bold text-foreground sm:text-xl">Statistik Penilaian</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Overview penilaian hari ini.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dinilai Hari Ini</p>
              <p className="font-display text-2xl font-bold text-primary sm:text-3xl">{stats.assessedToday}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rata-rata Nilai</p>
              <p className="font-display text-2xl font-bold text-primary sm:text-3xl">{stats.averageScore}</p>
            </div>
          </div>
        </section>

        <section className="rounded-md border border-border bg-card p-5 shadow-soft sm:p-7">
          <div className="mb-4 flex items-center justify-between sm:mb-5">
            <div>
              <p className="eyebrow">Riwayat Absensi</p>
              <h2 className="section-title mt-1">Absensi Terakhir</h2>
            </div>
            <span className="text-primary">
              <QrCode size={20} />
            </span>
          </div>
          <div className="space-y-3">
            {recentAttendance.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">Belum ada riwayat absensi</p>
            ) : (
              recentAttendance.map((attendance) => (
                <div key={attendance.id} className="flex items-center justify-between rounded-md border border-border bg-secondary/30 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{attendance.lesson}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(attendance.attended_on)}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatTime(attendance.scan_time)}</span>
                </div>
              ))
            )}
          </div>
          <Link to="/guru-absensi" className="mt-4 block">
            <Button variant="outline" className="w-full text-xs">
              Lihat Semua Absensi
            </Button>
          </Link>
        </section>

        <section className="rounded-md border border-border bg-card p-5 shadow-soft sm:p-7">
          <div className="mb-4 flex items-center justify-between sm:mb-5">
            <div>
              <p className="eyebrow">Aksi Cepat</p>
              <h2 className="section-title mt-1">Menu Guru</h2>
            </div>
            <span className="text-primary">
              <ShieldCheck size={20} />
            </span>
          </div>
          <div className="space-y-2">
            <Link to="/guru-nilai" className="block">
              <Button variant="outline" className="w-full justify-start text-xs">
                <GraduationCap size={14} className="mr-2" />
                Input Nilai Siswi
              </Button>
            </Link>
            <Link to="/guru-absensi" className="block">
              <Button variant="outline" className="w-full justify-start text-xs">
                <QrCode size={14} className="mr-2" />
                Absen QR
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  </TeacherShell>;
}
