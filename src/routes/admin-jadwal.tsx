import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, CalendarDays, Plus, Search, Filter, MoreVertical, CheckCircle2, TrendingUp, Clock3, Edit, Trash2, X, AlertCircle, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin-shell";
import { TimePicker } from "@/components/time-picker";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/page-skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useClickOutside } from "@/hooks/use-click-outside";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin-jadwal")({
  head: () => ({ meta: [
    { title: "Jadwal Kajian Admin — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Kelola jadwal kajian BQS Salsabilla Ruang Muslimah." },
    { property: "og:title", content: "Jadwal Kajian Admin — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Kelola jadwal kajian BQS Salsabilla Ruang Muslimah." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdminJadwalPage,
});

type Schedule = {
  id: string;
  judul: string;
  hari: string;
  waktu: string;
  ruang: string;
  ustadzah: string;
  status: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

function AdminJadwalPage() {
  const navigate = useNavigate();
  const [schedulesData, setSchedulesData] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useClickOutside(dropdownRef, () => setActiveDropdown(null), activeDropdown !== null);
  const [formData, setFormData] = useState({
    judul: "",
    hari: "",
    waktu: "",
    ruang: "",
    ustadzah: "",
    status: "Aktif"
  });
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    type: 'success' | 'error' | 'confirm';
    onConfirm?: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    type: 'success',
  });

  // Fetch schedules from Supabase
  useEffect(() => {
    fetchSchedules(true);
  }, []);

  const fetchSchedules = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      console.log('Fetching schedules with fresh request...');

      const { data, error } = await supabase
        .from('schedules' as any)
        .select('*')
        .is('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched schedules:', data);
      console.log('Number of schedules fetched:', data?.length || 0);

      setSchedulesData((data || []) as unknown as Schedule[]);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data jadwal');
      setAlertDialog({
        open: true,
        title: 'Gagal Memuat Data',
        description: err instanceof Error ? err.message : 'Gagal memuat data jadwal',
        type: 'error',
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setFormData({
      judul: "",
      hari: "",
      waktu: "19:00", // Default 7 PM
      ruang: "",
      ustadzah: "",
      status: "Aktif"
    });
    setIsModalOpen(true);
  };

  const formatTimeDisplay = (time: string) => {
    if (!time) return '-';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours || '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      judul: schedule.judul,
      hari: schedule.hari,
      waktu: schedule.waktu,
      ruang: schedule.ruang,
      ustadzah: schedule.ustadzah,
      status: schedule.status
    });
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDeleteSchedule = async (id: string) => {
    setAlertDialog({
      open: true,
      title: 'Hapus Jadwal',
      description: 'Apakah Anda yakin ingin menghapus jadwal ini? Data yang dihapus tidak dapat dikembalikan.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          console.log('Deleting schedule with ID:', id);

          // Soft delete from schedules by marking is_deleted as true
          const { error: scheduleError } = await supabase
            .from('schedules' as any)
            .update({
              is_deleted: true,
              deleted_at: new Date().toISOString()
            } as any)
            .eq('id' as any, id as any);

          if (scheduleError) {
            console.error('Error soft deleting from schedules:', scheduleError);
            throw scheduleError;
          }

          console.log('Successfully soft deleted from schedules');

          // Force refresh from database to ensure UI is in sync
          await fetchSchedules(false);

          // Reset search and pagination
          setSearchQuery('');
          setCurrentPage(1);
          setActiveDropdown(null);

          console.log('UI updated successfully');

          setAlertDialog({
            open: true,
            title: 'Berhasil',
            description: 'Jadwal berhasil dihapus.',
            type: 'success',
          });
        } catch (err) {
          console.error('Error deleting schedule:', err);
          setAlertDialog({
            open: true,
            title: 'Gagal',
            description: err instanceof Error ? err.message : 'Gagal menghapus jadwal',
            type: 'error',
          });
        }
      }
    });
  };

  const handleCompleteSchedule = async (id: string) => {
    try {
      console.log('Completing schedule with ID:', id);

      // Mark as non-active instead of deleting
      const { error: scheduleError } = await supabase
        .from('schedules' as any)
        .update({
          status: 'Non-Aktif'
        } as any)
        .eq('id' as any, id as any);

      if (scheduleError) {
        console.error('Error marking schedule as completed:', scheduleError);
        throw scheduleError;
      }

      console.log('Successfully marked schedule as completed');

      // Force refresh from database to ensure UI is in sync
      await fetchSchedules(false);

      setActiveDropdown(null);

      // Redirect to admin-materi with schedule_id
      navigate({ 
        to: '/admin-materi', 
        search: { schedule_id: id }
      });

      setAlertDialog({
        open: true,
        title: 'Berhasil',
        description: 'Jadwal berhasil ditandai selesai. Anda akan diarahkan ke halaman materi.',
        type: 'success',
      });
    } catch (err) {
      console.error('Error completing schedule:', err);
      setAlertDialog({
        open: true,
        title: 'Gagal',
        description: err instanceof Error ? err.message : 'Gagal menandai jadwal selesai',
        type: 'error',
      });
    }
  };

  const handleSaveSchedule = async () => {
    // Validation
    if (!formData.judul.trim()) {
      setAlertDialog({
        open: true,
        title: 'Validasi',
        description: 'Judul kajian harus diisi.',
        type: 'error',
      });
      return;
    }

    if (!formData.hari.trim()) {
      setAlertDialog({
        open: true,
        title: 'Validasi',
        description: 'Hari harus diisi.',
        type: 'error',
      });
      return;
    }

    if (!formData.waktu.trim()) {
      setAlertDialog({
        open: true,
        title: 'Validasi',
        description: 'Waktu harus diisi.',
        type: 'error',
      });
      return;
    }

    if (!formData.ruang.trim()) {
      setAlertDialog({
        open: true,
        title: 'Validasi',
        description: 'Ruang harus diisi.',
        type: 'error',
      });
      return;
    }

    if (!formData.ustadzah.trim()) {
      setAlertDialog({
        open: true,
        title: 'Validasi',
        description: 'Nama ustadzah harus diisi.',
        type: 'error',
      });
      return;
    }

    try {
      if (editingSchedule) {
        console.log('Updating schedule:', editingSchedule.id);
        // Update existing schedule
        const updateData: any = {
          judul: formData.judul,
          hari: formData.hari,
          waktu: formData.waktu,
          ruang: formData.ruang,
          ustadzah: formData.ustadzah,
          status: formData.status
        };

        const { error } = await supabase
          .from('schedules' as any)
          .update(updateData)
          .eq('id' as any, editingSchedule.id as any);

        if (error) throw error;

        console.log('Schedule updated, updating UI...');
        // Manual state update
        setSchedulesData(prev => prev.map(s =>
          s.id === editingSchedule.id ? { ...s, ...formData } : s
        ));
        setIsModalOpen(false);
        setAlertDialog({
          open: true,
          title: 'Berhasil',
          description: 'Jadwal berhasil diperbarui.',
          type: 'success',
        });
      } else {
        console.log('Creating new schedule...');
        // Create new schedule
        const insertData: any = {
          judul: formData.judul,
          hari: formData.hari,
          waktu: formData.waktu,
          ruang: formData.ruang,
          ustadzah: formData.ustadzah,
          status: formData.status
        };

        const { data, error } = await supabase
          .from('schedules' as any)
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;

        console.log('Schedule created, updating UI...');
        // Manual state update
        setSchedulesData(prev => [data as unknown as Schedule, ...prev]);
        setIsModalOpen(false);
        setAlertDialog({
          open: true,
          title: 'Berhasil',
          description: 'Jadwal baru berhasil ditambahkan.',
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
      setAlertDialog({
        open: true,
        title: 'Gagal',
        description: err instanceof Error ? err.message : 'Gagal menyimpan jadwal',
        type: 'error',
      });
    }
  };

  const getDayOrder = (day: string) => {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    return days.indexOf(day);
  };

  const getCurrentDay = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  };

  const getNextSchedule = () => {
    const currentDay = getCurrentDay();
    const currentDayOrder = getDayOrder(currentDay || 'Senin');

    // Find next active schedule starting from current day
    const upcomingSchedules = schedulesData
      .filter(s => s.status === 'Aktif')
      .sort((a, b) => {
        const aDayOrder = getDayOrder(a.hari);
        const bDayOrder = getDayOrder(b.hari);

        // If both are upcoming days
        if (aDayOrder >= currentDayOrder && bDayOrder >= currentDayOrder) {
          if (aDayOrder !== bDayOrder) return aDayOrder - bDayOrder;
          // Same day, sort by time
          return a.waktu.localeCompare(b.waktu);
        }

        // If both are past days
        if (aDayOrder < currentDayOrder && bDayOrder < currentDayOrder) {
          if (aDayOrder !== bDayOrder) return aDayOrder - bDayOrder;
          // Same day, sort by time
          return a.waktu.localeCompare(b.waktu);
        }

        // One upcoming, one past - upcoming first
        if (aDayOrder >= currentDayOrder) return -1;
        return 1;
      });

    return upcomingSchedules.length > 0 ? upcomingSchedules[0] : null;
  };

  const filteredSchedules = schedulesData
    .filter(schedule =>
      schedule.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.hari.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.ruang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.ustadzah.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const currentDay = getCurrentDay();
      const aDayOrder = getDayOrder(a.hari);
      const bDayOrder = getDayOrder(b.hari);
      const currentDayOrder = getDayOrder(currentDay || 'Senin');

      // If both are upcoming days
      if (aDayOrder >= currentDayOrder && bDayOrder >= currentDayOrder) {
        if (aDayOrder !== bDayOrder) return aDayOrder - bDayOrder;
        // Same day, sort by time
        return a.waktu.localeCompare(b.waktu);
      }

      // If both are past days
      if (aDayOrder < currentDayOrder && bDayOrder < currentDayOrder) {
        if (aDayOrder !== bDayOrder) return aDayOrder - bDayOrder;
        // Same day, sort by time
        return a.waktu.localeCompare(b.waktu);
      }

      // One upcoming, one past - upcoming first
      if (aDayOrder >= currentDayOrder) return -1;
      return 1;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSchedules = filteredSchedules.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return <AdminShell>
    <div className="mb-6 sm:mb-8">
      <Link to="/admin" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:mb-5"><ArrowLeft size={12} /> Kembali ke dashboard</Link>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Manajemen Jadwal</p><h1 className="page-title">Jadwal Kajian <span className="text-rose">✦</span></h1><p className="mt-2 text-sm text-muted-foreground">Atur jadwal kajian rutin dan kegiatan khusus.</p></div><Button className="h-10 sm:h-11" onClick={handleAddSchedule}><Plus size={14} className="sm:size-15" /> Tambah Jadwal</Button></div>
    </div>

    {error && (
      <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    )}

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(330px,.95fr)]">
      <section className="overflow-hidden rounded-md border border-border bg-card shadow-soft">
        <div className="border-b border-border px-4 py-4 sm:px-7 sm:py-5"><div className="flex items-center gap-2"><CalendarDays size={14} className="text-primary sm:size-15" /><h2 className="section-title">Daftar Jadwal</h2></div><p className="mt-1.5 text-xs text-muted-foreground">Jadwal kajian yang dijadwalkan untuk santriwati.</p></div>
        <div className="p-4 sm:p-7">
          <div className="mb-5 flex gap-3 sm:mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari jadwal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 h-10 rounded-md border border-border bg-background px-3 text-xs sm:h-11 sm:text-sm"
              />
            </div>
            <Button variant="outline" className="h-10 sm:h-11"><Filter size={14} className="sm:size-15" /> Filter</Button>
          </div>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : currentSchedules.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Belum ada jadwal kajian</p>
              <p className="text-xs text-muted-foreground mt-1">Tambahkan jadwal baru untuk memulai</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto"><table className="w-full min-w-[320px] text-left sm:min-w-[620px]"><thead className="bg-secondary/60 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]"><tr><th className="px-4 py-3 sm:px-7 sm:py-4">Judul</th><th className="px-3 py-3 sm:px-5 sm:py-4">Hari/Waktu</th><th className="px-3 py-3 sm:px-5 sm:py-4">Ruang</th><th className="px-3 py-3 sm:px-5 sm:py-4">Status</th><th className="px-4 py-3 text-right sm:px-7 sm:py-4">Aksi</th></tr></thead><tbody>{currentSchedules.map((schedule) => <tr key={schedule.id} className="border-t border-border text-[11px] sm:text-sm"><td className="whitespace-nowrap px-4 py-3 font-semibold sm:px-7 sm:py-4">{schedule.judul}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{schedule.hari}, {formatTimeDisplay(schedule.waktu)}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{schedule.ruang}</td><td className="px-3 py-3 sm:px-5 sm:py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold sm:px-3 sm:py-1 sm:text-[11px] ${schedule.status === "Aktif" ? "bg-sage-light text-primary" : "bg-rose-light text-rose-foreground"}`}>{schedule.status}</span></td><td className="px-4 py-3 text-right sm:px-7 sm:py-4 relative"><div className="relative inline-block" ref={activeDropdown === schedule.id ? dropdownRef : null}><Button variant="ghost" size="sm" className="h-6 px-1.5 text-[8px] sm:h-8 sm:px-2 sm:text-xs" onClick={() => setActiveDropdown(activeDropdown === schedule.id ? null : schedule.id)}><MoreVertical size={12} /></Button>{activeDropdown === schedule.id && (<div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-md border border-border bg-card shadow-lg sm:w-40">{schedule.status === 'Aktif' && <button onClick={() => handleCompleteSchedule(schedule.id)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left hover:bg-secondary sm:text-sm"><Check size={12} /> Selesai</button>}<button onClick={() => handleEditSchedule(schedule)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left hover:bg-secondary sm:text-sm"><Edit size={12} /> Edit</button><button onClick={() => handleDeleteSchedule(schedule.id)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left text-destructive hover:bg-destructive/10 sm:text-sm"><Trash2 size={12} /> Hapus</button></div>)}</div></td></tr>)}</tbody></table></div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[10px] text-muted-foreground sm:text-xs">
                    Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredSchedules.length)} dari {filteredSchedules.length} jadwal
                  </div>
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 sm:h-8 sm:w-8 sm:px-2"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={12} className="sm:size-14" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className="h-7 w-7 p-0 text-[10px] sm:h-8 sm:w-8 sm:text-xs"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 sm:h-8 sm:w-8 sm:px-2"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={12} className="sm:size-14" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <div className="space-y-5 sm:space-y-6">
        <section className="rounded-md border border-border bg-sage-light p-5 sm:p-7"><div className="mb-4 flex h-10 w-10 items-center justify-center text-primary"><TrendingUp size={20} /></div><h2 className="font-display text-lg font-bold text-foreground sm:text-xl">Aktivitas kajian.</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Pantau frekuensi kajian dan kehadiran santriwati dalam setiap sesi pembelajaran.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Jadwal</p><p className="font-display text-2xl font-bold text-primary sm:text-3xl">{schedulesData.length}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Jadwal Aktif</p><p className="font-display text-2xl font-bold text-primary sm:text-3xl">{schedulesData.filter(s => s.status === 'Aktif').length}</p></div></div></section>
        <section className="rounded-md border border-border bg-card p-5 shadow-soft sm:p-7"><div className="mb-4 flex items-center justify-between sm:mb-5"><div><p className="eyebrow">Kajian Berikutnya</p><h2 className="section-title mt-1">{getNextSchedule() ? getNextSchedule().hari : 'Belum ada jadwal'}</h2></div><span className="text-primary"><Clock3 size={20} /></span></div>{getNextSchedule() ? (
            <>
              <div className="flex items-baseline gap-2"><strong className="font-display text-3xl font-bold text-primary sm:text-4xl">{formatTimeDisplay(getNextSchedule().waktu)}</strong><span className="text-xs text-muted-foreground">WIB · {getNextSchedule().ruang}</span></div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary sm:mt-5"><div className="h-full w-[92%] rounded-full bg-primary" /></div>
              <p className="mt-3 text-xs text-muted-foreground">{getNextSchedule().judul}</p>
            </>
          ) : (
            <div className="flex items-baseline gap-2"><strong className="font-display text-3xl font-bold text-muted-foreground sm:text-4xl">—</strong><span className="text-xs text-muted-foreground">Belum ada jadwal aktif</span></div>
          )}</section>
      </div>
    </div>
    {isModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-md border border-border bg-card p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">{editingSchedule ? "Edit Jadwal" : "Tambah Jadwal"}</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              <X size={16} />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold">Judul Kajian</label>
              <input
                type="text"
                value={formData.judul}
                onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
                placeholder="Masukkan judul kajian"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Hari</label>
              <select
                value={formData.hari}
                onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
              >
                <option value="">Pilih hari</option>
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
                <option value="Sabtu">Sabtu</option>
                <option value="Minggu">Minggu</option>
              </select>
            </div>
            <div>
              <TimePicker
                value={formData.waktu}
                onChange={(value) => setFormData({ ...formData, waktu: value })}
                label="Waktu"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Ruang</label>
              <input
                type="text"
                value={formData.ruang}
                onChange={(e) => setFormData({ ...formData, ruang: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
                placeholder="Contoh: Ruang Aisyah"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Ustadzah</label>
              <input
                type="text"
                value={formData.ustadzah}
                onChange={(e) => setFormData({ ...formData, ustadzah: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
                placeholder="Nama ustadzah"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
              >
                <option value="Aktif">Aktif</option>
                <option value="Non-Aktif">Non-Aktif</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button className="flex-1" onClick={handleSaveSchedule}>Simpan</Button>
          </div>
        </div>
      </div>
    )}
    <AlertDialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog({ ...alertDialog, open })}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
          <AlertDialogDescription>{alertDialog.description}</AlertDialogDescription>
        </AlertDialogHeader>
        {alertDialog.type === 'confirm' && (
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={alertDialog.onConfirm}>Lanjutkan</AlertDialogAction>
          </AlertDialogFooter>
        )}
        {alertDialog.type !== 'confirm' && (
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertDialog({ ...alertDialog, open: false })}>OK</AlertDialogAction>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  </AdminShell>;
}