import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Wallet, Plus, Search, Filter, CreditCard, TrendingUp, Calendar, CheckCircle2, AlertCircle, X, Info } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BQS SalsabillaShell } from "@/components/sakinah-shell";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/page-skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/keuangan")({
  head: () => ({ meta: [
    { title: "Keuangan — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Kelola keuangan dan pembayaran santriwati BQS Salsabilla Ruang Muslimah." },
    { property: "og:title", content: "Keuangan — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Kelola keuangan dan pembayaran santriwati BQS Salsabilla Ruang Muslimah." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: KeuanganPage,
});

type Transaction = {
  id: string;
  jenis_transaksi: string;
  kategori: string;
  nominal: number;
  deskripsi?: string | null;
  tanggal: string;
  status: string;
  created_at?: string;
};

function KeuanganPage() {
  const [transactionsData, setTransactionsData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [financialSettings, setFinancialSettings] = useState({
    uang_kas_mingguan: '10000',
    uang_kas_bulanan: '40000'
  });

  const [formData, setFormData] = useState({
    jenis_transaksi: "masuk",
    kategori: "uang kas",
    nominal: "",
    deskripsi: "",
    tanggal: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTransactions();
    fetchFinancialSettings();
  }, []);

  const fetchFinancialSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_settings' as any)
        .select('*');

      if (error) throw error;

      const settingsData = (data || []) as any[];
      const mingguan = settingsData.find((s: any) => s.setting_name === 'uang_kas_mingguan');
      const bulanan = settingsData.find((s: any) => s.setting_name === 'uang_kas_bulanan');
      
      setFinancialSettings({
        uang_kas_mingguan: mingguan?.setting_value || '10000',
        uang_kas_bulanan: bulanan?.setting_value || '40000'
      });
    } catch (err) {
      console.error('Error fetching financial settings:', err);
      // Use default values if fetch fails
      setFinancialSettings({
        uang_kas_mingguan: '10000',
        uang_kas_bulanan: '40000'
      });
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Anda harus login untuk melihat data keuangan');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('keuangan' as any)
        .select('*')
        .eq('user_id' as any, user.id as any)
        .is('is_deleted' as any, false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactionsData((data || []) as unknown as Transaction[]);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data keuangan');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!formData.nominal.trim()) {
      setError('Nominal harus diisi');
      return;
    }

    // Validate nominal against financial settings for uang kas
    if (formData.kategori === 'uang kas') {
      const nominal = parseFloat(formData.nominal);
      const mingguan = parseFloat(financialSettings.uang_kas_mingguan);
      const bulanan = parseFloat(financialSettings.uang_kas_bulanan);
      
      if (nominal !== mingguan && nominal !== bulanan) {
        setError(`Nominal uang kas harus ${formatCurrency(mingguan)} (mingguan) atau ${formatCurrency(bulanan)} (bulanan)`);
        return;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Anda harus login untuk menambah transaksi');
        return;
      }

      const insertData: any = {
        user_id: user.id,
        jenis_transaksi: formData.jenis_transaksi,
        kategori: formData.kategori,
        nominal: parseFloat(formData.nominal),
        deskripsi: formData.deskripsi,
        tanggal: formData.tanggal,
        status: 'Pending'
      };

      const { error } = await supabase
        .from('keuangan' as any)
        .insert(insertData);

      if (error) throw error;

      setSuccessMessage('Transaksi berhasil ditambahkan. Menunggu verifikasi admin.');
      setIsModalOpen(false);
      setFormData({
        jenis_transaksi: "masuk",
        kategori: "uang kas",
        nominal: "",
        deskripsi: "",
        tanggal: new Date().toISOString().split('T')[0]
      });
      
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchTransactions();
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError(err instanceof Error ? err.message : 'Gagal menambah transaksi');
    }
  };

  const filteredTransactions = transactionsData.filter(transaction =>
    transaction.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
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

  return <BQS SalsabillaShell>
    <div className="mb-6 flex flex-col gap-4 sm:mb-8">
      <div className="min-w-0">
        <Link to="/" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:mb-5">
          <ArrowLeft size={12} /> Kembali ke dashboard
        </Link>
        <p className="eyebrow">Keuangan Santri</p>
        <h1 className="page-title">Keuangan <span className="text-rose">✦</span></h1>
        <p className="mt-2 text-sm text-muted-foreground">Catat dan lacak keuangan pembelajaranmu.</p>
      </div>
    </div>

    {error && (
      <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    )}

    {successMessage && (
      <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
        <CheckCircle2 size={16} />
        <span>{successMessage}</span>
      </div>
    )}

    {/* Financial Info Card */}
    <section className="mb-6 rounded-md border border-border bg-sage-light p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center text-primary sm:h-10 sm:w-10">
          <Info size={16} strokeWidth={1.8} className="sm:size-20" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground sm:text-base">Informasi Pembayaran Uang Kas</h3>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Nominal uang kas yang harus dibayar:
          </p>
          <div className="mt-2 flex flex-wrap gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground sm:text-sm">Mingguan:</span>
              <span className="text-sm font-bold text-primary sm:text-base">{formatCurrency(parseFloat(financialSettings.uang_kas_mingguan))}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground sm:text-sm">Bulanan:</span>
              <span className="text-sm font-bold text-primary sm:text-base">{formatCurrency(parseFloat(financialSettings.uang_kas_bulanan))}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Stats Overview */}
    <section className="mb-8 grid gap-4 grid-cols-2 sm:grid-cols-4">
      <div className="rounded-md border border-border bg-card p-4 shadow-soft sm:p-5">
        <div className="mb-3 flex h-8 w-8 items-center justify-center text-primary sm:h-10 sm:w-10">
          <CreditCard size={16} strokeWidth={1.8} className="sm:size-20" />
        </div>
        <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">Total Transaksi</p>
        <p className="mt-1.5 font-display text-2xl font-bold text-foreground sm:text-3xl">{transactionsData.length}</p>
      </div>
      <div className="rounded-md border border-border bg-card p-4 shadow-soft sm:p-5">
        <div className="mb-3 flex h-8 w-8 items-center justify-center text-primary sm:h-10 sm:w-10">
          <TrendingUp size={16} strokeWidth={1.8} className="sm:size-20" />
        </div>
        <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">Total Masuk</p>
        <p className="mt-1.5 font-display text-2xl font-bold text-primary sm:text-3xl">{formatCurrency(transactionsData.filter(t => t.jenis_transaksi === 'masuk').reduce((sum, t) => sum + t.nominal, 0))}</p>
      </div>
      <div className="rounded-md border border-border bg-card p-4 shadow-soft sm:p-5">
        <div className="mb-3 flex h-8 w-8 items-center justify-center text-rose-foreground sm:h-10 sm:w-10">
          <Wallet size={16} strokeWidth={1.8} className="sm:size-20" />
        </div>
        <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">Total Keluar</p>
        <p className="mt-1.5 font-display text-2xl font-bold text-rose-foreground sm:text-3xl">{formatCurrency(transactionsData.filter(t => t.jenis_transaksi === 'keluar').reduce((sum, t) => sum + t.nominal, 0))}</p>
      </div>
      <div className="rounded-md border border-border bg-card p-4 shadow-soft sm:p-5">
        <div className="mb-3 flex h-8 w-8 items-center justify-center text-primary sm:h-10 sm:w-10">
          <CheckCircle2 size={16} strokeWidth={1.8} className="sm:size-20" />
        </div>
        <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">Lunas</p>
        <p className="mt-1.5 font-display text-2xl font-bold text-foreground sm:text-3xl">{transactionsData.filter(t => t.status === 'Lunas').length}</p>
      </div>
    </section>

    {/* Search and Add */}
    <section className="mb-6">
      <div className="mb-5 flex gap-3 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 h-10 rounded-md border border-border bg-background px-3 text-xs sm:h-11 sm:text-sm"
          />
        </div>
        <Button className="h-10 sm:h-11" onClick={() => setIsModalOpen(true)}>
          <Plus size={14} className="sm:size-15" /> Tambah Transaksi
        </Button>
      </div>
    </section>

    {/* Transactions Table */}
    {loading ? (
      <TableSkeleton rows={5} />
    ) : filteredTransactions.length === 0 ? (
      <div className="text-center py-12">
        <Wallet size={48} className="mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Belum ada transaksi</p>
        <p className="text-xs text-muted-foreground mt-1">Catat transaksi keuanganmu untuk memulai</p>
      </div>
    ) : (
      <div className="overflow-hidden rounded-md border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-left sm:min-w-[620px]">
            <thead className="bg-secondary/60 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]">
              <tr>
                <th className="px-4 py-3 sm:px-7 sm:py-4">Kategori</th>
                <th className="px-3 py-3 sm:px-5 sm:py-4">Nominal</th>
                <th className="px-3 py-3 sm:px-5 sm:py-4">Tanggal</th>
                <th className="px-3 py-3 sm:px-5 sm:py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-t border-border text-[11px] sm:text-sm">
                  <td className="px-4 py-3 font-semibold sm:px-7 sm:py-4">{transaction.kategori}</td>
                  <td className="px-3 py-3 text-right font-semibold text-primary sm:px-5 sm:py-4">{formatCurrency(transaction.nominal)}</td>
                  <td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{formatDate(transaction.tanggal)}</td>
                  <td className="px-3 py-3 sm:px-5 sm:py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold sm:px-3 sm:py-1 sm:text-[11px] ${
                      transaction.status === "Lunas" 
                        ? "bg-sage-light text-primary" 
                        : transaction.status === "Pending" 
                          ? "bg-amber-light text-amber-foreground" 
                          : "bg-rose-light text-rose-foreground"
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* Add Transaction Modal */}
    {isModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-md border border-border bg-card p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Tambah Transaksi</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              <X size={16} />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold">Jenis Transaksi</label>
              <select
                value={formData.jenis_transaksi}
                onChange={(e) => setFormData({ ...formData, jenis_transaksi: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
              >
                <option value="masuk">Pemasukan</option>
                <option value="keluar">Pengeluaran</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Kategori</label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
              >
                <option value="uang kas">Uang Kas</option>
                <option value="infaq">Infaq</option>
              </select>
            </div>
            {formData.kategori === 'uang kas' && (
              <div className="rounded-md bg-sage-light p-3">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-primary shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">Nominal yang harus dibayar:</p>
                    <p className="mt-1 text-muted-foreground">
                      Mingguan: {formatCurrency(parseFloat(financialSettings.uang_kas_mingguan))} | 
                      Bulanan: {formatCurrency(parseFloat(financialSettings.uang_kas_bulanan))}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-semibold">Nominal (Rp)</label>
              <input
                type="number"
                value={formData.nominal}
                onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Tanggal</label>
              <input
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Deskripsi</label>
              <textarea
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm min-h-[80px]"
                placeholder="Catatan tambahan..."
                rows={3}
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button className="flex-1" onClick={handleAddTransaction}>Simpan</Button>
          </div>
        </div>
      </div>
    )}
  </BQS SalsabillaShell>;
}