import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, BookOpenText, CalendarDays, Search, Filter, ExternalLink, FileText, Download, X, AlertCircle, UsersRound, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SalsabillaShell } from "@/components/sakinah-shell";
import { PageHeaderSkeleton, CardSkeleton } from "@/components/ui/page-skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/materi")({
  head: () => ({ meta: [
    { title: "Materi Kajian — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Akses materi kajian, dokumentasi, dan catatan pembelajaran BQS Salsabilla Ruang Muslimah." },
    { property: "og:title", content: "Materi Kajian — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Akses materi kajian, dokumentasi, dan catatan pembelajaran BQS Salsabilla Ruang Muslimah." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: MateriPage,
});

type Material = {
  id: string;
  judul: string;
  kategori: string;
  ustadzah: string;
  tanggal: string;
  status: string;
  konten?: string | null;
  deskripsi?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  created_at?: string;
};

function MateriPage() {
  const [materialsData, setMaterialsData] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch materials from Supabase
  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      console.log('Fetching materials...');

      const { data, error } = await supabase
        .from('materi' as any)
        .select('*')
        .eq('status' as any, 'Terbit' as any)
        .is('is_deleted' as any, false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched materials:', data);

      setMaterialsData((data || []) as unknown as Material[]);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data materi');
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

  const filteredMaterials = materialsData.filter(material => {
    const matchesSearch = material.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         material.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         material.ustadzah.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || material.kategori === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Al-Qur\'an', 'Fiqih', 'Sejarah', 'Akhlak', 'Lainnya'];

  return <SalsabillaShell>
    {loading ? (
      <PageHeaderSkeleton />
    ) : (
      <div className="mb-6 flex flex-col gap-4 sm:mb-8">
        <div className="min-w-0">
          <Link to="/" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:mb-5">
            <ArrowLeft size={12} /> Kembali ke dashboard
          </Link>
          <p className="eyebrow">Materi Belajar</p>
          <h1 className="page-title">Materi Kajian <span className="text-rose">✦</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Akses materi kajian, dokumentasi, dan catatan pembelajaran.</p>
        </div>
      </div>
    )}

    {error && (
      <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    )}

    {/* Stats Overview */}
    {loading ? (
      <section className="mb-8 grid gap-4 grid-cols-2 sm:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </section>
    ) : (
      <section className="mb-8 grid gap-4 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-md border border-border bg-card p-4 shadow-soft sm:p-5">
          <div className="mb-3 flex h-8 w-8 items-center justify-center text-primary sm:h-10 sm:w-10">
            <BookOpenText size={16} strokeWidth={1.8} className="sm:size-20" />
          </div>
          <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">Total Materi</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-foreground sm:text-3xl">{materialsData.length}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-4 shadow-soft sm:p-5">
          <div className="mb-3 flex h-8 w-8 items-center justify-center text-primary sm:h-10 sm:w-10">
            <FileText size={16} strokeWidth={1.8} className="sm:size-20" />
          </div>
          <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">Dengan File</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-foreground sm:text-3xl">{materialsData.filter(m => m.file_url).length}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-4 shadow-soft sm:p-5">
          <div className="mb-3 flex h-8 w-8 items-center justify-center text-primary sm:h-10 sm:w-10">
            <UsersRound size={16} strokeWidth={1.8} className="sm:size-20" />
          </div>
          <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">Kategori</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-foreground sm:text-3xl">{categories.length}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-4 shadow-soft sm:p-5">
          <div className="mb-3 flex h-8 w-8 items-center justify-center text-primary sm:h-10 sm:w-10">
            <CheckCircle2 size={16} strokeWidth={1.8} className="sm:size-20" />
          </div>
          <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">Terbit</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-foreground sm:text-3xl">{materialsData.filter(m => m.status === 'Terbit').length}</p>
        </div>
      </section>
    )}

    {/* Search and Filter */}
    <section className="mb-6">
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
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-10 rounded-md border border-border bg-background px-3 text-xs sm:h-11 sm:text-sm"
        >
          <option value="">Semua Kategori</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
    </section>

    {/* Materials Grid */}
    {loading ? (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMaterials.map((material) => (
          <div
            key={material.id}
            className="rounded-md border border-border bg-card p-5 shadow-soft hover:border-primary/50 transition-all cursor-pointer"
            onClick={() => setSelectedMaterial(material)}
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sage-light text-primary">
                <BookOpenText size={20} />
              </div>
              <span className="inline-flex rounded-full bg-sage-light px-2.5 py-1 text-[10px] font-bold text-primary">
                {material.kategori}
              </span>
            </div>
            <h3 className="font-display text-base font-bold text-foreground">{material.judul}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{material.deskripsi || 'Materi kajian'}</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <UsersRound size={12} className="text-primary" />
                <span>{material.ustadzah}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays size={12} className="text-primary" />
                <span>{formatDate(material.tanggal)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              {material.file_url ? (
                <span className="text-[10px] text-primary">✓ File tersedia</span>
              ) : (
                <span className="text-[10px] text-muted-foreground">— Tanpa file</span>
              )}
              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[8px] sm:h-8 sm:px-2 sm:text-xs">
                Detail
              </Button>
            </div>
          </div>
        ))}
      </div>
    )}

    {filteredMaterials.length === 0 && !loading && (
      <div className="text-center py-12">
        <BookOpenText size={48} className="mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Tidak ada materi yang ditemukan</p>
      </div>
    )}

    {/* Detail Modal */}
    {selectedMaterial && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-2xl rounded-md border border-border bg-card p-6 shadow-panel max-h-[90vh] overflow-y-auto sm:p-8">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">{selectedMaterial.judul}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{selectedMaterial.kategori}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedMaterial(null)}
            >
              <X size={16} />
            </Button>
          </div>

          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UsersRound size={12} className="text-primary" />
              <span>{selectedMaterial.ustadzah}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays size={12} className="text-primary" />
              <span>{formatDate(selectedMaterial.tanggal)}</span>
            </div>
          </div>

          {selectedMaterial.deskripsi && (
            <div className="mb-6">
              <h4 className="mb-2 text-sm font-bold text-foreground">Deskripsi</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">{selectedMaterial.deskripsi}</p>
            </div>
          )}

          {selectedMaterial.konten && (
            <div className="mb-6">
              <h4 className="mb-2 text-sm font-bold text-foreground">Konten Materi</h4>
              <div className="rounded-md bg-secondary p-4">
                <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">{selectedMaterial.konten}</p>
              </div>
            </div>
          )}

          {selectedMaterial.file_url && (
            <div className="mb-6 rounded-md bg-sage-light p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileText size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Dokumentasi Tersedia</p>
                  <p className="text-xs text-muted-foreground">{selectedMaterial.file_name || 'File materi'}</p>
                </div>
                <Button
                  size="sm"
                  className="text-xs"
                  asChild
                >
                  <a href={selectedMaterial.file_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={12} className="mr-1" /> Buka
                  </a>
                </Button>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSelectedMaterial(null)}
          >
            Tutup
          </Button>
        </div>
      </div>
    )}
  </SalsabillaShell>;
}