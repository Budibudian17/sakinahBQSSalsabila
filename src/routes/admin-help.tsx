import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ArrowLeft, BookOpen, Search, ShieldCheck, X, Users, Settings, FileText, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin-shell";

export const Route = createFileRoute("/admin-help")({
  head: () => ({ meta: [
    { title: "Pusat Bantuan Admin — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Pusat bantuan dan dukungan untuk admin panel BQS Salsabilla Ruang Muslimah." },
    { property: "og:title", content: "Pusat Bantuan Admin — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Pusat bantuan dan dukungan untuk admin panel BQS Salsabilla Ruang Muslimah." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdminHelpPage,
});

const helpCategories = [
  {
    title: "Manajemen Siswi",
    description: "Panduan mengelola data santriwati, pendaftaran, dan profil",
    icon: Users,
    items: [
      "Cara menambah siswi baru",
      "Mengedit data siswi",
      "Mengatur email dan password siswi",
      "Mengaktifkan/menonaktifkan akun siswi",
    ],
  },
  {
    title: "Manajemen Jadwal",
    description: "Panduan mengatur jadwal kajian dan kegiatan",
    icon: CalendarDays,
    items: [
      "Cara membuat jadwal baru",
      "Mengedit jadwal yang ada",
      "Menghapus jadwal",
      "Mengatur status jadwal",
    ],
  },
  {
    title: "Manajemen Materi",
    description: "Panduan mengelola materi kajian dan dokumentasi",
    icon: BookOpen,
    items: [
      "Cara menambah materi baru",
      "Mengedit materi yang ada",
      "Menghapus materi",
      "Mengatur status materi (draft/terbit)",
    ],
  },
  {
    title: "Absensi QR",
    description: "Panduan penggunaan sistem absensi QR",
    icon: ShieldCheck,
    items: [
      "Cara generate QR kehadiran",
      "Melihat kehadiran hari ini",
      "Melihat riwayat absensi",
      "Absen diri sebagai admin",
    ],
  },
  {
    title: "Keuangan & Infaq",
    description: "Panduan mengelola keuangan dan infaq",
    icon: FileText,
    items: [
      "Cara mencatat pembayaran",
      "Melihat laporan keuangan",
      "Mengelola data infaq",
      "Export laporan keuangan",
    ],
  },
  {
    title: "Pengaturan Admin",
    description: "Panduan pengaturan panel admin",
    icon: Settings,
    items: [
      "Mengubah profil admin",
      "Pengaturan notifikasi",
      "Manajemen user admin",
      "Backup data",
    ],
  },
];

function AdminHelpPage() {
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
      { q: "Bagaimana cara menambah siswi baru?", a: "Buka menu Manajemen Siswi, klik tombol 'Tambah Siswi', isi form data lengkap termasuk email dan password, lalu klik Simpan." },
      { q: "Bagaimana cara generate QR kehadiran?", a: "Buka menu Absensi QR, pilih mode 'Generate QR'. QR yang dihasilkan adalah QR general untuk scan serentak oleh siswi dan guru." },
      { q: "Bagaimana cara melihat kehadiran hari ini?", a: "Di halaman Absensi QR, scroll ke bawah ke section 'Kehadiran Hari Ini' untuk melihat daftar siswi yang sudah hadir hari ini." },
      { q: "Bagaimana cara mengedit jadwal kajian?", a: "Buka menu Jadwal Kajian, klik tombol titik tiga pada jadwal yang ingin diedit, pilih 'Edit', lalu ubah data yang diperlukan dan simpan." },
      { q: "Bagaimana cara menambah materi baru?", a: "Buka menu Manajemen Materi, klik tombol 'Tambah Materi', isi judul, kategori, ustadzah, dan lainnya, lalu simpan." },
      { q: "Bagaimana cara mengatur email siswi?", a: "Di menu Manajemen Siswi, edit data siswi dan masukkan email yang akan digunakan untuk login. Password bisa diatur saat pendaftaran atau direset nanti." },
    ];
    const query = searchQuery.toLowerCase();
    return [
      { q: "Bagaimana cara menambah siswi baru?", a: "Buka menu Manajemen Siswi, klik tombol 'Tambah Siswi', isi form data lengkap termasuk email dan password, lalu klik Simpan." },
      { q: "Bagaimana cara generate QR kehadiran?", a: "Buka menu Absensi QR, pilih mode 'Generate QR'. QR yang dihasilkan adalah QR general untuk scan serentak oleh siswi dan guru." },
      { q: "Bagaimana cara melihat kehadiran hari ini?", a: "Di halaman Absensi QR, scroll ke bawah ke section 'Kehadiran Hari Ini' untuk melihat daftar siswi yang sudah hadir hari ini." },
      { q: "Bagaimana cara mengedit jadwal kajian?", a: "Buka menu Jadwal Kajian, klik tombol titik tiga pada jadwal yang ingin diedit, pilih 'Edit', lalu ubah data yang diperlukan dan simpan." },
      { q: "Bagaimana cara menambah materi baru?", a: "Buka menu Manajemen Materi, klik tombol 'Tambah Materi', isi judul, kategori, ustadzah, dan lainnya, lalu simpan." },
      { q: "Bagaimana cara mengatur email siswi?", a: "Di menu Manajemen Siswi, edit data siswi dan masukkan email yang akan digunakan untuk login. Password bisa diatur saat pendaftaran atau direset nanti." },
    ].filter(faq => 
      faq.q.toLowerCase().includes(query) || faq.a.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const hasResults = filteredCategories.length > 0 || filteredFAQs.length > 0;

  return <AdminShell>
    <div className="mb-6 sm:mb-8">
      <Link to="/admin" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:mb-5"><ArrowLeft size={12} /> Kembali ke dashboard</Link>
      <div><p className="eyebrow">Dukungan Admin</p><h1 className="page-title">Pusat Bantuan <span className="text-rose">✦</span></h1><p className="mt-2 text-sm text-muted-foreground">Panduan penggunaan untuk admin panel BQS Salsabilla Ruang Muslimah.</p></div>
    </div>

    {/* Search */}
    <div className="mb-8">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari panduan (contoh: siswi, jadwal, materi...)"
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
        <h2 className="section-title mb-4">Topik Bantuan Admin</h2>
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
        <h2 className="section-title mb-4">Pertanyaan Umum Admin</h2>
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
  </AdminShell>;
}