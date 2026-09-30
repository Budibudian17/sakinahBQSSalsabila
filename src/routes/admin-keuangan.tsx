import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Wallet, Plus, Search, Filter, MoreVertical, CheckCircle2, TrendingUp, CreditCard, Edit, Trash2, X, AlertCircle, ChevronLeft, ChevronRight, Calendar, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin-shell";
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

export const Route = createFileRoute("/admin-keuangan")({
  head: () => ({ meta: [
    { title: "Manajemen Keuangan — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Kelola keuangan dan pembayaran BQS Salsabilla Ruang Muslimah." },
    { property: "og:title", content: "Manajemen Keuangan — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Kelola keuangan dan pembayaran BQS Salsabilla Ruang Muslimah." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdminKeuanganPage,
});

type Transaction = {
  id: string;
  user_id: string;
  jenis_transaksi: string;
  kategori: string;
  nominal: number;
  deskripsi?: string | null;
  tanggal: string;
  status: string;
  bukti_pembayaran?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at?: string;
  full_name?: string;
  email?: string;
};

function AdminKeuanganPage() {
  const [transactionsData, setTransactionsData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setActiveDropdown(null), activeDropdown !== null);

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

  useEffect(() => {
    fetchTransactions(true);
  }, []);

  const fetchTransactions = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      console.log('Fetching transactions...');

      const { data: transactions, error } = await supabase
        .from('keuangan' as any)
        .select('*')
        .is('is_deleted' as any, false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched transactions:', transactions);

      // Get user IDs from transactions
      const userIds = (transactions || []).map((t: any) => t.user_id).filter(Boolean);
      
      // Fetch profiles for these users
      let userProfiles: any = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles' as any)
          .select('id, full_name, email')
          .in('id' as any, userIds as any);
        
        if (profiles) {
          userProfiles = (profiles as any[]).reduce((acc: any, profile: any) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
        }
      }

      // Merge transactions with profile data
      const enrichedTransactions = (transactions || []).map((t: any) => ({
        ...t,
        full_name: userProfiles[t.user_id]?.full_name || null,
        email: userProfiles[t.user_id]?.email || null
      }));

      setTransactionsData(enrichedTransactions as unknown as Transaction[]);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data keuangan');
      setAlertDialog({
        open: true,
        title: 'Gagal Memuat Data',
        description: err instanceof Error ? err.message : 'Gagal memuat data keuangan',
        type: 'error',
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };



  const handleRejectTransaction = async (id: string) => {
    try {
      console.log('Rejecting transaction with ID:', id);

      const { error } = await supabase
        .from('keuangan' as any)
        .update({
          status: 'Ditolak',
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          verified_at: new Date().toISOString()
        } as any)
        .eq('id' as any, id as any);

      if (error) throw error;

      await fetchTransactions(false);
      setActiveDropdown(null);

      setAlertDialog({
        open: true,
        title: 'Berhasil',
        description: 'Transaksi berhasil ditolak.',
        type: 'success',
      });
    } catch (err) {
      console.error('Error rejecting transaction:', err);
      setAlertDialog({
        open: true,
        title: 'Gagal',
        description: err instanceof Error ? err.message : 'Gagal menolak transaksi',
        type: 'error',
      });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setAlertDialog({
      open: true,
      title: 'Hapus Transaksi',
      description: 'Apakah Anda yakin ingin menghapus transaksi ini? Data yang dihapus tidak dapat dikembalikan.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          console.log('Deleting transaction with ID:', id);

          const { error } = await supabase
            .from('keuangan' as any)
            .update({
              is_deleted: true,
              deleted_at: new Date().toISOString()
            } as any)
            .eq('id' as any, id as any);

          if (error) throw error;

          await fetchTransactions(false);
          setSearchQuery('');
          setCurrentPage(1);
          setActiveDropdown(null);

          setAlertDialog({
            open: true,
            title: 'Berhasil',
            description: 'Transaksi berhasil dihapus.',
            type: 'success',
          });
        } catch (err) {
          console.error('Error deleting transaction:', err);
          setAlertDialog({
            open: true,
            title: 'Gagal',
            description: err instanceof Error ? err.message : 'Gagal menghapus transaksi',
            type: 'error',
          });
        }
      }
    });
  };

  const handleVerifyTransaction = async (id: string) => {
    try {
      console.log('Verifying transaction with ID:', id);

      const { error } = await supabase
        .from('keuangan' as any)
        .update({
          status: 'Lunas',
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          verified_at: new Date().toISOString()
        } as any)
        .eq('id' as any, id as any);

      if (error) throw error;

      await fetchTransactions(false);
      setActiveDropdown(null);

      setAlertDialog({
        open: true,
        title: 'Berhasil',
        description: 'Transaksi berhasil diterima.',
        type: 'success',
      });
    } catch (err) {
      console.error('Error verifying transaction:', err);
      setAlertDialog({
        open: true,
        title: 'Gagal',
        description: err instanceof Error ? err.message : 'Gagal menerima transaksi',
        type: 'error',
      });
    }
  };

  const filteredTransactions = transactionsData.filter(transaction =>
    transaction.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  return <AdminShell>
    <div className="mb-6 sm:mb-8">
      <Link to="/admin" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:mb-5"><ArrowLeft size={12} /> Kembali ke dashboard</Link>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Manajemen Keuangan</p><h1 className="page-title">Keuangan <span className="text-rose">✦</span></h1><p className="mt-2 text-sm text-muted-foreground">Verifikasi dan kelola transaksi keuangan siswi.</p></div></div>
    </div>

    {error && (
      <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    )}

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(330px,.95fr)]">
      <section className="overflow-hidden rounded-md border border-border bg-card shadow-soft">
        <div className="border-b border-border px-4 py-4 sm:px-7 sm:py-5"><div className="flex items-center gap-2"><Wallet size={14} className="text-primary sm:size-15" /><h2 className="section-title">Daftar Transaksi</h2></div><p className="mt-1.5 text-xs text-muted-foreground">Semua transaksi keuangan siswi.</p></div>
        <div className="p-4 sm:p-7">
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
            <Button variant="outline" className="h-10 sm:h-11"><Filter size={14} className="sm:size-15" /> Filter</Button>
          </div>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : currentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Belum ada transaksi</p>
              <p className="text-xs text-muted-foreground mt-1">Tambahkan transaksi baru untuk memulai</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto"><table className="w-full min-w-[320px] text-left sm:min-w-[620px]"><thead className="bg-secondary/60 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]"><tr><th className="px-4 py-3 sm:px-7 sm:py-4">Siswi</th><th className="px-3 py-3 sm:px-5 sm:py-4">Kategori</th><th className="px-3 py-3 sm:px-5 sm:py-4">Nominal</th><th className="px-3 py-3 sm:px-5 sm:py-4">Tanggal</th><th className="px-3 py-3 sm:px-5 sm:py-4">Status</th><th className="px-4 py-3 text-right sm:px-7 sm:py-4">Aksi</th></tr></thead><tbody>{currentTransactions.map((transaction) => <tr key={transaction.id} className="border-t border-border text-[11px] sm:text-sm"><td className="px-4 py-3 font-semibold sm:px-7 sm:py-4">{transaction.full_name || 'Siswa tidak ditemukan'}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{transaction.kategori}</td><td className="px-3 py-3 text-right font-semibold text-primary sm:px-5 sm:py-4">{formatCurrency(transaction.nominal)}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{formatDate(transaction.tanggal)}</td><td className="px-3 py-3 sm:px-5 sm:py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold sm:px-3 sm:py-1 sm:text-[11px] ${transaction.status === "Lunas" ? "bg-sage-light text-primary" : transaction.status === "Pending" ? "bg-amber-light text-amber-foreground" : transaction.status === "Ditolak" ? "bg-rose-light text-rose-foreground" : "bg-sage-light text-primary"}`}>{transaction.status}</span></td><td className="px-4 py-3 text-right sm:px-7 sm:py-4 relative"><div className="relative inline-block" ref={activeDropdown === transaction.id ? dropdownRef : null}><Button variant="ghost" size="sm" className="h-6 px-1.5 text-[8px] sm:h-8 sm:px-2 sm:text-xs" onClick={() => setActiveDropdown(activeDropdown === transaction.id ? null : transaction.id)}><MoreVertical size={12} /></Button>{activeDropdown === transaction.id && (<div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-md border border-border bg-card shadow-lg sm:w-40">{transaction.status === 'Pending' && <><button onClick={() => handleVerifyTransaction(transaction.id)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left hover:bg-secondary sm:text-sm"><Check size={12} /> Terima</button><button onClick={() => handleRejectTransaction(transaction.id)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left text-destructive hover:bg-destructive/10 sm:text-sm"><X size={12} /> Tolak</button></>}<button onClick={() => handleDeleteTransaction(transaction.id)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left text-destructive hover:bg-destructive/10 sm:text-sm"><Trash2 size={12} /> Hapus</button></div>)}</div></td></tr>)}</tbody></table></div>

              {totalPages > 1 && (
                <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[10px] text-muted-foreground sm:text-xs">
                    Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
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
        <section className="rounded-md border border-border bg-sage-light p-5 sm:p-7"><div className="mb-4 flex h-10 w-10 items-center justify-center text-primary"><TrendingUp size={20} /></div><h2 className="font-display text-lg font-bold text-foreground sm:text-xl">Ringkasan Keuangan.</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Pantau total pemasukan dan pengeluaran bulan ini.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Masuk</p><p className="font-display text-2xl font-bold text-primary sm:text-3xl">{formatCurrency(transactionsData.filter(t => t.jenis_transaksi === 'masuk').reduce((sum, t) => sum + t.nominal, 0))}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Keluar</p><p className="font-display text-2xl font-bold text-rose-foreground sm:text-3xl">{formatCurrency(transactionsData.filter(t => t.jenis_transaksi === 'keluar').reduce((sum, t) => sum + t.nominal, 0))}</p></div></div></section>
        <section className="rounded-md border border-border bg-card p-5 shadow-soft sm:p-7"><div className="mb-4 flex items-center justify-between sm:mb-5"><div><p className="eyebrow">Status Transaksi</p><h2 className="section-title mt-1">Bulan Ini</h2></div><span className="text-primary"><CreditCard size={20} /></span></div><div className="flex items-baseline gap-2"><strong className="font-display text-3xl font-bold text-primary sm:text-4xl">{transactionsData.filter(t => t.status === 'Lunas').length}</strong><span className="text-xs text-muted-foreground">transaksi diverifikasi</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary sm:mt-5"><div className="h-full w-[75%] rounded-full bg-primary" /></div><p className="mt-3 text-xs text-muted-foreground">{transactionsData.filter(t => t.status === 'Pending').length} transaksi menunggu verifikasi</p></section>
      </div>
    </div>

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