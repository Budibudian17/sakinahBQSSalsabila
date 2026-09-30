import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Camera, Check, Clock3, QrCode, ScanLine, ShieldCheck, Sparkles, X, Search, WifiOff, Calendar, AlertCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BQS SalsabillaShell } from "@/components/sakinah-shell";
import { EmptyState } from "@/components/empty-state";
import { CardSkeleton, TableSkeleton } from "@/components/ui/page-skeleton";
import jsQR from "jsqr";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/absensi")({
  head: () => ({ meta: [
    { title: "Absen QR — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Tampilan absensi QR dan riwayat kehadiran kajian santriwati BQS Salsabilla." },
    { property: "og:title", content: "Absen QR — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Tampilan absensi QR dan riwayat kehadiran kajian santriwati BQS Salsabilla." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AbsensiPage,
});

type AttendanceRecord = {
  id: string;
  qr_code_id: string;
  lesson: string;
  scan_time: string;
  status: string;
};

type QRCodeData = {
  qr_code_id: string;
  lesson: string;
  date: string;
  timestamp: string;
};

function AbsensiPage() {
  const [mode, setMode] = useState<"scan" | "history">("scan");
  const [isScanning, setIsScanning] = useState(false);
  const [qrResult, setQrResult] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { isOnline } = useOnlineStatus();

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  const fetchAttendanceHistory = async () => {
    try {
      setLoadingHistory(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setAttendanceError('Anda harus login untuk melihat riwayat absensi');
        setLoadingHistory(false);
        return;
      }

      const { data, error } = await supabase
        .from('qr_attendance' as any)
        .select(`
          id,
          qr_code_id,
          scan_time,
          status,
          qr_codes!inner (
            lesson,
            date
          )
        `)
        .eq('user_id' as any, user.id as any)
        .order('scan_time', { ascending: false });

      if (error) throw error;

      const history = (data || []).map((record: any) => ({
        id: record.id,
        qr_code_id: record.qr_code_id,
        lesson: record.qr_codes.lesson,
        scan_time: record.scan_time,
        status: record.status
      }));

      setAttendanceHistory(history);
    } catch (err) {
      console.error('Error fetching attendance history:', err);
      setAttendanceError(err instanceof Error ? err.message : 'Gagal memuat riwayat absensi');
    } finally {
      setLoadingHistory(false);
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, canvas.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        try {
          const qrData: QRCodeData = JSON.parse(code.data);
          
          // Process attendance
          handleAttendance(qrData);
          
          setQrResult(JSON.stringify(qrData, null, 2));
          setIsScanning(false);
          stopCamera();
        } catch (error) {
          // If QR is not JSON, treat as regular QR
          setQrResult(code.data);
          setIsScanning(false);
          stopCamera();
        }
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanQRCode);
  };

  const handleAttendance = async (qrData: QRCodeData) => {
    try {
      setAttendanceError(null);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setAttendanceError('Anda harus login untuk absensi');
        return;
      }

      // Validate QR code with database
      const { data: qrCode, error: qrError } = await supabase
        .from('qr_codes' as any)
        .select('*')
        .eq('qr_code_data' as any, JSON.stringify(qrData) as any)
        .eq('is_active' as any, true as any)
        .single();

      if (qrError || !qrCode) {
        setAttendanceError('QR code tidak valid atau sudah tidak aktif');
        return;
      }

      // Check if QR code is expired
      if ((qrCode as any).expires_at && new Date((qrCode as any).expires_at) < new Date()) {
        setAttendanceError('QR code sudah expired/waktu habis');
        return;
      }

      // Check if already scanned
      const { data: existingAttendance, error: checkError } = await supabase
        .from('qr_attendance' as any)
        .select('*')
        .eq('qr_code_id' as any, (qrCode as any).id as any)
        .eq('user_id' as any, user.id as any);

      if (checkError) throw checkError;

      if (existingAttendance && existingAttendance.length > 0) {
        setAttendanceError('Anda sudah absen untuk kajian ini');
        return;
      }

      // Record attendance
      const { error: insertError } = await supabase
        .from('qr_attendance' as any)
        .insert({
          qr_code_id: (qrCode as any).id,
          user_id: user.id,
          status: 'Hadir',
          scan_time: new Date().toISOString()
        } as any);

      if (insertError) throw insertError;

      setSuccessMessage(`Absensi berhasil tercatat untuk ${(qrCode as any).lesson}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh history
      await fetchAttendanceHistory();
    } catch (err) {
      console.error('Error recording attendance:', err);
      setAttendanceError(err instanceof Error ? err.message : 'Gagal mencatat absensi');
    }
  };

  const startCamera = async () => {
    if (!isOnline) {
      setCameraError("Kamu sedang offline. Fitur absensi memerlukan koneksi internet untuk sinkronisasi data.");
      return;
    }

    setCameraError(null);
    setIsScanning(true);
    setQrResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        // Start scanning
        animationFrameRef.current = requestAnimationFrame(scanQRCode);
      }
    } catch (error) {
      setCameraError("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
      setIsScanning(false);
      console.error("Camera error:", error);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const filteredHistory = attendanceHistory.filter(record =>
    record.lesson.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
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

  return <BQS SalsabillaShell>
    <div className="mb-6 sm:mb-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:mb-5"><ArrowLeft size={12} /> Kembali ke dashboard</Link>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Kehadiran Kajian</p><h1 className="page-title">Absen QR <span className="text-rose">✦</span></h1><p className="mt-2 text-sm text-muted-foreground">Satu langkah mudah untuk mencatat kehadiranmu.</p></div></div>
    </div>

    {attendanceError && (
      <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle size={16} />
        <span>{attendanceError}</span>
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
        <div className="border-b border-border px-4 py-4 sm:px-7 sm:py-5"><div className="flex items-center gap-2"><ScanLine size={14} className="text-primary sm:size-15" /><h2 className="section-title">Scan QR Masuk Kajian</h2></div><p className="mt-1.5 text-xs text-muted-foreground">Pilih cara absensi yang paling nyaman untukmu.</p></div>
        <div className="p-4 sm:p-7">
          {!isOnline && (
            <div className="mb-5 flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
              <WifiOff size={16} className="text-amber-600" />
              <p className="text-xs font-semibold text-amber-800">
                Fitur absensi memerlukan koneksi internet. Hubungkan ke internet untuk mencatat kehadiran.
              </p>
            </div>
          )}
          <div className="mb-5 flex rounded-md bg-secondary p-1 sm:mb-6" role="tablist" aria-label="Cara absensi">
            <Button role="tab" aria-selected={mode === "scan"} variant="ghost" className={`h-9 flex-1 rounded-sm text-xs sm:h-10 sm:text-sm ${mode === "scan" ? "bg-card text-primary shadow-soft" : "text-muted-foreground"}`} onClick={() => { setMode("scan"); if (isScanning) stopCamera(); }}><Camera size={12} className="sm:size-13" /> Scan QR</Button>
            <Button role="tab" aria-selected={mode === "history"} variant="ghost" className={`h-9 flex-1 rounded-sm text-xs sm:h-10 sm:text-sm ${mode === "history" ? "bg-card text-primary shadow-soft" : "text-muted-foreground"}`} onClick={() => { setMode("history"); stopCamera(); }}><QrCode size={12} className="sm:size-13" /> Riwayat</Button>
          </div>
          {mode === "scan" ? (
            <div className="scanner-stage relative mx-auto flex aspect-[1.2] w-full max-w-[400px] items-center justify-center overflow-hidden rounded-md sm:aspect-[1.4] sm:max-w-[440px]">
              <canvas ref={canvasRef} className="hidden" />
              {isScanning ? (
                <>
                  <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline />
                  <div className="scanner-grid absolute inset-0" />
                  <button onClick={stopCamera} className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70">
                    <X size={16} />
                  </button>
                  <span className="absolute bottom-4 left-0 right-0 text-center text-[10px] font-medium text-white/90 sm:text-[11px]">Arahkan kamera ke QR kajian</span>
                </>
              ) : qrResult ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Check size={32} />
                  </div>
                  <p className="text-sm font-bold text-green-600">QR Terdeteksi!</p>
                  <p className="mt-2 text-xs text-muted-foreground">{qrResult}</p>
                  <Button onClick={() => { setQrResult(null); startCamera(); }} className="mt-4" size="sm">Scan Lagi</Button>
                </div>
              ) : cameraError ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <X size={32} />
                  </div>
                  <p className="text-sm font-bold text-red-600">Gagal Mengakses Kamera</p>
                  <p className="mt-2 text-xs text-muted-foreground">{cameraError}</p>
                  <Button onClick={() => { setCameraError(null); startCamera(); }} className="mt-4" size="sm">Coba Lagi</Button>
                </div>
              ) : (
                <>
                  <div className="scanner-grid absolute inset-0" />
                  <div className="relative h-[74%] aspect-square max-h-[220px] max-w-[68%] sm:max-h-[260px]">
                    <span className="scan-corner top-0 left-0 border-t border-l" />
                    <span className="scan-corner top-0 right-0 border-t border-r" />
                    <span className="scan-corner bottom-0 left-0 border-b border-l" />
                    <span className="scan-corner bottom-0 right-0 border-b border-r" />
                    <div className="scan-laser absolute left-3 right-3 top-1/2 h-[2px] shadow-laser" />
                    <QrCode size={40} strokeWidth={1} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-scanner-foreground/30 sm:size-50" />
                  </div>
                  <span className="absolute bottom-4 left-0 right-0 text-center text-[10px] font-medium text-scanner-foreground/80 sm:text-[11px]">Arahkan kamera ke QR kajian</span>
                </>
              )}
            </div>
          ) : (
            <div className="mx-auto flex aspect-[1.2] w-full max-w-[400px] flex-col items-center justify-center rounded-md border border-border bg-secondary/60 sm:aspect-[1.4] sm:max-w-[440px] p-6">
              {loadingHistory ? (
                <TableSkeleton rows={3} />
              ) : filteredHistory.length === 0 ? (
                <div className="text-center">
                  <Calendar size={32} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-semibold">Belum ada riwayat</p>
                  <p className="text-xs text-muted-foreground mt-1">Scan QR code untuk mencatat kehadiran</p>
                </div>
              ) : (
                <div className="w-full max-h-[300px] overflow-y-auto">
                  {filteredHistory.slice(0, 5).map((record) => (
                    <div key={record.id} className="mb-3 p-3 rounded-md bg-card border border-border">
                      <p className="text-xs font-semibold">{record.lesson}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatDate(record.scan_time)}</p>
                      <p className="text-[10px] text-muted-foreground">{formatTime(record.scan_time)}</p>
                      <span className={`inline-flex mt-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        record.status === "Hadir" ? "bg-sage-light text-primary" : 
                        record.status === "Izin" ? "bg-rose-light text-rose-foreground" : 
                        "bg-amber-light text-amber-foreground"
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2">
            <Button 
              className="h-10 sm:h-11" 
              onClick={() => { setMode("scan"); isScanning ? stopCamera() : startCamera(); }} 
              variant={isScanning ? "destructive" : "default"}
              disabled={!isOnline && !isScanning}
            >
              {isScanning ? <X size={14} className="sm:size-15" /> : <Camera size={14} className="sm:size-15" />}
              {isScanning ? "Tutup Kamera" : "Buka Kamera untuk Scan"}
            </Button>
            <Button variant="outline" className="h-10 sm:h-11" onClick={() => { setMode("history"); stopCamera(); }}><QrCode size={14} className="sm:size-15" /> Lihat Riwayat</Button>
          </div>
          <p className="mt-4 text-center text-[10px] text-muted-foreground sm:text-[11px]">Pastikan kamu berada di lokasi kajian saat melakukan absensi.</p>
        </div>
      </section>
      <div className="space-y-5 sm:space-y-6">
        <section className="rounded-md border border-border bg-sage-light p-5 sm:p-7"><div className="mb-4 flex h-9 w-9 items-center justify-center text-primary sm:h-10 sm:w-10"><Sparkles size={14} className="sm:size-16" /></div><h2 className="font-display text-lg font-bold text-foreground sm:text-xl">Adab kecil, pahala besar.</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Datang tepat waktu adalah awal dari ilmu yang penuh berkah. Sampai bertemu di majelis, ya!</p><div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs font-semibold text-primary sm:mt-6 sm:pt-5"><Clock3 size={12} className="sm:size-13" /> Kajian berikutnya: Jumat, 19.00 WIB</div></section>
        <section className="rounded-md border border-border bg-card p-5 shadow-soft sm:p-7"><div className="mb-4 flex items-center justify-between sm:mb-5"><div><p className="eyebrow">Rekap Bulan Ini</p><h2 className="section-title mt-1">Kehadiranmu</h2></div><span className="text-primary"><Check size={14} className="sm:size-16" /></span></div><div className="flex items-baseline gap-2"><strong className="font-display text-3xl font-bold text-primary sm:text-4xl">0%</strong><span className="text-xs text-muted-foreground">tingkat kehadiran</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary sm:mt-5"><div className="h-full w-[0%] rounded-full bg-primary" /></div><p className="mt-3 text-xs text-muted-foreground">Mulai hadir di kajian untuk mencatat kehadiranmu!</p></section>
      </div>
    </div>
    <section className="mt-7 overflow-hidden rounded-md border border-border bg-card shadow-soft sm:mt-9"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-4 sm:px-7 sm:py-5"><div><p className="eyebrow">Catatan Kehadiran</p><h2 className="section-title mt-1">Riwayat Absensi</h2></div><span className="text-xs text-muted-foreground">Semua waktu</span></div><div className="p-4 sm:p-7">
      {loadingHistory ? (
        <TableSkeleton rows={5} />
      ) : filteredHistory.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Belum ada riwayat absensi"
          description="Kamu belum pernah melakukan absensi kajian. Mulai hadir di kajian untuk mencatat kehadiranmu."
          variant="muted"
        />
      ) : (
        <>
          <div className="mb-5 flex gap-3 sm:mb-6"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="text" placeholder="Cari riwayat..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 h-10 rounded-md border border-border bg-background px-3 text-xs sm:h-11 sm:text-sm" /></div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[320px] text-left sm:min-w-[620px]"><thead className="bg-secondary/60 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]"><tr><th className="px-4 py-3 sm:px-7 sm:py-4">Tanggal</th><th className="px-3 py-3 sm:px-5 sm:py-4">Waktu Masuk</th><th className="px-3 py-3 sm:px-5 sm:py-4">Nama Kajian</th><th className="px-4 py-3 text-right sm:px-7 sm:py-4">Status</th></tr></thead><tbody>{filteredHistory.map((row) => <tr key={row.id} className="border-t border-border text-[11px] sm:text-sm"><td className="whitespace-nowrap px-4 py-3 font-semibold sm:px-7 sm:py-4">{formatDate(row.scan_time)}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{formatTime(row.scan_time)}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{row.lesson}</td><td className="px-4 py-3 text-right sm:px-7 sm:py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold sm:px-3 sm:py-1 sm:text-[11px] ${row.status === "Hadir" ? "bg-sage-light text-primary" : row.status === "Izin" ? "bg-rose-light text-rose-foreground" : "bg-amber-light text-amber-foreground"}`}>{row.status}</span></td></tr>)}</tbody></table></div>
        </>
      )}
    </div></section>
  </BQS SalsabillaShell>;
}