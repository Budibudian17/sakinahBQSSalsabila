import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Settings, DollarSign, Calendar, CheckCircle2, AlertCircle, Save, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin-keuangan-settings")({
  head: () => ({ meta: [
    { title: "Pengaturan Keuangan — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Atur nominal uang kas dan keuangan BQS Salsabilla Ruang Muslimah." },
    { property: "og:title", content: "Pengaturan Keuangan — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Atur nominal uang kas dan keuangan BQS Salsabilla Ruang Muslimah." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdminKeuanganSettingsPage,
});

type FinancialSetting = {
  id: string;
  setting_name: string;
  setting_value: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

function AdminKeuanganSettingsPage() {
  const [settings, setSettings] = useState<FinancialSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    uang_kas_mingguan: '',
    uang_kas_bulanan: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_settings' as any)
        .select('*');

      if (error) throw error;

      const settingsData = (data || []) as unknown as FinancialSetting[];
      setSettings(settingsData);
      
      // Set edit form values
      const mingguan = settingsData.find((s) => s.setting_name === 'uang_kas_mingguan');
      const bulanan = settingsData.find((s) => s.setting_name === 'uang_kas_bulanan');
      
      setEditForm({
        uang_kas_mingguan: mingguan?.setting_value || '',
        uang_kas_bulanan: bulanan?.setting_value || ''
      });
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      
      // Validate
      const mingguanNum = parseFloat(editForm.uang_kas_mingguan);
      const bulananNum = parseFloat(editForm.uang_kas_bulanan);
      
      if (isNaN(mingguanNum) || mingguanNum <= 0) {
        setError('Nominal uang kas mingguan harus berupa angka positif');
        return;
      }
      
      if (isNaN(bulananNum) || bulananNum <= 0) {
        setError('Nominal uang kas bulanan harus berupa angka positif');
        return;
      }

      // Update settings
      const { error: mingguanError } = await supabase
        .from('financial_settings' as any)
        .update({
          setting_value: editForm.uang_kas_mingguan,
          updated_at: new Date().toISOString()
        } as any)
        .eq('setting_name' as any, 'uang_kas_mingguan' as any);

      if (mingguanError) throw mingguanError;

      const { error: bulananError } = await supabase
        .from('financial_settings' as any)
        .update({
          setting_value: editForm.uang_kas_bulanan,
          updated_at: new Date().toISOString()
        } as any)
        .eq('setting_name' as any, 'uang_kas_bulanan' as any);

      if (bulananError) throw bulananError;

      setSuccessMessage('Pengaturan berhasil disimpan');
      setIsEditing(false);
      
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchSettings();
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan');
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  return <AdminShell>
    <div className="mb-6 sm:mb-8">
      <Link to="/admin" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:mb-5">
        <ArrowLeft size={12} /> Kembali ke dashboard
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Pengaturan Keuangan</p>
          <h1 className="page-title">Keuangan <span className="text-rose">✦</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Atur nominal uang kas yang harus dibayar siswi.</p>
        </div>
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

    {loading ? (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ) : (
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Mingguan Setting */}
        <section className="overflow-hidden rounded-md border border-border bg-card shadow-soft">
          <div className="border-b border-border px-4 py-4 sm:px-7 sm:py-5">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-primary sm:size-15" />
              <h2 className="section-title">Uang Kas Mingguan</h2>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Nominal uang kas per minggu</p>
          </div>
          <div className="p-4 sm:p-7">
            {!isEditing ? (
              <div>
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nominal Saat Ini</p>
                  <p className="font-display text-3xl font-bold text-primary sm:text-4xl">
                    {formatCurrency(editForm.uang_kas_mingguan)}
                  </p>
                </div>
                <Button className="w-full" onClick={() => setIsEditing(true)}>
                  <Settings size={14} className="sm:size-15 mr-2" /> Edit Nominal
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Nominal (Rp)</label>
                  <input
                    type="number"
                    value={editForm.uang_kas_mingguan}
                    onChange={(e) => setEditForm({ ...editForm, uang_kas_mingguan: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
                    placeholder="10000"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setIsEditing(false);
                    fetchSettings();
                  }}>
                    <X size={14} className="sm:size-15 mr-2" /> Batal
                  </Button>
                  <Button className="flex-1" onClick={handleSave}>
                    <Save size={14} className="sm:size-15 mr-2" /> Simpan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Bulanan Setting */}
        <section className="overflow-hidden rounded-md border border-border bg-card shadow-soft">
          <div className="border-b border-border px-4 py-4 sm:px-7 sm:py-5">
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-primary sm:size-15" />
              <h2 className="section-title">Uang Kas Bulanan</h2>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Nominal uang kas per bulan (4 minggu)</p>
          </div>
          <div className="p-4 sm:p-7">
            {!isEditing ? (
              <div>
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nominal Saat Ini</p>
                  <p className="font-display text-3xl font-bold text-primary sm:text-4xl">
                    {formatCurrency(editForm.uang_kas_bulanan)}
                  </p>
                </div>
                <Button className="w-full" onClick={() => setIsEditing(true)}>
                  <Settings size={14} className="sm:size-15 mr-2" /> Edit Nominal
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Nominal (Rp)</label>
                  <input
                    type="number"
                    value={editForm.uang_kas_bulanan}
                    onChange={(e) => setEditForm({ ...editForm, uang_kas_bulanan: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
                    placeholder="40000"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setIsEditing(false);
                    fetchSettings();
                  }}>
                    <X size={14} className="sm:size-15 mr-2" /> Batal
                  </Button>
                  <Button className="flex-1" onClick={handleSave}>
                    <Save size={14} className="sm:size-15 mr-2" /> Simpan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    )}

    {/* Info Section */}
    <section className="mt-6 rounded-md border border-border bg-sage-light p-5 sm:p-7">
      <div className="mb-4 flex h-10 w-10 items-center justify-center text-primary">
        <DollarSign size={20} />
      </div>
      <h2 className="font-display text-lg font-bold text-foreground sm:text-xl">Informasi Pengaturan</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Nominal uang kas ini akan ditampilkan di halaman keuangan siswi sebagai panduan pembayaran. 
        Siswi akan melihat informasi bahwa uang kas mingguan adalah {formatCurrency(editForm.uang_kas_mingguan)} 
        dan bulanan adalah {formatCurrency(editForm.uang_kas_bulanan)}.
      </p>
    </section>
  </AdminShell>;
}
