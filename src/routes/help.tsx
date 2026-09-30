import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ArrowLeft, BookOpen, Mail, MessageCircle, Phone, Search, Send, ShieldCheck, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SalsabillaShell } from "@/components/sakinah-shell";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [
    { title: "Pusat Bantuan — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Pusat bantuan dan dukungan untuk pengguna aplikasi BQS Salsabilla Ruang Muslimah." },
    { property: "og:title", content: "Pusat Bantuan — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Pusat bantuan dan dukungan untuk pengguna aplikasi BQS Salsabilla Ruang Muslimah." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: HelpPage,
});

const helpCategories = [
  {
    title: "Akun & Profil",
    description: "Panduan mengelola akun, mengubah profil, dan pengaturan keamanan",
    icon: UserRound,
    items: [
      "Cara mengubah data profil",
      "Reset password lupa",
      "Mengganti foto profil",
      "Pengaturan privasi",
    ],
  },
  {
    title: "Absensi & Kehadiran",
    description: "Tata cara absensi QR, riwayat kehadiran, dan masalah teknis",
    icon: ShieldCheck,
    items: [
      "Cara scan QR code",
      "QR code tidak terdeteksi",
      "Lihat riwayat absensi",
      "Masalah kamera tidak berfungsi",
    ],
  },
  {
    title: "Jadwal & Kajian",
    description: "Informasi jadwal kajian, lokasi, dan notifikasi pengingat",
    icon: BookOpen,
    items: [
      "Cek jadwal kajian",
      "Mengaktifkan notifikasi",
      "Lokasi ruang kajian",
      "Mengubah kelas/kelompok",
    ],
  },
];

const contactMethods = [
  {
    title: "WhatsApp",
    description: "Respon cepat via chat",
    icon: MessageCircle,
    value: "+62 812-3456-7890",
    action: "Chat WhatsApp",
  },
  {
    title: "Email",
    description: "Untuk pertanyaan detail",
    icon: Mail,
    value: "bantuan@sakinah.id",
    action: "Kirim Email",
  },
  {
    title: "Telepon",
    description: "Layanan telepon bisnis",
    icon: Phone,
    value: "+62 21-1234-5678",
    action: "Hubungi",
  },
];

function HelpPage() {
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
      { q: "Bagaimana cara melakukan absensi QR?", a: "Buka menu Absen QR, lalu klik 'Buka Kamera untuk Scan'. Arahkan kamera ke QR code kajian yang tersedia di lokasi." },
      { q: "Apa yang harus dilakukan jika kamera tidak berfungsi?", a: "Pastikan izin kamera diberikan. Jika masih tidak berfungsi, gunakan opsi 'QR Saya' dan tunjukkan QR code personal ke guru." },
      { q: "Bagaimana cara melihat riwayat kehadiran?", a: "Di halaman Absen QR, scroll ke bawah untuk melihat tabel riwayat kehadiran lengkap dengan tanggal, waktu, dan status." },
      { q: "Bagaimana cara mengubah data profil?", a: "Klik foto profil di pojok kanan atas, lalu pilih 'Profil Santri' dari dropdown menu." },
    ];
    const query = searchQuery.toLowerCase();
    return [
      { q: "Bagaimana cara melakukan absensi QR?", a: "Buka menu Absen QR, lalu klik 'Buka Kamera untuk Scan'. Arahkan kamera ke QR code kajian yang tersedia di lokasi." },
      { q: "Apa yang harus dilakukan jika kamera tidak berfungsi?", a: "Pastikan izin kamera diberikan. Jika masih tidak berfungsi, gunakan opsi 'QR Saya' dan tunjukkan QR code personal ke guru." },
      { q: "Bagaimana cara melihat riwayat kehadiran?", a: "Di halaman Absen QR, scroll ke bawah untuk melihat tabel riwayat kehadiran lengkap dengan tanggal, waktu, dan status." },
      { q: "Bagaimana cara mengubah data profil?", a: "Klik foto profil di pojok kanan atas, lalu pilih 'Profil Santri' dari dropdown menu." },
    ].filter(faq => 
      faq.q.toLowerCase().includes(query) || faq.a.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const hasResults = filteredCategories.length > 0 || filteredFAQs.length > 0;

  return <SalsabillaShell>
    <div className="mb-6 sm:mb-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:mb-5"><ArrowLeft size={12} /> Kembali ke dashboard</Link>
      <div><p className="eyebrow">Dukungan Pengguna</p><h1 className="page-title">Pusat Bantuan <span className="text-rose">✦</span></h1><p className="mt-2 text-sm text-muted-foreground">Kami siap membantu kamu. Cari jawaban atau hubungi tim dukungan kami.</p></div>
    </div>

    {/* Search */}
    <div className="mb-8">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari bantuan (contoh: absensi, login, jadwal...)"
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
        <h2 className="section-title mb-4">Topik Bantuan</h2>
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
        <h2 className="section-title mb-4">Pertanyaan Umum</h2>
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

    {/* Contact Methods */}
    <div className="mb-8">
      <h2 className="section-title mb-4">Hubungi Kami</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {contactMethods.map((method) => {
          const Icon = method.icon;
          return (
            <div key={method.title} className="rounded-md border border-border bg-card p-5 shadow-soft text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sage-light text-primary">
                <Icon size={24} />
              </div>
              <h3 className="font-display text-sm font-bold text-foreground">{method.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{method.description}</p>
              <p className="mt-2 text-xs font-semibold text-primary">{method.value}</p>
              <Button variant="outline" className="mt-4 w-full text-xs" size="sm">
                {method.action}
              </Button>
            </div>
          );
        })}
      </div>
    </div>

    {/* Quick Contact Form */}
    <div className="rounded-md border border-border bg-card p-5 shadow-soft sm:p-7">
      <h2 className="section-title mb-4">Kirim Pesan</h2>
      <form className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Nama</label>
            <input
              type="text"
              placeholder="Nama lengkap"
              className="w-full rounded-md border border-border bg-secondary px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Email</label>
            <input
              type="email"
              placeholder="email@contoh.com"
              className="w-full rounded-md border border-border bg-secondary px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">Subjek</label>
          <input
            type="text"
            placeholder="Judul pesan"
            className="w-full rounded-md border border-border bg-secondary px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">Pesan</label>
          <textarea
            rows={4}
            placeholder="Jelaskan masalah atau pertanyaanmu..."
            className="w-full rounded-md border border-border bg-secondary px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
        <Button className="w-full sm:w-auto" size="default">
          <Send size={16} className="mr-2" /> Kirim Pesan
        </Button>
      </form>
    </div>
  </SalsabillaShell>;
}