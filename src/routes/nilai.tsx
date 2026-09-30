import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, BookOpenText, Award, TrendingUp, ChevronRight, Check, Circle, PlayCircle, Target, Calendar, Star, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SalsabillaShell } from "@/components/sakinah-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/nilai")({
  head: () => ({ meta: [
    { title: "Nilai & Hafalan — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Pantau progress hafalan Al-Qur'an dan nilai kajian santriwati BQS Salsabilla." },
    { property: "og:title", content: "Nilai & Hafalan — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Pantau progress hafalan Al-Qur'an dan nilai kajian santriwati BQS Salsabilla." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: NilaiPage,
});

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
  created_at: string;
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
  created_at: string;
};

function NilaiPage() {
  const [selectedMemorization, setSelectedMemorization] = useState<Hafalan | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<Nilai | null>(null);
  const [hafalanData, setHafalanData] = useState<Hafalan[]>([]);
  const [nilaiData, setNilaiData] = useState<Nilai[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch hafalan data
      const { data: hafalan, error: hafalanError } = await supabase
        .from('hafalan' as any)
        .select('*')
        .eq('user_id' as any, user.id)
        .order('created_at', { ascending: false });

      if (hafalanError) throw hafalanError;
      setHafalanData((hafalan || []) as Hafalan[]);

      // Fetch nilai data
      const { data: nilai, error: nilaiError } = await supabase
        .from('nilai' as any)
        .select('*')
        .eq('user_id' as any, user.id)
        .order('created_at', { ascending: false });

      if (nilaiError) throw nilaiError;
      setNilaiData((nilai || []) as Nilai[]);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const completedSurah = hafalanData.filter(m => m.status === "completed").length;
  const inProgressSurah = hafalanData.filter(m => m.status === "in_progress").length;
  const totalSurah = hafalanData.length;
  const progressPercentage = totalSurah > 0 ? Math.round((completedSurah / totalSurah) * 100) : 0;

  const averageScore = nilaiData.length > 0
    ? Math.round(nilaiData.reduce((sum, n) => sum + n.score, 0) / nilaiData.length)
    : 0;

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

  return <SalsabillaShell>
    <div className="mb-6 flex flex-col gap-4 sm:mb-8">
      <div className="min-w-0">
        <Link to="/" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:mb-5">
          <ArrowLeft size={12} /> Kembali ke dashboard
        </Link>
        <p className="eyebrow">Progress Belajar</p>
        <h1 className="page-title">Nilai & Hafalan <span className="text-rose">✦</span></h1>
        <p className="mt-2 text-sm text-muted-foreground">Pantau perkembangan hafalan dan nilai kajianmu.</p>
      </div>
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

    {/* Overview Stats */}
    <section className="mb-8 grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-md border border-border bg-card p-4 shadow-soft sm:p-5">
        <div className="mb-3 flex h-8 w-8 items-center justify-center text-primary sm:h-10 sm:w-10">
          <BookOpenText size={16} strokeWidth={1.8} className="sm:size-20" />
        </div>
        <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">Total Surah</p>
        <p className="mt-1.5 font-display text-2xl font-bold text-foreground sm:text-3xl">{totalSurah}</p>
        <p className="mt-0.5 text-[9px] text-muted-foreground sm:mt-1 sm:text-[11px]">surah ditargetkan</p>
      </div>
      <div className="rounded-md border border-border bg-card p-4 shadow-soft sm:p-5">
        <div className="mb-3 flex h-8 w-8 items-center justify-center text-primary sm:h-10 sm:w-10">
          <Check size={16} strokeWidth={1.8} className="sm:size-20" />
        </div>
        <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">Selesai Hafal</p>
        <p className="mt-1.5 font-display text-2xl font-bold text-foreground sm:text-3xl">{completedSurah}</p>
        <p className="mt-0.5 text-[9px] text-muted-foreground sm:mt-1 sm:text-[11px]">surah lancar</p>
      </div>
      <div className="rounded-md border border-border bg-card p-4 shadow-soft sm:p-5">
        <div className="mb-3 flex h-8 w-8 items-center justify-center text-amber-foreground sm:h-10 sm:w-10">
          <PlayCircle size={16} strokeWidth={1.8} className="sm:size-20" />
        </div>
        <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">Sedang Hafal</p>
        <p className="mt-1.5 font-display text-2xl font-bold text-foreground sm:text-3xl">{inProgressSurah}</p>
        <p className="mt-0.5 text-[9px] text-muted-foreground sm:mt-1 sm:text-[11px]">surah berjalan</p>
      </div>
      <div className="rounded-md border border-border bg-card p-4 shadow-soft sm:p-5">
        <div className="mb-3 flex h-8 w-8 items-center justify-center text-rose-foreground sm:h-10 sm:w-10">
          <Award size={16} strokeWidth={1.8} className="sm:size-20" />
        </div>
        <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">Rata-rata Nilai</p>
        <p className="mt-1.5 font-display text-2xl font-bold text-foreground sm:text-3xl">{averageScore}</p>
        <p className="mt-0.5 text-[9px] text-muted-foreground sm:mt-1 sm:text-[11px]">dari 100</p>
      </div>
    </section>

    {/* Progress Overview */}
    <section className="mb-8 rounded-md border border-border bg-sage-light p-5 sm:p-7">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center text-primary sm:h-12 sm:w-12">
          <Target size={18} strokeWidth={1.8} className="sm:size-22" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-base font-bold text-foreground sm:text-lg">Progress Hafalan</h3>
          <p className="text-xs text-muted-foreground">{completedSurah} dari {totalSurah} surah selesai dihafal</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-bold text-primary sm:text-3xl">{progressPercentage}%</p>
        </div>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-secondary sm:h-4">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
      </div>
    </section>

    {/* Hafalan Section */}
    <section className="mb-8">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Hafalan Al-Qur'an</p>
          <h2 className="section-title mt-1">Target Surah Juz 30</h2>
        </div>
        <span className="text-xs text-muted-foreground">{totalSurah} surah ditargetkan</span>
      </div>
      <div className="overflow-hidden rounded-md border border-border bg-card shadow-soft">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[500px] text-left sm:min-w-[720px]">
            <thead className="bg-secondary/60 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]">
              <tr>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3">Surah</th>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3">Ayat</th>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3">Status</th>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3">Nilai</th>
                <th className="px-3 py-2.5 text-right sm:px-4 sm:py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {hafalanData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground text-[10px] sm:text-xs">
                    Belum ada data hafalan
                  </td>
                </tr>
              ) : (
                hafalanData.map((item) => (
                  <tr key={item.id} className="border-t border-border text-[10px] sm:text-sm">
                    <td className="whitespace-nowrap px-3 py-2.5 sm:px-4 sm:py-3">
                      <p className="font-bold text-foreground text-[9px] sm:text-xs">{item.surah}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground text-[9px] sm:px-4 sm:py-3 sm:text-xs">{item.ayat}</td>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 sm:px-4 sm:py-3">
                      {item.grade ? (
                        <span className={`font-bold text-[9px] sm:text-xs ${getGradeColor(item.grade)}`}>
                          {item.grade}
                        </span>
                      ) : (
                        <span className="text-[9px] text-muted-foreground sm:text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right sm:px-4 sm:py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-[8px] sm:h-8 sm:px-2 sm:text-xs"
                        onClick={() => setSelectedMemorization(item)}
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    {/* Grades Section */}
    <section className="mb-8">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Penilaian Kajian</p>
          <h2 className="section-title mt-1">Nilai Terbaru</h2>
        </div>
        <span className="text-xs text-muted-foreground">{nilaiData.length} penilaian</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {nilaiData.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-muted-foreground text-[10px] sm:text-xs">
            Belum ada data nilai
          </div>
        ) : (
          nilaiData.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-border bg-card p-4 shadow-soft hover:border-primary/50 transition-colors sm:p-5"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center sm:h-10 sm:w-10 ${
                    item.category === "Al-Qur'an"
                      ? "text-primary"
                      : item.category === "Fiqih"
                        ? "text-rose-foreground"
                        : item.category === "Sejarah Islam"
                          ? "text-amber-foreground"
                          : "text-lavender-foreground"
                  }`}>
                    <BookOpenText size={16} strokeWidth={1.8} className="sm:size-20" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-foreground sm:text-base">{item.subject}</h3>
                    <p className="text-[10px] text-muted-foreground sm:text-xs">{item.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-display text-lg font-bold ${getGradeColor(item.grade)} sm:text-xl`}>{item.grade}</p>
                  <p className="text-[9px] text-muted-foreground sm:text-[10px]">{item.score}/100</p>
                </div>
              </div>
              <div className="space-y-1.5 text-[10px] text-muted-foreground sm:text-xs">
                <div className="flex items-center gap-2">
                  <Calendar size={12} strokeWidth={1.8} className="text-primary" />
                  <span>{formatDate(item.assessed_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={12} strokeWidth={1.8} className="text-primary" />
                  <span>{item.ustadzah || '—'}</span>
                </div>
              </div>
              <div className="mt-3 border-t border-border pt-3">
                <p className="text-[9px] text-muted-foreground sm:text-xs">{item.notes || '—'}</p>
              </div>
              <Button
                variant="outline"
                className="mt-3 w-full text-[10px] sm:text-xs"
                onClick={() => setSelectedGrade(item)}
              >
                Lihat Detail
                <ChevronRight size={12} className="ml-auto" />
              </Button>
            </div>
          ))
        )}
      </div>
    </section>

    {/* Memorization Detail Modal */}
    {selectedMemorization && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-md border border-border bg-card p-6 shadow-panel sm:p-8">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">Hafalan {selectedMemorization.surah}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Ayat {selectedMemorization.ayat}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedMemorization(null)}
            >
              <X size={16} />
            </Button>
          </div>
          
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              {getStatusBadge(selectedMemorization.status)}
            </div>
            {selectedMemorization.assessed_at && (
              <div className="flex items-center gap-2">
                <Calendar size={12} strokeWidth={1.8} className="text-primary" />
                <span className="text-xs font-semibold text-foreground">{formatDate(selectedMemorization.assessed_at)}</span>
              </div>
            )}
            {selectedMemorization.ustadzah && (
              <div className="flex items-center gap-2">
                <Star size={12} strokeWidth={1.8} className="text-primary" />
                <span className="text-xs font-semibold text-foreground">{selectedMemorization.ustadzah}</span>
              </div>
            )}
            {selectedMemorization.grade && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Nilai</span>
                <span className={`text-xs font-bold ${getGradeColor(selectedMemorization.grade)}`}>{selectedMemorization.grade}</span>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h4 className="mb-2 text-sm font-bold text-foreground">Catatan</h4>
            <p className="text-xs leading-relaxed text-muted-foreground">{selectedMemorization.notes || '—'}</p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSelectedMemorization(null)}
          >
            Tutup
          </Button>
        </div>
      </div>
    )}

    {/* Grade Detail Modal */}
    {selectedGrade && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-md border border-border bg-card p-6 shadow-panel sm:p-8">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">{selectedGrade.subject}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{selectedGrade.category}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedGrade(null)}
            >
              <X size={16} />
            </Button>
          </div>
          
          <div className="mb-6 flex items-center justify-between rounded-md bg-secondary p-4">
            <div>
              <p className="text-xs text-muted-foreground">Nilai Akhir</p>
              <p className={`font-display text-2xl font-bold ${getGradeColor(selectedGrade.grade)}`}>{selectedGrade.grade}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Skor</p>
              <p className="font-display text-2xl font-bold text-foreground">{selectedGrade.score}/100</p>
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar size={12} strokeWidth={1.8} className="text-primary" />
              <span className="text-xs font-semibold text-foreground">{formatDate(selectedGrade.assessed_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star size={12} strokeWidth={1.8} className="text-primary" />
              <span className="text-xs font-semibold text-foreground">{selectedGrade.ustadzah || '—'}</span>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="mb-2 text-sm font-bold text-foreground">Catatan Penilaian</h4>
            <p className="text-xs leading-relaxed text-muted-foreground">{selectedGrade.notes || '—'}</p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSelectedGrade(null)}
          >
            Tutup
          </Button>
        </div>
      </div>
    )}
      </>
    )}
  </SalsabillaShell>;
}
