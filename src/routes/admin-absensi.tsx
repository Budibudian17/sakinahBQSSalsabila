import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Camera, Check, Clock3, QrCode, ScanLine, ShieldCheck, Sparkles, X, Users, GraduationCap, UserCheck, Search, RefreshCw, WifiOff, Calendar, Plus, Download, Copy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin-shell";
import { PageHeaderSkeleton, CardSkeleton, StatCardSkeleton, TableSkeleton } from "@/components/ui/page-skeleton";
import jsQR from "jsqr";
import QRCode from "qrcode";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin-absensi")({
  head: () => ({ meta: [
    { title: "Absensi — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Absensi guru manajemen dan rekap kehadiran harian BQS Salsabilla." },
    { property: "og:title", content: "Absensi — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Absensi guru manajemen dan rekap kehadiran harian BQS Salsabilla." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdminAbsensiPage,
});

type AttendanceRecord = {
  id: string;
  user_id: string;
  full_name: string;
  qr_code_id: string;
  lesson: string;
  scan_time: string;
  status: string;
  role?: string;
};

type AdminAttendance = {
  id: string;
  user_id: string;
  full_name: string;
  lesson: string;
  attended_on: string;
  check_in_time: string;
  status: string;
};

type QRCode = {
  id: string;
  lesson: string;
  date: string;
  qr_code_data: string;
  created_by: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  attendance_count?: number;
};

function AdminAbsensiPage() {
  const [mode, setMode] = useState<"attendance" | "qr" | "recap">("attendance");
  const [adminPresent, setAdminPresent] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [adminAttendance, setAdminAttendance] = useState<AdminAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [alertTimeout, setAlertTimeout] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // QR Code Management
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationInterval, setRotationInterval] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState({
    lesson: '',
    date: new Date().toISOString().split('T')[0],
    expires_hours: '2'
  });

  const [nextSchedule, setNextSchedule] = useState<any>(null);

  const { isOnline } = useOnlineStatus();

  useEffect(() => {
    fetchAttendanceData();
    checkAdminAttendance();
    fetchQRCodes();
    fetchNextSchedule();
  }, [selectedDate]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch QR attendance records
      const { data: qrAttendance, error: qrError } = await supabase
        .from('qr_attendance' as any)
        .select(`
          id,
          user_id,
          qr_code_id,
          scan_time,
          status,
          qr_codes!inner (
            lesson
          ),
          profiles!inner (
            full_name
          )
        `)
        .gte('scan_time' as any, `${selectedDate}T00:00:00`)
        .lte('scan_time' as any, `${selectedDate}T23:59:59`)
        .order('scan_time', { ascending: false });

      if (qrError) throw qrError;

      // Fetch manual attendance records (including admin)
      const { data: manualAttendance, error: manualError } = await supabase
        .from('attendance' as any)
        .select(`
          id,
          user_id,
          lesson,
          attended_on,
          check_in_time,
          status,
          profiles!inner (
            full_name
          )
        `)
        .eq('attended_on' as any, selectedDate as any)
        .order('check_in_time', { ascending: false });

      if (manualError) throw manualError;

      // Combine both attendance types
      const qrAttendanceData = (qrAttendance || []).map((record: any) => ({
        id: record.id,
        user_id: record.user_id,
        full_name: record.profiles.full_name,
        qr_code_id: record.qr_code_id,
        lesson: record.qr_codes.lesson,
        scan_time: record.scan_time,
        status: record.status,
        role: 'Santri'
      }));

      const manualAttendanceData = (manualAttendance || []).map((record: any) => ({
        id: record.id,
        user_id: record.user_id,
        full_name: record.profiles.full_name,
        qr_code_id: null,
        lesson: record.lesson,
        scan_time: record.check_in_time,
        status: record.status,
        role: 'Admin'
      }));

      const combinedAttendance = [...qrAttendanceData, ...manualAttendanceData]
        .sort((a, b) => new Date(b.scan_time).getTime() - new Date(a.scan_time).getTime());

      setAttendanceRecords(combinedAttendance);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data absensi');
    } finally {
      setLoading(false);
    }
  };

  const checkAdminAttendance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: existingAttendance, error } = await supabase
        .from('attendance' as any)
        .select('*')
        .eq('user_id' as any, user.id as any)
        .eq('attended_on' as any, selectedDate as any)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setAdminPresent(!!existingAttendance);
    } catch (err) {
      console.error('Error checking admin attendance:', err);
    }
  };

  const handleAdminAttendance = async () => {
    try {
      setIsSubmittingAttendance(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Anda harus login untuk absen');
        return;
      }

      // Check if already attended today BEFORE attempting insert/delete
      const { data: existingAttendance, error: checkError } = await supabase
        .from('attendance' as any)
        .select('*')
        .eq('user_id' as any, user.id as any)
        .eq('attended_on' as any, selectedDate as any)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      const hasAttendance = !!existingAttendance;

      if (hasAttendance) {
        // Remove attendance
        const { error } = await supabase
          .from('attendance' as any)
          .delete()
          .eq('user_id' as any, user.id as any)
          .eq('attended_on' as any, selectedDate as any);

        if (error) throw error;

        setAdminPresent(false);
        setSuccessMessage('Absensi berhasil dibatalkan');
      } else {
        // Add attendance
        const { error } = await supabase
          .from('attendance' as any)
          .insert({
            user_id: user.id,
            lesson: 'Kajian Rutin',
            attended_on: selectedDate,
            check_in_time: new Date().toISOString(),
            status: 'Hadir'
          } as any);

        if (error) throw error;

        setAdminPresent(true);
        setSuccessMessage('Absensi berhasil tercatat');
      }

      if (alertTimeout) clearTimeout(alertTimeout);
      setAlertTimeout(setTimeout(() => setSuccessMessage(null), 3000) as unknown as number);
      await fetchAttendanceData();
      await checkAdminAttendance(); // Re-check to ensure state is correct
    } catch (err) {
      console.error('Error handling admin attendance:', err);
      setError(err instanceof Error ? err.message : 'Gagal mencatat absensi');
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  const filteredAttendance = attendanceRecords.filter(record =>
    record.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.lesson.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('id-ID', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // QR Code Management Functions
  const fetchQRCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('qr_codes' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const qrCodesWithCount = await Promise.all(
        (data || []).map(async (qr: any) => {
          const { count } = await supabase
            .from('qr_attendance' as any)
            .select('*', { count: 'exact', head: true })
            .eq('qr_code_id' as any, qr.id as any);
          
          return {
            ...qr,
            attendance_count: count || 0
          };
        })
      );

      setQrCodes(qrCodesWithCount as unknown as QRCode[]);
    } catch (err) {
      console.error('Error fetching QR codes:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat QR codes');
    }
  };

  const fetchNextSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules' as any)
        .select('*')
        .eq('status' as any, 'Aktif' as any)
        .is('is_deleted' as any, false as any)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setNextSchedule(data[0]);
      } else {
        setNextSchedule(null);
      }
    } catch (err) {
      console.error('Error fetching next schedule:', err);
    }
  };

  const handleGenerateQR = async () => {
    if (!formData.lesson.trim()) {
      setError('Nama kajian harus diisi');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Anda harus login untuk generate QR code');
        return;
      }

      const qrData = JSON.stringify({
        qr_code_id: crypto.randomUUID(),
        lesson: formData.lesson,
        date: formData.date,
        timestamp: new Date().toISOString()
      });

      const qrImage = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(formData.expires_hours));

      const insertData: any = {
        lesson: formData.lesson,
        date: formData.date,
        qr_code_data: qrData,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        is_active: true
      };

      const { error } = await supabase
        .from('qr_codes' as any)
        .insert(insertData);

      if (error) throw error;

      setSuccessMessage('QR code berhasil dibuat');
      setIsModalOpen(false);
      setFormData({
        lesson: '',
        date: new Date().toISOString().split('T')[0],
        expires_hours: '2'
      });
      
      if (alertTimeout) clearTimeout(alertTimeout);
      setAlertTimeout(setTimeout(() => setSuccessMessage(null), 3000) as unknown as number);
      await fetchQRCodes();
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError(err instanceof Error ? err.message : 'Gagal generate QR code');
    }
  };

  const handleViewQR = async (qr: QRCode) => {
    try {
      if (qr.expires_at && new Date(qr.expires_at) < new Date()) {
        setError('QR code sudah expired. Silakan generate QR code baru.');
        return;
      }

      if (!qr.is_active) {
        setError('QR code sudah dinonaktifkan.');
        return;
      }

      const qrImage = await QRCode.toDataURL(qr.qr_code_data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setGeneratedQR(qrImage);
      setSelectedQR(qr);
      
      if (qr.is_active) {
        startRotation(qr);
      }
    } catch (err) {
      console.error('Error generating QR image:', err);
      setError('Gagal generate QR image');
    }
  };

  const startRotation = async (qr: QRCode) => {
    try {
      setIsRotating(true);
      setSelectedQR(qr);
      
      const interval = setInterval(async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            setError('Anda harus login untuk rotasi QR code');
            stopRotation();
            return;
          }

          const newQrData = JSON.stringify({
            qr_code_id: crypto.randomUUID(),
            lesson: qr.lesson,
            date: qr.date,
            timestamp: new Date().toISOString()
          });

          const newQrImage = await QRCode.toDataURL(newQrData, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });

          const { error } = await supabase
            .from('qr_codes' as any)
            .update({ 
              qr_code_data: newQrData,
              updated_at: new Date().toISOString()
            } as any)
            .eq('id' as any, qr.id as any);

          if (error) throw error;

          setGeneratedQR(newQrImage);
          setSelectedQR({ ...qr, qr_code_data: newQrData });
          
          await fetchQRCodes();
        } catch (err) {
          console.error('Error rotating QR code:', err);
          setError('Gagal merotasi QR code');
          stopRotation();
        }
      }, 5000);

      setRotationInterval(interval as unknown as number);
    } catch (err) {
      console.error('Error starting rotation:', err);
      setError('Gagal memulai rotasi QR code');
      setIsRotating(false);
    }
  };

  const stopRotation = () => {
    if (rotationInterval) {
      clearInterval(rotationInterval);
      setRotationInterval(null);
    }
    setIsRotating(false);
  };

  useEffect(() => {
    return () => {
      stopRotation();
      if (alertTimeout) {
        clearTimeout(alertTimeout);
      }
    };
  }, []);

  const handleDeactivateQR = async (id: string) => {
    try {
      if (isRotating && selectedQR?.id === id) {
        stopRotation();
      }

      const { error } = await supabase
        .from('qr_codes' as any)
        .update({ is_active: false, updated_at: new Date().toISOString() } as any)
        .eq('id' as any, id as any);

      if (error) throw error;

      setSuccessMessage('QR code berhasil dinonaktifkan');
      if (alertTimeout) clearTimeout(alertTimeout);
      setAlertTimeout(setTimeout(() => setSuccessMessage(null), 3000) as unknown as number);
      await fetchQRCodes();
    } catch (err) {
      console.error('Error deactivating QR code:', err);
      setError(err instanceof Error ? err.message : 'Gagal menonaktifkan QR code. Pastikan Anda memiliki akses admin.');
    }
  };

  const handleCopyQRData = (qrData: string) => {
    navigator.clipboard.writeText(qrData);
    setSuccessMessage('QR code data berhasil disalin');
    if (alertTimeout) clearTimeout(alertTimeout);
    setAlertTimeout(setTimeout(() => setSuccessMessage(null), 3000) as unknown as number);
  };

  const handleDownloadQR = () => {
    if (generatedQR && canvasRef.current) {
      const link = document.createElement('a');
      link.download = `qr-absensi-${selectedQR?.lesson}-${selectedQR?.date}.png`;
      link.href = generatedQR;
      link.click();
    }
  };

  return <AdminShell>
    {loading ? (
      <PageHeaderSkeleton />
    ) : (
      <div className="mb-6 sm:mb-8">
        <Link to="/admin" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:mb-5"><ArrowLeft size={12} /> Kembali ke dashboard</Link>
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Manajemen Absensi</p><h1 className="page-title">Absensi & QR Code <span className="text-rose">✦</span></h1><p className="mt-2 text-sm text-muted-foreground">Absen sendiri, kelola QR code, dan lihat rekap kehadiran.</p></div><span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"><ShieldCheck size={12} className="text-primary" /> Admin Panel</span></div>
      </div>
    )}

    {error && (
      <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        <X size={16} />
        <span>{error}</span>
      </div>
    )}

    {successMessage && (
      <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
        <Check size={16} />
        <span>{successMessage}</span>
      </div>
    )}

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(330px,.95fr)]">
      <section className="overflow-hidden rounded-md border border-border bg-card shadow-soft">
        <div className="border-b border-border px-4 py-4 sm:px-7 sm:py-5"><div className="flex items-center gap-2"><UserCheck size={14} className="text-primary sm:size-15" /><h2 className="section-title">Mode Absensi</h2></div><p className="mt-1.5 text-xs text-muted-foreground">Pilih mode yang sesuai dengan kebutuhanmu.</p></div>
        <div className="p-4 sm:p-7">
          <div className="mb-5 flex rounded-md bg-secondary p-1 sm:mb-6" role="tablist" aria-label="Mode absensi">
            <Button role="tab" aria-selected={mode === "attendance"} variant="ghost" className={`h-9 flex-1 rounded-sm text-xs sm:h-10 sm:text-sm ${mode === "attendance" ? "bg-card text-primary shadow-soft" : "text-muted-foreground"}`} onClick={() => { setMode("attendance"); stopRotation(); }}><UserCheck size={12} className="sm:size-13" /> Absen Manual</Button>
            <Button role="tab" aria-selected={mode === "qr"} variant="ghost" className={`h-9 flex-1 rounded-sm text-xs sm:h-10 sm:text-sm ${mode === "qr" ? "bg-card text-primary shadow-soft" : "text-muted-foreground"}`} onClick={() => { setMode("qr"); stopRotation(); }}><QrCode size={12} className="sm:size-13" /> QR Code</Button>
          </div>
          
          {mode === "attendance" && (
            <div className="rounded-md border border-border bg-secondary/60 p-5">
              <div className="mb-4 flex items-center gap-2 text-rose-foreground"><UserCheck size={20} /><h3 className="font-bold text-sm">Absen Diri</h3></div>
              <p className="mb-4 text-xs text-muted-foreground">Tanggal: {formatDate(selectedDate)}</p>
              <Button
                className="w-full h-11"
                onClick={handleAdminAttendance}
                variant={adminPresent ? "default" : "outline"}
                disabled={isSubmittingAttendance || adminPresent}
              >
                {isSubmittingAttendance ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                    Mencatat...
                  </>
                ) : (
                  <>
                    {adminPresent ? <Check size={14} className="sm:size-15" /> : <UserCheck size={14} className="sm:size-15" />}
                    {adminPresent ? "Sudah Hadir Hari Ini" : "Saya Hadir Hari Ini"}
                  </>
                )}
              </Button>
            </div>
          )}

          {mode === "qr" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus size={14} className="sm:size-15" /> Generate QR Code
                </Button>
              </div>
              
              {qrCodes.length === 0 ? (
                <div className="text-center py-8">
                  <QrCode size={32} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Belum ada QR code absensi</p>
                  <p className="text-xs text-muted-foreground mt-1">Generate QR code untuk memulai absensi</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[320px] text-left sm:min-w-[620px]">
                    <thead className="bg-secondary/60 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]">
                      <tr>
                        <th className="px-4 py-3 sm:px-7 sm:py-4">Kajian</th>
                        <th className="px-3 py-3 sm:px-5 sm:py-4">Tanggal</th>
                        <th className="px-3 py-3 sm:px-5 sm:py-4">Status</th>
                        <th className="px-3 py-3 sm:px-5 sm:py-4">Absensi</th>
                        <th className="px-4 py-3 text-right sm:px-7 sm:py-4">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qrCodes.map((qr) => (
                        <tr key={qr.id} className="border-t border-border text-[11px] sm:text-sm">
                          <td className="px-4 py-3 font-semibold sm:px-7 sm:py-4">{qr.lesson}</td>
                          <td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{formatDate(qr.date)}</td>
                          <td className="px-3 py-3 sm:px-5 sm:py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold sm:px-3 sm:py-1 sm:text-[11px] ${
                              qr.is_active ? "bg-sage-light text-primary" : "bg-rose-light text-rose-foreground"
                            }`}>
                              {qr.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">
                            <div className="flex items-center gap-1">
                              <Users size={12} />
                              <span className="font-semibold">{qr.attendance_count || 0}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right sm:px-7 sm:py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[10px] sm:h-8 sm:px-3 sm:text-xs"
                                onClick={() => handleViewQR(qr)}
                              >
                                <QrCode size={12} className="sm:size-14" /> Lihat
                              </Button>
                              {qr.is_active && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-[10px] sm:h-8 sm:px-3 sm:text-xs text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeactivateQR(qr.id)}
                                >
                                  <X size={12} className="sm:size-14" /> Nonaktif
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}


        </div>
      </section>
      <div className="space-y-5 sm:space-y-6">
        {loading ? (
          <>
            <CardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <section className="rounded-md border border-border bg-sage-light p-5 sm:p-7"><div className="mb-4 flex h-10 w-10 items-center justify-center text-primary"><Sparkles size={20} /></div><h2 className="font-display text-lg font-bold text-foreground sm:text-xl">Amanah dalam mencatat kehadiran.</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Sebagai guru manajemen, kamu bertanggung jawab atas akurasi data absensi. Pastikan kehadiranmu tercatat dengan benar.</p><div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs font-semibold text-primary sm:mt-6 sm:pt-5"><Clock3 size={12} className="sm:size-13" /> Kajian berikutnya: {nextSchedule ? `${nextSchedule.hari}, ${nextSchedule.waktu} WIB` : 'Belum ada jadwal'}</div></section>
            <section className="rounded-md border border-border bg-card p-5 shadow-soft sm:p-7"><div className="mb-4 flex items-center justify-between sm:mb-5"><div><p className="eyebrow">Rekap Hari Ini</p><h2 className="section-title mt-1">Total Kehadiran</h2></div><span className="text-primary"><Users size={20} /></span></div><div className="flex items-baseline gap-2"><strong className="font-display text-3xl font-bold text-primary sm:text-4xl">{attendanceRecords.length}</strong><span className="text-xs text-muted-foreground">orang hadir</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary sm:mt-5"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min((attendanceRecords.length / 30) * 100, 100)}%` }} /></div><p className="mt-3 text-xs text-muted-foreground">Kehadiran siswi dan guru hari ini</p></section>
          </>
        )}
      </div>
    </div>
    <section className="mt-7 overflow-hidden rounded-md border border-border bg-card shadow-soft sm:mt-9"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-4 sm:px-7 sm:py-5"><div><p className="eyebrow">Rekap Harian</p><h2 className="section-title mt-1">Kehadiran Hari Ini</h2></div><div className="flex items-center gap-2"><Calendar size={14} className="text-muted-foreground" /><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="rounded-md border border-border bg-background px-3 py-1 text-xs" /></div></div><div className="p-4 sm:p-7">{loading ? <TableSkeleton rows={5} /> : attendanceRecords.length === 0 ? <div className="text-center py-8"><Users size={32} className="mx-auto text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">Belum ada data absensi untuk tanggal ini</p></div> : <><div className="mb-5 flex gap-3 sm:mb-6"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="text" placeholder="Cari nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 h-10 rounded-md border border-border bg-background px-3 text-xs sm:h-11 sm:text-sm" /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[320px] text-left sm:min-w-[620px]"><thead className="bg-secondary/60 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]"><tr><th className="px-4 py-3 sm:px-7 sm:py-4">Nama</th><th className="px-3 py-3 sm:px-5 sm:py-4">Kajian</th><th className="px-3 py-3 sm:px-5 sm:py-4">Waktu</th><th className="px-3 py-3 sm:px-5 sm:py-4">Role</th><th className="px-4 py-3 text-right sm:px-7 sm:py-4">Status</th></tr></thead><tbody>{filteredAttendance.map((record) => <tr key={record.id} className="border-t border-border text-[11px] sm:text-sm"><td className="px-4 py-3 font-semibold sm:px-7 sm:py-4">{record.full_name}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{record.lesson}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{formatTime(record.scan_time)}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{record.role}</td><td className="px-4 py-3 text-right sm:px-7 sm:py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold sm:px-3 sm:py-1 sm:text-[11px] ${record.status === "Hadir" ? "bg-sage-light text-primary" : record.status === "Izin" ? "bg-rose-light text-rose-foreground" : "bg-amber-light text-amber-foreground"}`}>{record.status}</span></td></tr>)}</tbody></table></div></>}</div></section>

    {/* Generate QR Modal */}
    {isModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-md border border-border bg-card p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Generate QR Code Absensi</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              <X size={16} />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold">Nama Kajian</label>
              <input
                type="text"
                value={formData.lesson}
                onChange={(e) => setFormData({ ...formData, lesson: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
                placeholder="Contoh: Tafsir Al-Qur'an"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Tanggal</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Waktu Expired (jam)</label>
              <input
                type="number"
                value={formData.expires_hours}
                onChange={(e) => setFormData({ ...formData, expires_hours: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
                placeholder="2"
                min="1"
                max="24"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">QR code akan expire setelah waktu ini</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button className="flex-1" onClick={handleGenerateQR}>Generate</Button>
          </div>
        </div>
      </div>
    )}

    {/* View QR Modal */}
    {selectedQR && generatedQR && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-md border border-border bg-card p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">QR Code Absensi</h3>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedQR(null); setGeneratedQR(null); stopRotation(); }}>
              <X size={16} />
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex justify-center">
              <img src={generatedQR} alt="QR Code" className="w-64 h-64" />
            </div>
            {isRotating && selectedQR.is_active && (
              <div className="flex items-center justify-center gap-2 text-xs text-primary font-semibold">
                <Clock3 size={14} className="animate-spin" />
                <span>QR Code berganti otomatis setiap 5 detik</span>
              </div>
            )}
            <div className="rounded-md bg-secondary/60 p-3">
              <p className="text-[10px] font-semibold text-muted-foreground">Informasi</p>
              <p className="mt-1 text-xs"><strong>Kajian:</strong> {selectedQR.lesson}</p>
              <p className="text-xs"><strong>Tanggal:</strong> {formatDate(selectedQR.date)}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs"><strong>Status:</strong></p>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  selectedQR.is_active ? "bg-sage-light text-primary" : "bg-rose-light text-rose-foreground"
                }`}>
                  {selectedQR.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              {selectedQR.expires_at && (
                <p className="text-xs"><strong>Expired:</strong> {formatDateTime(selectedQR.expires_at)}</p>
              )}
              <p className="text-xs"><strong>Absensi:</strong> {selectedQR.attendance_count || 0} orang</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => handleCopyQRData(selectedQR.qr_code_data)}>
                <Copy size={14} className="sm:size-15 mr-2" /> Copy Data
              </Button>
              <Button className="flex-1" onClick={handleDownloadQR}>
                <Download size={14} className="sm:size-15 mr-2" /> Download
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}
  </AdminShell>;
}