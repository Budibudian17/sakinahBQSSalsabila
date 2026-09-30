import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, BookOpenText, Plus, Search, Filter, MoreVertical, CheckCircle2, TrendingUp, FileText, Edit, Trash2, X, AlertCircle, ChevronLeft, ChevronRight, UsersRound, CalendarDays } from "lucide-react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin-shell";
import { WeeklyCalendar } from "@/components/weekly-calendar";
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

export const Route = createFileRoute("/admin-materi")({
  head: () => ({ meta: [
    { title: "Manajemen Materi — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Kelola materi kajian BQS Salsabilla Ruang Muslimah." },
    { property: "og:title", content: "Manajemen Materi — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Kelola materi kajian BQS Salsabilla Ruang Muslimah." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdminMateriPage,
});

type Material = {
  id: string;
  judul: string;
  kategori: string;
  ustadzah: string;
  tanggal: string;
  status: string;
  konten?: string | null;
  file_url?: string | null;
  schedule_id?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type Schedule = {
  id: string;
  judul: string;
  hari: string;
  waktu: string;
  ruang: string;
  ustadzah: string;
  status: string;
};

function AdminMateriPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin-materi' }) as { schedule_id?: string };
  const [materialsData, setMaterialsData] = useState<Material[]>([]);
  const [schedulesData, setSchedulesData] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useClickOutside(dropdownRef, () => setActiveDropdown(null), activeDropdown !== null);
  const [formData, setFormData] = useState({
    judul: "",
    kategori: "",
    ustadzah: "",
    tanggal: "",
    status: "Draft",
    konten: "",
    file_url: "",
    schedule_id: ""
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

  // Fetch materials and schedules from Supabase
  useEffect(() => {
    fetchMaterials(true);
    fetchSchedules(true);
  }, []);

  // Check for schedule_id from URL
  useEffect(() => {
    if (search.schedule_id) {
      setFormData(prev => ({
        ...prev,
        schedule_id: search.schedule_id as string
      }));
      // Auto-open modal
      setIsModalOpen(true);
    }
  }, [search.schedule_id]);

  const fetchMaterials = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      console.log('Fetching materials with fresh request...');

      const { data, error } = await supabase
        .from('materi' as any)
        .select('*')
        .is('is_deleted' as any, false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched materials:', data);
      console.log('Number of materials fetched:', data?.length || 0);

      setMaterialsData((data || []) as unknown as Material[]);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data materi');
      setAlertDialog({
        open: true,
        title: 'Gagal Memuat Data',
        description: err instanceof Error ? err.message : 'Gagal memuat data materi',
        type: 'error',
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchSchedules = async (showLoading = false) => {
    try {
      const { data, error } = await supabase
        .from('schedules' as any)
        .select('*')
        .is('is_deleted' as any, false)
        .eq('status' as any, 'Aktif' as any)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchedulesData((data || []) as unknown as Schedule[]);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    }
  };

  const handleAddMaterial = () => {
    setEditingMaterial(null);
    // Get next Friday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7; // 5 is Friday
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    const fridayDate = nextFriday.toISOString().split('T')[0] || '';

    setSelectedDate(nextFriday);
    setFormData({
      judul: "",
      kategori: "",
      ustadzah: "",
      tanggal: fridayDate,
      status: "Draft",
      konten: "",
      file_url: "",
      schedule_id: ""
    });
    setIsModalOpen(true);
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setSelectedDate(new Date(material.tanggal));
    setFormData({
      judul: material.judul,
      kategori: material.kategori,
      ustadzah: material.ustadzah,
      tanggal: material.tanggal,
      status: material.status,
      konten: material.konten || "",
      file_url: material.file_url || "",
      schedule_id: material.schedule_id || ""
    });
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0] || '';
    setFormData({ ...formData, tanggal: dateStr });
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

  const handleDeleteMaterial = async (id: string) => {
    setAlertDialog({
      open: true,
      title: 'Hapus Materi',
      description: 'Apakah Anda yakin ingin menghapus materi ini? Data yang dihapus tidak dapat dikembalikan.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          console.log('Deleting material with ID:', id);

          // Soft delete from materi by marking is_deleted as true
          const { error: materialError } = await supabase
            .from('materi' as any)
            .update({
              is_deleted: true,
              deleted_at: new Date().toISOString()
            } as any)
            .eq('id' as any, id as any);

          if (materialError) {
            console.error('Error soft deleting from materi:', materialError);
            throw materialError;
          }

          console.log('Successfully soft deleted from materi');

          // Force refresh from database to ensure UI is in sync
          await fetchMaterials(false);

          // Reset search and pagination
          setSearchQuery('');
          setCurrentPage(1);
          setActiveDropdown(null);

          console.log('UI updated successfully');

          setAlertDialog({
            open: true,
            title: 'Berhasil',
            description: 'Materi berhasil dihapus.',
            type: 'success',
          });
        } catch (err) {
          console.error('Error deleting material:', err);
          setAlertDialog({
            open: true,
            title: 'Gagal',
            description: err instanceof Error ? err.message : 'Gagal menghapus materi',
            type: 'error',
          });
        }
      }
    });
  };

  const handleSaveMaterial = async () => {
    // Validation
    if (!formData.judul.trim()) {
      setAlertDialog({
        open: true,
        title: 'Validasi',
        description: 'Judul materi harus diisi.',
        type: 'error',
      });
      return;
    }

    if (!formData.kategori.trim()) {
      setAlertDialog({
        open: true,
        title: 'Validasi',
        description: 'Kategori harus diisi.',
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
      if (editingMaterial) {
        console.log('Updating material:', editingMaterial.id);
        // Update existing material
        const updateData: any = {
          judul: formData.judul,
          kategori: formData.kategori,
          ustadzah: formData.ustadzah,
          tanggal: formData.tanggal,
          status: formData.status,
          konten: formData.konten,
          file_url: formData.file_url,
          schedule_id: formData.schedule_id || null
        };

        const { error } = await supabase
          .from('materi' as any)
          .update(updateData)
          .eq('id' as any, editingMaterial.id as any);

        if (error) throw error;

        console.log('Material updated, updating UI...');
        // Manual state update
        setMaterialsData(prev => prev.map(m =>
          m.id === editingMaterial.id ? { ...m, ...formData } : m
        ));
        setIsModalOpen(false);
        setAlertDialog({
          open: true,
          title: 'Berhasil',
          description: 'Materi berhasil diperbarui.',
          type: 'success',
        });
      } else {
        console.log('Creating new material...');
        // Create new material
        const insertData: any = {
          judul: formData.judul,
          kategori: formData.kategori,
          ustadzah: formData.ustadzah,
          tanggal: formData.tanggal,
          status: formData.status,
          konten: formData.konten,
          file_url: formData.file_url,
          schedule_id: formData.schedule_id || null
        };

        const { data, error } = await supabase
          .from('materi' as any)
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;

        console.log('Material created, updating UI...');
        // Manual state update
        setMaterialsData(prev => [data as unknown as Material, ...prev]);
        setIsModalOpen(false);
        setAlertDialog({
          open: true,
          title: 'Berhasil',
          description: 'Materi baru berhasil ditambahkan.',
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Error saving material:', err);
      setAlertDialog({
        open: true,
        title: 'Gagal',
        description: err instanceof Error ? err.message : 'Gagal menyimpan materi',
        type: 'error',
      });
    }
  };

  const filteredMaterials = materialsData.filter(material =>
    material.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.ustadzah.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMaterials = filteredMaterials.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return <AdminShell>
    <div className="mb-6 sm:mb-8">
      <Link to="/admin" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:mb-5"><ArrowLeft size={12} /> Kembali ke dashboard</Link>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Manajemen Materi</p><h1 className="page-title">Materi Kajian <span className="text-rose">✦</span></h1><p className="mt-2 text-sm text-muted-foreground">Kelola materi kajian, dokumentasi, dan catatan pembelajaran.</p></div><Button className="h-10 sm:h-11" onClick={handleAddMaterial}><Plus size={14} className="sm:size-15" /> Tambah Materi</Button></div>
    </div>

    {error && (
      <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    )}

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(330px,.95fr)]">
      <section className="overflow-hidden rounded-md border border-border bg-card shadow-soft">
        <div className="border-b border-border px-4 py-4 sm:px-7 sm:py-5"><div className="flex items-center gap-2"><BookOpenText size={14} className="text-primary sm:size-15" /><h2 className="section-title">Daftar Materi</h2></div><p className="mt-1.5 text-xs text-muted-foreground">Semua materi kajian yang tersedia untuk santriwati.</p></div>
        <div className="p-4 sm:p-7">
          <div className="mb-5 flex gap-3 sm:mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari materi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 h-10 rounded-md border border-border bg-background px-3 text-xs sm:h-11 sm:text-sm"
              />
            </div>
            <Button variant="outline" className="h-10 sm:h-11"><Filter size={14} className="sm:size-15" /> Filter</Button>
          </div>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : currentMaterials.length === 0 ? (
            <div className="text-center py-12">
              <BookOpenText size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Belum ada materi kajian</p>
              <p className="text-xs text-muted-foreground mt-1">Tambahkan materi baru untuk memulai</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto"><table className="w-full min-w-[320px] text-left sm:min-w-[620px]"><thead className="bg-secondary/60 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]"><tr><th className="px-4 py-3 sm:px-7 sm:py-4">Judul</th><th className="px-3 py-3 sm:px-5 sm:py-4">Kategori</th><th className="px-3 py-3 sm:px-5 sm:py-4">Ustadzah</th><th className="px-3 py-3 sm:px-5 sm:py-4">Tanggal</th><th className="px-3 py-3 sm:px-5 sm:py-4">Status</th><th className="px-3 py-3 sm:px-5 sm:py-4">File</th><th className="px-4 py-3 text-right sm:px-7 sm:py-4">Aksi</th></tr></thead><tbody>{currentMaterials.map((material) => <tr key={material.id} className="border-t border-border text-[11px] sm:text-sm"><td className="whitespace-nowrap px-4 py-3 font-semibold sm:px-7 sm:py-4">{material.judul}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{material.kategori}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{material.ustadzah}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{formatDate(material.tanggal)}</td><td className="px-3 py-3 sm:px-5 sm:py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold sm:px-3 sm:py-1 sm:text-[11px] ${material.status === "Terbit" ? "bg-sage-light text-primary" : "bg-amber-light text-amber-foreground"}`}>{material.status}</span></td><td className="px-3 py-3 sm:px-5 sm:py-4">{material.file_url ? <span className="text-primary text-[9px] sm:text-xs">✓ Ada</span> : <span className="text-muted-foreground text-[9px] sm:text-xs">—</span>}</td><td className="px-4 py-3 text-right sm:px-7 sm:py-4 relative"><div className="relative inline-block" ref={activeDropdown === material.id ? dropdownRef : null}><Button variant="ghost" size="sm" className="h-6 px-1.5 text-[8px] sm:h-8 sm:px-2 sm:text-xs" onClick={() => setActiveDropdown(activeDropdown === material.id ? null : material.id)}><MoreVertical size={12} /></Button>{activeDropdown === material.id && (<div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-md border border-border bg-card shadow-lg sm:w-40"><button onClick={() => { setViewingMaterial(material); setActiveDropdown(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left hover:bg-secondary">View</button><button onClick={() => handleEditMaterial(material)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left hover:bg-secondary sm:text-sm"><Edit size={12} /> Edit</button><button onClick={() => handleDeleteMaterial(material.id)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left text-destructive hover:bg-destructive/10 sm:text-sm"><Trash2 size={12} /> Hapus</button></div>)}</div></td></tr>)}</tbody></table></div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[10px] text-muted-foreground sm:text-xs">
                    Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredMaterials.length)} dari {filteredMaterials.length} materi
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
        <section className="rounded-md border border-border bg-sage-light p-5 sm:p-7"><div className="mb-4 flex h-10 w-10 items-center justify-center text-primary"><TrendingUp size={20} /></div><h2 className="font-display text-lg font-bold text-foreground sm:text-xl">Pertumbuhan materi.</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Pantau perkembangan materi kajian dan dokumentasi yang tersedia untuk santriwati.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Materi</p><p className="font-display text-2xl font-bold text-primary sm:text-3xl">{materialsData.length}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Materi Terbit</p><p className="font-display text-2xl font-bold text-primary sm:text-3xl">{materialsData.filter(m => m.status === 'Terbit').length}</p></div></div></section>
        <section className="rounded-md border border-border bg-card p-5 shadow-soft sm:p-7"><div className="mb-4 flex items-center justify-between sm:mb-5"><div><p className="eyebrow">Status Materi</p><h2 className="section-title mt-1">Bulan Ini</h2></div><span className="text-primary"><FileText size={20} /></span></div><div className="flex items-baseline gap-2"><strong className="font-display text-3xl font-bold text-primary sm:text-4xl">{materialsData.filter(m => {
          const materialDate = new Date(m.created_at || '');
          const now = new Date();
          return materialDate.getMonth() === now.getMonth() && materialDate.getFullYear() === now.getFullYear();
        }).length}</strong><span className="text-xs text-muted-foreground">materi baru</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary sm:mt-5"><div className="h-full w-[75%] rounded-full bg-primary" /></div><p className="mt-3 text-xs text-muted-foreground">{materialsData.filter(m => {
          const materialDate = new Date(m.created_at || '');
          const now = new Date();
          return materialDate.getMonth() === now.getMonth() && materialDate.getFullYear() === now.getFullYear();
        }).length} materi baru ditambahkan bulan ini</p></section>
      </div>
    </div>
    {viewingMaterial && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-2xl rounded-md border border-border bg-card p-6 shadow-panel max-h-[90vh] overflow-y-auto sm:p-8">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">{viewingMaterial.judul}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{viewingMaterial.kategori}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewingMaterial(null)}
            >
              <X size={16} />
            </Button>
          </div>

          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UsersRound size={12} className="text-primary" />
              <span>{viewingMaterial.ustadzah}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays size={12} className="text-primary" />
              <span>{formatDate(viewingMaterial.tanggal)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                viewingMaterial.status === "Terbit" ? "bg-sage-light text-primary" : "bg-amber-light text-amber-foreground"
              }`}>
                {viewingMaterial.status}
              </span>
            </div>
          </div>

          {viewingMaterial.konten && (
            <div className="mb-6">
              <h4 className="mb-2 text-sm font-bold text-foreground">Konten Materi</h4>
              <div className="rounded-md bg-secondary p-4">
                <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">{viewingMaterial.konten}</p>
              </div>
            </div>
          )}

          {viewingMaterial.file_url && (
            <div className="mb-6 rounded-md bg-sage-light p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileText size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Dokumentasi Tersedia</p>
                  <p className="text-xs text-muted-foreground">File materi</p>
                </div>
                <Button
                  size="sm"
                  className="text-xs"
                  asChild
                >
                  <a href={viewingMaterial.file_url} target="_blank" rel="noopener noreferrer">
                    Buka
                  </a>
                </Button>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setViewingMaterial(null)}
          >
            Tutup
          </Button>
        </div>
      </div>
    )}

    {isModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-lg rounded-md border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">{editingMaterial ? "Edit Materi" : "Tambah Materi"}</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              <X size={16} />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold">Judul Materi</label>
              <input
                type="text"
                value={formData.judul}
                onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
                placeholder="Masukkan judul materi"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Kategori</label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
              >
                <option value="">Pilih kategori</option>
                <option value="Al-Qur'an">Al-Qur'an</option>
                <option value="Fiqih">Fiqih</option>
                <option value="Sejarah">Sejarah</option>
                <option value="Akhlak">Akhlak</option>
                <option value="Lainnya">Lainnya</option>
              </select>
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
              <label className="mb-1 block text-xs font-semibold">Tanggal (Hari Jumat)</label>
              <WeeklyCalendar
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate || undefined}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Konten Materi</label>
              <textarea
                value={formData.konten}
                onChange={(e) => setFormData({ ...formData, konten: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm min-h-[120px]"
                placeholder="Isi materi kajian secara lengkap..."
                rows={5}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Jadwal Kajian</label>
              <select
                value={formData.schedule_id}
                onChange={(e) => setFormData({ ...formData, schedule_id: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
              >
                <option value="">Pilih jadwal kajian (opsional)</option>
                {schedulesData.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.judul} - {schedule.hari} {schedule.waktu}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Link File/Dokumentasi</label>
              <input
                type="text"
                value={formData.file_url}
                onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
                placeholder="https://docs.google.com/document/d/..."
              />
              <p className="mt-1 text-[10px] text-muted-foreground">Masukkan link Google Docs, PDF, atau dokumentasi lainnya</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
              >
                <option value="Draft">Draft</option>
                <option value="Terbit">Terbit</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button className="flex-1" onClick={handleSaveMaterial}>Simpan</Button>
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