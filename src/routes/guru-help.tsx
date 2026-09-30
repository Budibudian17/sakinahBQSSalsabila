import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ArrowLeft, BookOpen, Search, ShieldCheck, X, CalendarDays, GraduationCap, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeacherShell } from "@/components/teacher-shell";

export const Route = createFileRoute("/guru-help")({
  head: () => ({ meta: [
    { title: "Pusat Bantuan Guru — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Pusat bantuan dan dukungan untuk guru BQS Salsabilla Ruang Muslimah." },
    { property: "og:title", content: "Pusat Bantuan Guru — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Pusat bantuan dan dukungan untuk guru BQS Salsabilla Ruang Muslimah." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: GuruHelpPage,
});

const helpCategories = [
  {
    title: "Jadwal Mengajar",
    description: "Panduan mengelola jadwal mengajar dan kegiatan kajian",
    icon: CalendarDays,
    items: [
      "Cara melihat jadwal mengajar",
      "Mengubah jadwal yang ada",
      "Konfirmasi kehadiran kajian",
      "Mengatur notifikasi kajian",
    ],
  },
  {
    title: "Nilai & Hafalan",
    description: "Panduan mengelola nilai dan hafalan siswi",
    icon: GraduationCap,
    items: [
      "Cara input nilai siswi",
      "Mengupdate hafalan siswi",
      "Melihat statistik kelas",
      "Export nilai siswi",
    ],
  },
  {
    title: "Absensi Mengajar",
    description: "Panduan penggunaan sistem absensi QR",
    icon: ShieldCheck,
    items: [
      "Cara scan QR absen",
      "Lihat riwayat absensi",
      "Masalah kamera tidak berfungsi",
      "Validasi kehadiran",
    ],
  },
  {
    title: "Materi Kajian",
    description: "Panduan mengelola materi kajian",
    icon: FileText,
    items: [
      "Cara tambah materi baru",
      "Mengedit materi yang ada",
      "Mengatur status materi",
      "Share materi ke siswi",
    ],
  },
];

function GuruHelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return helpCategories;
    const query = searchQuery.toLowerCase();
    return helpCategories.filter(category => {
      const titleMatch = category.title.toLowerCase().includes(query);
      const descriptionMatch = category.description.toLowerCase().includes(query);
      const itemsMatch = category.items.some(item => item.toLowerCase().includes(query));
      return titleMatch || descriptionMatch || itemsMatch;
    });
  }, [searchQuery]);

  const filteredFAQs = useMemo(() => {
    if (!searchQuery.trim()) return [
      { q: "Bagaimana cara melihat jadwal mengajar?", a: "Buka menu Jadwal Mengajar untuk melihat semua jadwal yang ditugaskan untukmu." },
      { q: "Bagaimana cara scan QR absen?", a: "Buka menu Absensi QR, klik 'Buka Kamera untuk Scan', dan arahkan kamera ke QR yang disediakan admin." },
      { q: "Bagaimana cara input nilai siswi?", a: "Buka menu Nilai & Hafalan, pilih siswi yang ingin dinilai, lalu input nilai dan hafalan." },
      { q: "Bagaimana cara tambah materi baru?", a: "Buka menu Materi Kajian, klik 'Tambah Materi', isi form materi, lalu simpan." },
    ];
    const query = searchQuery.toLowerCase();
    return [
      { q: "Bagaimana cara melihat jadwal mengajar?", a: "Buka menu Jadwal Mengajar untuk melihat semua jadwal yang ditugaskan untukmu." },
      { q: "Bagaimana cara scan QR absen?", a: "Buka menu Absensi QR, klik 'Buka Kamera untuk Scan', dan arahkan kamera ke QR yang disediakan admin." },
      { q: "Bagaimana cara input nilai siswi?", a: "Buka menu Nilai & Hafalan, pilih siswi yang ingin dinilai, lalu input nilai dan hafalan." },
      { q: "Bagaimana cara tambah materi baru?", a: "Buka menu Materi Kajian, klik 'Tambah Materi', isi form materi, lalu simpan." },
    ].filter(faq => 
      faq.q.toLowerCase().includes(query) || faq.a.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const hasResults = filteredCategories.length > 0 || filteredFAQs.length > 0;

  return <TeacherShell>
    <div className="mb-6 sm:mb-8">
      <Link to="/guru" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:mb-5"><ArrowLeft size={12} /> Kembali ke dashboard</Link>
      <div><p className="eyebrow">Dukungan Guru</p><h1 className="page-title">Pusat Bantuan <span className="text-rose">✦</span></h1><p className="mt-2 text-sm text-muted-foreground">Panduan penggunaan untuk guru BQS Salsabilla Ruang Muslimah.</p></div>
    </div>

    {/* Search */}
    <div className="mb-8">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari panduan (contoh: jadwal, nilai, absensi...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-border bg-card px-4 py-3 pl-10 pr-10 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Hapus pencarian"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {searchQuery && !hasResults && (
        <p className="mt-3 text-xs text-muted-foreground">Tidak ditemukan hasil untuk "{searchQuery}"</p>
      )}
    </div>

    {/* Help Categories */}
    {filteredCategories.length > 0 && (
      <div className="mb-8">
        <h2 className="section-title mb-4">Topik Bantuan Guru</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.title} className="rounded-md border border-border bg-card p-5 shadow-soft hover:border-primary/50 transition-colors">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon size={20} />
                </div>
                <h3 className="font-display text-base font-bold text-foreground">{category.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{category.description}</p>
                <ul className="mt-4 space-y-2">
                  {category.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* FAQ Section */}
    {filteredFAQs.length > 0 && (
      <div className="mb-8">
        <h2 className="section-title mb-4">Pertanyaan Umum Guru</h2>
        <div className="space-y-3">
          {filteredFAQs.map((faq, index) => (
            <div key={index} className="rounded-md border border-border bg-card p-4 shadow-soft">
              <h3 className="text-sm font-bold text-foreground">{faq.q}</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </TeacherShell>;
}