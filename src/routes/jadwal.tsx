import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, BookOpenText, CalendarDays, Clock3, MapPin, UsersRound, ChevronRight, Check, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SalsabillaShell } from "@/components/sakinah-shell";
import { WeeklyCalendar } from "@/components/weekly-calendar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/jadwal")({
  head: () => ({ meta: [
    { title: "Jadwal Kajian — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Jadwal lengkap kajian BQS Salsabilla Ruang Muslimah dengan detail materi, ustadzah, dan histori pertemuan." },
    { property: "og:title", content: "Jadwal Kajian — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Jadwal lengkap kajian BQS Salsabilla Ruang Muslimah dengan detail materi, ustadzah, dan histori pertemuan." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: JadwalPage,
});

type Schedule = {
  id: string;
  judul: string;
  hari: string;
  waktu: string;
  ruang: string;
  ustadzah: string;
  status: string;
  created_at?: string;
};

type AttendanceHistory = {
  id: string;
  lesson: string;
  scan_time: string;
  status: string;
  qr_codes?: {
    lesson: string;
    date: string;
  };
};

function JadwalPage() {
  const [selectedClass, setSelectedClass] = useState<AttendanceHistory | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);

      // Fetch schedules from database
      const { data: schedulesData } = await supabase
        .from('schedules' as any)
        .select('*')
        .is('is_deleted' as any, false)
        .eq('status' as any, 'Aktif' as any)
        .order('created_at', { ascending: false });

      setSchedules((schedulesData || []) as unknown as Schedule[]);

      // Fetch attendance history for current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: attendanceData } = await supabase
          .from('qr_attendance' as any)
          .select(`
            id,
            lesson,
            scan_time,
            status,
            qr_codes (
              lesson,
              date
            )
          `)
          .eq('user_id' as any, user.id as any)
          .order('scan_time', { ascending: false })
          .limit(10);

        setAttendanceHistory((attendanceData || []) as unknown as AttendanceHistory[]);
      }
    } catch (error) {
      console.error('Error fetching schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '-';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours || '0');
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes || '00'} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getUpcomingSchedule = () => {
    // Get first schedule as upcoming (simplified logic)
    return schedules.slice(0, 1).map((s) => ({
      id: s.id,
      subject: s.judul,
      category: 'Kajian',
      teacher: s.ustadzah,
      day: s.hari,
      date: formatDate(s.created_at || new Date().toISOString()),
      room: s.ruang,
      iconClass: 'bg-sage-light text-primary',
      description: `Kajian dengan ${s.ustadzah}`,
      attendance: 'Wajib',
      hari: s.hari,
      ruang: s.ruang,
    }));
  };

  return <SalsabillaShell>
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <Link to="/" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:mb-5">
          <ArrowLeft size={12} /> Kembali ke dashboard
        </Link>
        <p className="eyebrow">Agenda Belajar</p>
        <h1 className="page-title">Jadwal Kajian <span className="text-rose">✦</span></h1>
        <p className="mt-2 text-sm text-muted-foreground">Pantau jadwal kajian dan materi yang telah dipelajari.</p>
      </div>
      <WeeklyCalendar />
    </div>

    {/* Upcoming Schedule */}
    <section className="mb-8">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Jumat Malam Ini</p>
          <h2 className="section-title mt-1">Kajian Mendatang</h2>
        </div>
        <span className="text-xs text-muted-foreground">Pengajian Jumat malam</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-sm text-muted-foreground">Memuat jadwal...</p>
          </div>
        ) : getUpcomingSchedule().length === 0 ? (
          <div className="col-span-full text-center py-12">
            <CalendarDays size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Belum ada jadwal kajian</p>
            <p className="text-xs text-muted-foreground mt-1">Jadwal akan muncul setelah ditambahkan admin</p>
          </div>
        ) : (
          getUpcomingSchedule().map((schedule) => (
          <div
            key={schedule.id}
            className="rounded-md border border-border bg-card p-5 shadow-soft transition-all hover:border-primary/50"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${schedule.iconClass}`}>
                <BookOpenText size={20} />
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-sage-light px-2.5 py-1 text-[10px] font-bold text-primary">
                <Check size={10} /> {schedule.attendance}
              </span>
            </div>
            <h3 className="font-display text-base font-bold text-foreground">{schedule.subject}</h3>
            <p className="mt-1 text-[10px] text-muted-foreground">{schedule.category}</p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{schedule.description}</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <UsersRound size={12} className="text-primary" />
                <span>{schedule.teacher}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays size={12} className="text-primary" />
                <span>{schedule.hari}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin size={12} className="text-primary" />
                <span>{schedule.ruang}</span>
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-[10px] text-muted-foreground">Materi akan ditentukan saat kajian berlangsung</p>
            </div>
          </div>
        ))
        )}
      </div>
    </section>

    {/* History Section */}
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Riwayat Belajar</p>
          <h2 className="section-title mt-1">Histori Kajian Jumat Malam</h2>
        </div>
        <span className="text-xs text-muted-foreground">{attendanceHistory.length} kajian terakhir</span>
      </div>
      <div className="overflow-hidden rounded-md border border-border bg-card shadow-soft">
        <div className="p-4 sm:p-7">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="mt-4 text-sm text-muted-foreground">Memuat riwayat...</p>
            </div>
          ) : attendanceHistory.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Belum ada riwayat kajian</p>
              <p className="text-xs text-muted-foreground mt-1">Kajian akan tercatat setelah dihadiri</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full min-w-[500px] text-left sm:min-w-[720px]">
            <thead className="bg-secondary/60 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]">
              <tr>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3">Tanggal</th>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3">Kajian</th>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3">Ustadzah</th>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3">Kehadiran</th>
                <th className="px-3 py-2.5 text-right sm:px-4 sm:py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.map((item) => (
                <tr key={item.id} className="border-t border-border text-[10px] sm:text-sm">
                  <td className="whitespace-nowrap px-3 py-2.5 sm:px-4 sm:py-3">
                    <p className="font-semibold text-foreground text-[9px] sm:text-xs">{formatDateTime(item.scan_time)}</p>
                    <p className="text-[8px] text-muted-foreground sm:text-[10px]">{formatTime(item.scan_time)}</p>
                  </td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center sm:h-5 sm:w-5 text-primary`}>
                        <BookOpenText size={8} className="sm:size-10" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground text-[9px] sm:text-xs truncate">{item.lesson}</p>
                        <p className="text-[8px] text-muted-foreground sm:text-[10px] truncate">{item.qr_codes?.lesson || 'Kajian'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground text-[9px] sm:px-4 sm:py-3 sm:text-xs truncate max-w-[80px] sm:max-w-none">-</td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold sm:px-2.5 sm:py-1 sm:text-[10px] ${
                      item.status === "Hadir" 
                        ? "bg-sage-light text-primary" 
                        : item.status === "Izin" 
                          ? "bg-rose-light text-rose-foreground" 
                          : "bg-amber-light text-amber-foreground"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right sm:px-4 sm:py-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-1.5 text-[8px] sm:h-8 sm:px-2 sm:text-xs"
                      onClick={() => setSelectedClass(item)}
                    >
                      Detail
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
          )}
        </div>
      </div>
    </section>

    {/* Quick Action */}
    <section className="mt-6 flex flex-col gap-4 rounded-md border border-border bg-sage-light px-4 py-4 sm:mt-7 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center text-primary sm:h-10 sm:w-10">
          <ExternalLink size={18} className="sm:size-20" />
        </span>
        <div>
          <p className="text-sm font-bold">Ingin mengakses dokumentasi?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Buka materi dan catatan dari kajian sebelumnya.</p>
        </div>
      </div>
      <Button variant="outline" className="w-full sm:w-auto">
        Lihat Dokumentasi <ChevronRight size={16} className="ml-2" />
      </Button>
    </section>

    {/* Detail Modal */}
    {selectedClass && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-md border border-border bg-card p-6 shadow-panel sm:p-8">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">{selectedClass.lesson}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{selectedClass.qr_codes?.lesson || 'Kajian'}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedClass(null)}
            >
              <X size={16} />
            </Button>
          </div>
          
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays size={12} className="text-primary" />
              <span>{formatDateTime(selectedClass.scan_time)} · {formatTime(selectedClass.scan_time)} WIB</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UsersRound size={12} className="text-primary" />
              <span>-</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin size={12} className="text-primary" />
              <span>-</span>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="mb-2 text-sm font-bold text-foreground">Materi yang dibahas</h4>
            <p className="text-xs leading-relaxed text-muted-foreground">Kehadiran tercatat pada {formatDateTime(selectedClass.scan_time)}</p>
          </div>

          <div className="mb-6">
            <h4 className="mb-2 text-sm font-bold text-foreground">Kehadiran</h4>
            <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
              selectedClass.status === "Hadir" 
                ? "bg-sage-light text-primary" 
                : selectedClass.status === "Izin" 
                  ? "bg-rose-light text-rose-foreground" 
                  : "bg-amber-light text-amber-foreground"
            }`}>
              {selectedClass.status}
            </span>
          </div>

          {false ? (
            <div className="mb-6 rounded-md bg-secondary p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ExternalLink size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Dokumentasi Tersedia</p>
                  <p className="text-xs text-muted-foreground">Akses materi dan catatan kajian</p>
                </div>
                <Button 
                  size="sm" 
                  className="text-xs"
                  asChild
                >
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    Buka
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-6 rounded-md bg-secondary/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <ExternalLink size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-muted-foreground">Dokumentasi Belum Tersedia</p>
                  <p className="text-xs text-muted-foreground">Guru belum mengunggah dokumentasi</p>
                </div>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSelectedClass(null)}
          >
            Tutup
          </Button>
        </div>
      </div>
    )}
  </SalsabillaShell>;
}
