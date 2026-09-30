import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, BookOpenText, Search, Filter, CheckCircle2, TrendingUp, Users, GraduationCap, MoreVertical, Edit, Eye, AlertCircle, ChevronLeft, ChevronRight, X, Calendar, Star, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TeacherShell } from "@/components/teacher-shell";
import { useState, useRef, useEffect } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/guru-nilai")({
  head: () => ({ meta: [
    { title: "Nilai & Hafalan Guru — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Kelola nilai dan hafalan siswi BQS Salsabilla Ruang Muslimah." },
    { property: "og:title", content: "Nilai & Hafalan Guru — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Kelola nilai dan hafalan siswi BQS Salsabilla Ruang Muslimah." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: GuruNilaiPage,
});

type Profile = {
  id: string;
  full_name: string;
  email: string;
  pendidikan?: string;
  rt?: string;
};

type Hafalan = {
  id: string;
  user_id: string;
  surah: string;
  ayat: string;
  status: 'completed' | 'in_progress' | 'not_started';
  grade: string | null;
  notes: string | null;
  ustadzah: string | null;
  assessed_at: string | null;
};

type Nilai = {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  grade: string;
  score: number;
  notes: string | null;
  ustadzah: string | null;
  assessed_at: string | null;
};

type StudentWithGrades = Profile & {
  hafalanData: Hafalan[];
  nilaiData: Nilai[];
  averageScore: number;
  completedHafalan: number;
};

function GuruNilaiPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'hafalan' | 'nilai' | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'add'>('view');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithGrades | null>(null);
  const [selectedItem, setSelectedItem] = useState<Hafalan | Nilai | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [studentsData, setStudentsData] = useState<StudentWithGrades[]>([]);

  // Form state for adding new data
  const [formData, setFormData] = useState({
    surah: "",
    ayat: "",
    status: "not_started" as 'completed' | 'in_progress' | 'not_started',
    grade: "",
    notes: "",
    subject: "",
    category: "",
    score: 0
  });

  // Close dropdown when clicking outside
  useClickOutside(dropdownRef, () => setActiveDropdown(null), activeDropdown !== null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles' as any)
        .select('*')
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;

      // Fetch user_ids with santri role
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles' as any)
        .select('user_id, role')
        .eq('role' as any, 'santri' as any);

      if (rolesError) throw rolesError;

      // Get list of santri user_ids
      const santriUserIds = new Set((userRoles || []).map((ur: any) => ur.user_id));

      // Filter profiles to only include santri
      const santriProfiles = (profiles || []).filter((profile: any) =>
        santriUserIds.has(profile.id)
      );

      // Fetch hafalan data
      const { data: hafalanData, error: hafalanError } = await supabase
        .from('hafalan' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (hafalanError) throw hafalanError;

      // Fetch nilai data
      const { data: nilaiData, error: nilaiError } = await supabase
        .from('nilai' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (nilaiError) throw nilaiError;

      // Combine data
      const studentsWithGrades = (santriProfiles as unknown as Profile[]).map((profile: Profile) => {
        const studentHafalan = (hafalanData as unknown as Hafalan[]).filter((h: Hafalan) => h.user_id === profile.id);
        const studentNilai = (nilaiData as unknown as Nilai[]).filter((n: Nilai) => n.user_id === profile.id);

        const averageScore = studentNilai.length > 0
          ? Math.round(studentNilai.reduce((sum, n) => sum + n.score, 0) / studentNilai.length)
          : 0;

        const completedHafalan = studentHafalan.filter((h: Hafalan) => h.status === 'completed').length;

        return {
          ...profile,
          hafalanData: studentHafalan,
          nilaiData: studentNilai,
          averageScore,
          completedHafalan,
        };
      }) as StudentWithGrades[];

      setStudentsData(studentsWithGrades);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = studentsData.filter(student =>
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.pendidikan || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  const handleOpenModal = (student: StudentWithGrades, type: 'hafalan' | 'nilai', item?: Hafalan | Nilai) => {
    setSelectedStudent(student);
    setModalType(type);
    setSelectedItem(item || null);
    setModalMode(item ? 'view' : 'add');
    setFormData({
      surah: "",
      ayat: "",
      status: "not_started",
      grade: "",
      notes: "",
      subject: "",
      category: "",
      score: 0
    });
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleSave = async () => {
    if (!selectedStudent) return;

    try {
      if (modalType === 'hafalan') {
        const { error } = await supabase
          .from('hafalan' as any)
          .insert({
            user_id: selectedStudent.id,
            surah: formData.surah,
            ayat: formData.ayat,
            status: formData.status,
            grade: formData.grade || null,
            notes: formData.notes || null,
            assessed_at: new Date().toISOString()
          } as any);

        if (error) throw error;
      } else if (modalType === 'nilai') {
        const grade = formData.score >= 90 ? 'A' : formData.score >= 80 ? 'B' : formData.score >= 70 ? 'C' : 'D';

        const { error } = await supabase
          .from('nilai' as any)
          .insert({
            user_id: selectedStudent.id,
            subject: formData.subject,
            category: formData.category,
            grade: grade,
            score: formData.score,
            notes: formData.notes || null,
            assessed_at: new Date().toISOString()
          } as any);

        if (error) throw error;
      }

      // Refresh data
      await fetchData();
      setIsModalOpen(false);
      setFormData({
        surah: "",
        ayat: "",
        status: "not_started",
        grade: "",
        notes: "",
        subject: "",
        category: "",
        score: 0
      });
    } catch (err) {
      console.error('Error saving data:', err);
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="inline-flex rounded-full bg-sage-light px-2 py-0.5 text-[8px] font-bold text-primary sm:px-2.5 sm:py-1 sm:text-[10px]">
          Selesai
        </span>;
      case "in_progress":
        return <span className="inline-flex rounded-full bg-amber-light px-2 py-0.5 text-[8px] font-bold text-amber-foreground sm:px-2.5 sm:py-1 sm:text-[10px]">
          Berjalan
        </span>;
      default:
        return <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[8px] font-bold text-muted-foreground sm:px-2.5 sm:py-1 sm:text-[10px]">
          Belum
        </span>;
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-primary";
    if (grade.startsWith("B")) return "text-amber-foreground";
    return "text-rose-foreground";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const overallAverage = studentsData.length > 0
    ? Math.round(studentsData.reduce((sum, s) => sum + s.averageScore, 0) / studentsData.length)
    : 0;

  const passingStudents = studentsData.filter(s => s.averageScore >= 70).length;
  const passingPercentage = studentsData.length > 0
    ? Math.round((passingStudents / studentsData.length) * 100)
    : 0;

  return <TeacherShell>
    <div className="mb-6 sm:mb-8">
      <Link to="/guru" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:mb-5"><ArrowLeft size={12} /> Kembali ke dashboard</Link>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Nilai & Hafalan</p><h1 className="page-title">Kelola Nilai <span className="text-rose">✦</span></h1><p className="mt-2 text-sm text-muted-foreground">Kelola nilai dan hafalan siswi dalam kajianmu.</p></div></div>
    </div>

    {error && (
      <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    )}

    {loading ? (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    ) : (
      <>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(330px,.95fr)]">
          <section className="overflow-hidden rounded-md border border-border bg-card shadow-soft">
            <div className="border-b border-border px-4 py-4 sm:px-7 sm:py-5"><div className="flex items-center gap-2"><BookOpenText size={14} className="text-primary sm:size-15" /><h2 className="section-title">Daftar Siswi</h2></div><p className="mt-1.5 text-xs text-muted-foreground">Siswi yang ada dalam kelas-kelasmu.</p></div>
            <div className="p-4 sm:p-7">
              <div className="mb-5 flex gap-3 sm:mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cari siswi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 h-10 rounded-md border border-border bg-background px-3 text-xs sm:h-11 sm:text-sm"
                  />
                </div>
                <Button variant="outline" className="h-10 sm:h-11"><Filter size={14} className="sm:size-15" /> Filter</Button>
              </div>
              <div className="overflow-x-auto"><table className="w-full min-w-[320px] text-left sm:min-w-[620px]"><thead className="bg-secondary/60 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]"><tr><th className="px-4 py-3 sm:px-7 sm:py-4">Nama</th><th className="px-3 py-3 sm:px-5 sm:py-4">Pendidikan</th><th className="px-3 py-3 sm:px-5 sm:py-4">Rata-rata</th><th className="px-3 py-3 sm:px-5 sm:py-4">Hafalan</th><th className="px-3 py-3 sm:px-5 sm:py-4">Aksi</th></tr></thead><tbody>{currentStudents.length === 0 ? (<tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-[10px] sm:text-xs">Tidak ada data siswi</td></tr>) : currentStudents.map((student) => <tr key={student.id} className="border-t border-border text-[11px] sm:text-sm"><td className="whitespace-nowrap px-4 py-3 font-semibold sm:px-7 sm:py-4">{student.full_name}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{student.pendidikan || '-'}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{student.averageScore || '-'}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{student.completedHafalan} surah</td><td className="px-3 py-3 sm:px-5 sm:py-4"><div className="relative" ref={activeDropdown === student.id ? dropdownRef : null}><button onClick={() => setActiveDropdown(activeDropdown === student.id ? null : student.id)} className="p-1.5 rounded-md hover:bg-secondary/60"><MoreVertical size={14} /></button>{activeDropdown === student.id && (<div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-md border border-border bg-card shadow-lg p-1"><button onClick={() => handleOpenModal(student, 'hafalan')} className="w-full text-left px-3 py-2 text-xs hover:bg-secondary/60 rounded-md flex items-center gap-2"><BookOpenText size={12} /> Input Hafalan</button><button onClick={() => handleOpenModal(student, 'nilai')} className="w-full text-left px-3 py-2 text-xs hover:bg-secondary/60 rounded-md flex items-center gap-2"><GraduationCap size={12} /> Input Nilai</button></div>)}</div></td></tr>)}</tbody></table></div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[10px] text-muted-foreground sm:text-xs">
                    Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredStudents.length)} dari {filteredStudents.length} siswi
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
            </div>
          </section>
          <div className="space-y-5 sm:space-y-6">
            <section className="rounded-md border border-border bg-sage-light p-5 sm:p-7"><div className="mb-4 flex h-10 w-10 items-center justify-center text-primary"><TrendingUp size={20} /></div><h2 className="font-display text-lg font-bold text-foreground sm:text-xl">Statistik Nilai</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Pantau performa akademik siswi dalam kajianmu.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rata-rata Nilai</p><p className="font-display text-2xl font-bold text-primary sm:text-3xl">{overallAverage}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Siswi Lulus</p><p className="font-display text-2xl font-bold text-primary sm:text-3xl">{passingPercentage}%</p></div></div></section>
            <section className="rounded-md border border-border bg-card p-5 shadow-soft sm:p-7"><div className="mb-4 flex items-center justify-between sm:mb-5"><div><p className="eyebrow">Total Siswi</p><h2 className="section-title mt-1">{studentsData.length}</h2></div><span className="text-primary"><Users size={20} /></span></div><div className="flex items-baseline gap-2"><strong className="font-display text-3xl font-bold text-primary sm:text-4xl">{studentsData.length}</strong><span className="text-xs text-muted-foreground">siswi terdaftar</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary sm:mt-5"><div className="h-full w-[100%] rounded-full bg-primary" /></div><p className="mt-3 text-xs text-muted-foreground">Semua siswi aktif</p></section>
          </div>
        </div>
      </>
    )}

    {isModalOpen && selectedStudent && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-md border border-border bg-card p-6 shadow-panel sm:p-8">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">
                {modalMode === 'add' ? `Tambah ${modalType === 'hafalan' ? 'Hafalan' : 'Nilai'}` : `${modalType === 'hafalan' ? 'Hafalan' : 'Nilai'}`} - {selectedStudent.full_name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{selectedStudent.pendidikan || '-'}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsModalOpen(false)}
            >
              <X size={16} />
            </Button>
          </div>

          {modalMode === 'add' ? (
            <>
              <div className="space-y-4">
                {modalType === 'hafalan' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="surah">Surah</Label>
                      <Input
                        id="surah"
                        value={formData.surah}
                        onChange={(e) => setFormData({ ...formData, surah: e.target.value })}
                        placeholder="Contoh: Al-Fatihah"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ayat">Ayat</Label>
                      <Input
                        id="ayat"
                        value={formData.ayat}
                        onChange={(e) => setFormData({ ...formData, ayat: e.target.value })}
                        placeholder="Contoh: 1-7"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                      >
                        <option value="not_started">Belum</option>
                        <option value="in_progress">Berjalan</option>
                        <option value="completed">Selesai</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grade">Nilai (Opsional)</Label>
                      <Input
                        id="grade"
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        placeholder="Contoh: A, B, C"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Catatan (Opsional)</Label>
                      <Input
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Catatan tambahan"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Mata Pelajaran</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Contoh: Fiqih"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Kategori</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Contoh: Ujian Bulanan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="score">Skor (0-100)</Label>
                      <Input
                        id="score"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.score}
                        onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
                        placeholder="0-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Catatan (Opsional)</Label>
                      <Input
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Catatan tambahan"
                      />
                    </div>
                  </>
                )}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setModalMode('view');
                      setFormData({
                        surah: "",
                        ayat: "",
                        status: "not_started",
                        grade: "",
                        notes: "",
                        subject: "",
                        category: "",
                        score: 0
                      });
                    }}
                  >
                    Batal
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSave}
                  >
                    Simpan
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 max-h-80 overflow-y-auto">
                {modalType === 'hafalan' ? (
                  selectedStudent.hafalanData.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm mb-4">Belum ada data hafalan</p>
                      <Button
                        size="sm"
                        onClick={() => setModalMode('add')}
                      >
                        <Plus size={14} className="mr-2" /> Tambah Hafalan
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedStudent.hafalanData.map((hafalan) => (
                        <div key={hafalan.id} className="rounded-md border border-border bg-secondary/30 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm">{hafalan.surah}</span>
                            {getStatusBadge(hafalan.status)}
                          </div>
                          <p className="text-xs text-muted-foreground">Ayat: {hafalan.ayat}</p>
                          {hafalan.grade && (
                            <p className="text-xs font-bold mt-1">Nilai: <span className={getGradeColor(hafalan.grade)}>{hafalan.grade}</span></p>
                          )}
                          {hafalan.assessed_at && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Calendar size={12} />
                              <span>{formatDate(hafalan.assessed_at)}</span>
                            </div>
                          )}
                          {hafalan.notes && (
                            <p className="text-xs text-muted-foreground mt-2">{hafalan.notes}</p>
                          )}
                        </div>
                      ))}
                      <Button
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => setModalMode('add')}
                      >
                        <Plus size={14} className="mr-2" /> Tambah Hafalan Baru
                      </Button>
                    </div>
                  )
                ) : (
                  selectedStudent.nilaiData.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm mb-4">Belum ada data nilai</p>
                      <Button
                        size="sm"
                        onClick={() => setModalMode('add')}
                      >
                        <Plus size={14} className="mr-2" /> Tambah Nilai
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedStudent.nilaiData.map((nilai) => (
                        <div key={nilai.id} className="rounded-md border border-border bg-secondary/30 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm">{nilai.subject}</span>
                            <span className={`font-bold text-sm ${getGradeColor(nilai.grade)}`}>{nilai.grade}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{nilai.category}</p>
                          <p className="text-xs font-bold mt-1">Skor: {nilai.score}/100</p>
                          {nilai.assessed_at && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Calendar size={12} />
                              <span>{formatDate(nilai.assessed_at)}</span>
                            </div>
                          )}
                          {nilai.notes && (
                            <p className="text-xs text-muted-foreground mt-2">{nilai.notes}</p>
                          )}
                        </div>
                      ))}
                      <Button
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => setModalMode('add')}
                      >
                        <Plus size={14} className="mr-2" /> Tambah Nilai Baru
                      </Button>
                    </div>
                  )
                )}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsModalOpen(false)}
              >
                Tutup
              </Button>
            </>
          )}
        </div>
      </div>
    )}
  </TeacherShell>;
}
