import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Users, Plus, Search, Filter, MoreVertical, CheckCircle2, TrendingUp, Edit, Trash2, X, AlertCircle, ChevronLeft, ChevronRight, Check } from "lucide-react";
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

export const Route = createFileRoute("/admin-siswa")({
  head: () => ({ meta: [
    { title: "Manajemen Siswi — BQS Salsabilla Ruang Muslimah" },
    { name: "description", content: "Kelola data santriwati BQS Salsabilla Ruang Muslimah." },
    { property: "og:title", content: "Manajemen Siswi — BQS Salsabilla Ruang Muslimah" },
    { property: "og:description", content: "Kelola data santriwati BQS Salsabilla Ruang Muslimah." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdminSiswaPage,
});

type Student = {
  id: string;
  full_name: string;
  email: string;
  pendidikan?: string | null;
  rt?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
};

function AdminSiswaPage() {
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useClickOutside(dropdownRef, () => setActiveDropdown(null), activeDropdown !== null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    pendidikan: "",
    rt: ""
  });
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render
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

  // Fetch students from Supabase
  useEffect(() => {
    fetchStudents(true);
  }, []);

  const fetchStudents = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      console.log('Fetching students with fresh request...');

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles' as any)
        .select('*')
        .is('is_deleted' as any, false) // Filter out soft-deleted records
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user_ids with santri role
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles' as any)
        .select('user_id, role')
        .eq('role' as any, 'santri' as any);

      if (rolesError) throw rolesError;

      // Get list of santri user_ids
      const santriUserIds = new Set((userRoles || []).map((ur: any) => ur.user_id));

      // Filter profiles to only include santri
      const santriProfiles = (profiles || []).filter((profile: any) =>
        santriUserIds.has(profile.id)
      );

      console.log('Fetched students:', santriProfiles);
      console.log('Number of students fetched:', santriProfiles?.length || 0);

      // Check if there are duplicate IDs
      const idCounts = santriProfiles?.reduce((acc, student: any) => {
        acc[student.id] = (acc[student.id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const duplicates = Object.entries(idCounts).filter(([_, count]) => count > 1);
      if (duplicates.length > 0) {
        console.log('Found duplicate IDs:', duplicates);
      }

      setStudentsData(santriProfiles as unknown as Student[]);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data siswi');
      setAlertDialog({
        open: true,
        title: 'Gagal Memuat Data',
        description: err instanceof Error ? err.message : 'Gagal memuat data siswi',
        type: 'error',
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    setFormData({
      full_name: "",
      email: "",
      pendidikan: "",
      rt: ""
    });
    setIsModalOpen(true);
  };

  const handleCancelModal = () => {
    // Check if form has unsaved changes
    if (formData.full_name || formData.email || formData.pendidikan || formData.rt) {
      setAlertDialog({
        open: true,
        title: 'Batal',
        description: 'Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin membatalkan?',
        type: 'confirm',
        onConfirm: () => {
          setIsModalOpen(false);
          setFormData({
            full_name: "",
            email: "",
            pendidikan: "",
            rt: ""
          });
        }
      });
    } else {
      setIsModalOpen(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name,
      email: student.email,
      pendidikan: student.pendidikan || "",
      rt: student.rt || ""
    });
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDeleteStudent = async (id: string) => {
    setAlertDialog({
      open: true,
      title: 'Hapus Data Siswi',
      description: 'Apakah Anda yakin ingin menghapus data siswi ini? Data yang dihapus tidak dapat dikembalikan.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          console.log('Deleting student with ID:', id);

          // Delete from user_roles first
          const { error: roleError } = await supabase
            .from('user_roles' as any)
            .delete()
            .eq('user_id' as any, id as any);

          if (roleError) {
            console.error('Error deleting from user_roles:', roleError);
            // Continue anyway
          } else {
            console.log('Successfully deleted from user_roles');
          }

          // Soft delete from profiles by marking is_deleted as true
          const { error: profileError } = await supabase
            .from('profiles' as any)
            .update({
              is_deleted: true,
              deleted_at: new Date().toISOString()
            } as any)
            .eq('id' as any, id as any);

          if (profileError) {
            console.error('Error soft deleting from profiles:', profileError);
            throw profileError;
          }

          console.log('Successfully soft deleted from profiles');

          // Force refresh from database to ensure UI is in sync
          await fetchStudents(false);

          // Reset pagination
          setSearchQuery('');
          setCurrentPage(1);
          setActiveDropdown(null);

          console.log('UI updated successfully');

          setAlertDialog({
            open: true,
            title: 'Berhasil',
            description: 'Data siswi berhasil dihapus.',
            type: 'success',
          });
        } catch (err) {
          console.error('Error deleting student:', err);
          setAlertDialog({
            open: true,
            title: 'Gagal',
            description: err instanceof Error ? err.message : 'Gagal menghapus data',
            type: 'error',
          });
        }
      }
    });
  };

  const handleSaveStudent = async () => {
    // Validation
    if (!formData.full_name.trim()) {
      setAlertDialog({
        open: true,
        title: 'Validasi',
        description: 'Nama lengkap harus diisi.',
        type: 'error',
      });
      return;
    }

    if (!formData.email.trim()) {
      setAlertDialog({
        open: true,
        title: 'Validasi',
        description: 'Email harus diisi.',
        type: 'error',
      });
      return;
    }

    try {
      if (editingStudent) {
        console.log('Updating student:', editingStudent.id);
        // Update existing student
        const updateData: any = {
          full_name: formData.full_name,
          email: formData.email,
        };

        if (formData.pendidikan) updateData.pendidikan = formData.pendidikan;
        if (formData.rt) updateData.rt = formData.rt;

        const { error } = await supabase
          .from('profiles' as any)
          .update(updateData)
          .eq('id' as any, editingStudent.id as any);

        if (error) throw error;

        console.log('Student updated, updating UI...');
        // Manual state update
        setStudentsData(prev => prev.map(s =>
          s.id === editingStudent.id ? { ...s, ...formData } : s
        ));
        setIsModalOpen(false);
        setAlertDialog({
          open: true,
          title: 'Berhasil',
          description: 'Data siswi berhasil diperbarui.',
          type: 'success',
        });
      } else {
        console.log('Creating new student...');
        // Create new student
        const insertData: any = {
          full_name: formData.full_name,
          email: formData.email,
        };

        if (formData.pendidikan) insertData.pendidikan = formData.pendidikan;
        if (formData.rt) insertData.rt = formData.rt;

        const { data, error } = await supabase
          .from('profiles' as any)
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;

        // Assign santri role
        const roleError = await supabase
          .from('user_roles' as any)
          .insert({
            user_id: (data as any).id,
            role: 'santri'
          } as any);

        if (roleError.error) {
          console.error('Error assigning role:', roleError.error);
          // Continue anyway - profile was created successfully
        }

        console.log('Student created, updating UI...');
        // Manual state update
        setStudentsData(prev => [data as unknown as Student, ...prev]);
        setCurrentPage(1);
        setIsModalOpen(false);
        setAlertDialog({
          open: true,
          title: 'Berhasil',
          description: 'Siswi baru berhasil ditambahkan.',
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Error saving student:', err);
      setAlertDialog({
        open: true,
        title: 'Gagal',
        description: err instanceof Error ? err.message : 'Gagal menyimpan data',
        type: 'error',
      });
    }
  };

  const filteredStudents = studentsData.filter(student =>
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.pendidikan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.rt || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  // Log for debugging
  console.log('Total students:', studentsData.length);
  console.log('Filtered students:', filteredStudents.length);
  console.log('Current page:', currentPage);
  console.log('Current students displayed:', currentStudents.length);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return <AdminShell>
    <div className="mb-6 sm:mb-8">
      <Link to="/admin" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:mb-5"><ArrowLeft size={12} /> Kembali ke dashboard</Link>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Manajemen Santriwati</p><h1 className="page-title">Data Siswi <span className="text-rose">✦</span></h1><p className="mt-2 text-sm text-muted-foreground">Kelola data santriwati, pendaftaran, dan profil siswi.</p></div><Button className="h-10 sm:h-11" onClick={handleAddStudent}><Plus size={14} className="sm:size-15" /> Tambah Siswi</Button></div>
    </div>

    {error && (
      <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    )}

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(330px,.95fr)]">
      <section className="overflow-hidden rounded-md border border-border bg-card shadow-soft">
        <div className="border-b border-border px-4 py-4 sm:px-7 sm:py-5"><div className="flex items-center gap-2"><Users size={14} className="text-primary sm:size-15" /><h2 className="section-title">Daftar Santriwati</h2></div><p className="mt-1.5 text-xs text-muted-foreground">Data santriwati terdaftar di BQS Salsabilla Ruang Muslimah.</p></div>
        <div className="p-4 sm:p-7">
          <div className="mb-5 flex gap-3 sm:mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari siswi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 h-10 rounded-md border border-border bg-background px-3 text-xs sm:h-11 sm:text-sm"
              />
            </div>
            <Button variant="outline" className="h-10 sm:h-11" onClick={() => setAlertDialog({
              open: true,
              title: 'Filter',
              description: 'Fitur filter akan segera tersedia.',
              type: 'success',
            })}><Filter size={14} className="sm:size-15" /> Filter</Button>
          </div>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : currentStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Belum ada data santriwati</p>
              <p className="text-xs text-muted-foreground mt-1">Tambahkan santriwati baru untuk memulai</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto"><table key={refreshKey} className="w-full min-w-[320px] text-left sm:min-w-[620px]"><thead className="bg-secondary/60 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]"><tr><th className="px-4 py-3 sm:px-7 sm:py-4">Nama</th><th className="px-3 py-3 sm:px-5 sm:py-4">Email</th><th className="px-3 py-3 sm:px-5 sm:py-4">Pendidikan</th><th className="px-3 py-3 sm:px-5 sm:py-4">RT</th><th className="px-4 py-3 text-right sm:px-7 sm:py-4">Aksi</th></tr></thead><tbody>{currentStudents.map((student) => <tr key={student.id} className="border-t border-border text-[11px] sm:text-sm"><td className="px-4 py-3 font-semibold sm:px-7 sm:py-4">{student.full_name}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{student.email}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{student.pendidikan || '-'}</td><td className="px-3 py-3 text-muted-foreground sm:px-5 sm:py-4">{student.rt || '-'}</td><td className="px-4 py-3 text-right sm:px-7 sm:py-4 relative"><div className="relative inline-block" ref={activeDropdown === student.id ? dropdownRef : null}><Button variant="ghost" size="sm" className="h-6 px-1.5 text-[8px] sm:h-8 sm:px-2 sm:text-xs" onClick={() => setActiveDropdown(activeDropdown === student.id ? null : student.id)}><MoreVertical size={12} /></Button>{activeDropdown === student.id && (<div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-md border border-border bg-card shadow-lg sm:w-40"><button onClick={() => handleEditStudent(student)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left hover:bg-secondary sm:text-sm"><Edit size={12} /> Edit</button><button onClick={() => handleDeleteStudent(student.id)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left text-destructive hover:bg-destructive/10 sm:text-sm"><Trash2 size={12} /> Hapus</button></div>)}</div></td></tr>)}</tbody></table></div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[10px] text-muted-foreground sm:text-xs">
                    Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredStudents.length)} dari {filteredStudents.length} siswi
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
        <section className="rounded-md border border-border bg-sage-light p-5 sm:p-7"><div className="mb-4 flex h-10 w-10 items-center justify-center text-primary"><TrendingUp size={20} /></div><h2 className="font-display text-lg font-bold text-foreground sm:text-xl">Pertumbuhan santriwati.</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Pantau perkembangan jumlah santriwati dan tingkat keaktifan mereka dalam kegiatan kajian.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Siswi</p><p className="font-display text-2xl font-bold text-primary sm:text-3xl">{studentsData.length}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Siswi Aktif</p><p className="font-display text-2xl font-bold text-primary sm:text-3xl">{studentsData.length}</p></div></div></section>
        <section className="rounded-md border border-border bg-card p-5 shadow-soft sm:p-7"><div className="mb-4 flex items-center justify-between sm:mb-5"><div><p className="eyebrow">Status Pendaftaran</p><h2 className="section-title mt-1">Database Terhubung</h2></div><span className="text-primary"><CheckCircle2 size={20} /></span></div><div className="flex items-baseline gap-2"><strong className="font-display text-3xl font-bold text-primary sm:text-4xl">✓</strong><span className="text-xs text-muted-foreground">Supabase aktif</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary sm:mt-5"><div className="h-full w-full rounded-full bg-primary" /></div><p className="mt-3 text-xs text-muted-foreground">Data disimpan secara real-time di Supabase</p></section>
      </div>
    </div>
    {isModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-md border border-border bg-card p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">{editingStudent ? "Edit Siswi" : "Tambah Siswi"}</h3>
            <Button variant="ghost" size="sm" onClick={handleCancelModal}>
              <X size={16} />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold">Nama Lengkap</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
                placeholder="Nama lengkap siswi"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
                placeholder="contoh@sakinah.id"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Pendidikan</label>
              <select
                value={formData.pendidikan}
                onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
              >
                <option value="">Pilih pendidikan</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
                <option value="SMK">SMK</option>
                <option value="Kuliah">Kuliah</option>
                <option value="Kerja">Kerja</option>
                <option value="Lulus">Lulus</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">RT</label>
              <input
                type="text"
                value={formData.rt}
                onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm"
                placeholder="Contoh: RT 01"
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleCancelModal}>Batal</Button>
            <Button className="flex-1" onClick={handleSaveStudent}>Simpan</Button>
          </div>
        </div>
      </div>
    )}

    {/* Alert Dialog */}
    <AlertDialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog({ ...alertDialog, open })}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            {alertDialog.type === 'success' && <Check className="text-green-500" size={20} />}
            {alertDialog.type === 'error' && <AlertCircle className="text-destructive" size={20} />}
            {alertDialog.type === 'confirm' && <AlertCircle className="text-destructive" size={20} />}
            <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{alertDialog.description}</AlertDialogDescription>
        </AlertDialogHeader>
        {alertDialog.type === 'confirm' ? (
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlertDialog({ ...alertDialog, open: false })}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (alertDialog.onConfirm) {
                alertDialog.onConfirm();
              }
            }}>Ya, Hapus</AlertDialogAction>
          </AlertDialogFooter>
        ) : (
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertDialog({ ...alertDialog, open: false })}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  </AdminShell>;
}
