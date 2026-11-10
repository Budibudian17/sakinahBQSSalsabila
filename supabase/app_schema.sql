-- Application schema additions and compatibility updates.
-- Run this AFTER setup.sql in Supabase Dashboard -> SQL Editor.
-- Safe to run again; it does not delete application data.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pendidikan text,
  ADD COLUMN IF NOT EXISTS rt text,
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.schedules
  ALTER COLUMN subject SET DEFAULT '',
  ADD COLUMN IF NOT EXISTS judul text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS kategori text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hari text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS waktu text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ruang text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ustadzah text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Aktif',
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_announcement boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS announcement_title text,
  ADD COLUMN IF NOT EXISTS announcement text,
  ADD COLUMN IF NOT EXISTS announcement_date date,
  ADD COLUMN IF NOT EXISTS announcement_time text,
  ADD COLUMN IF NOT EXISTS deskripsi text;

UPDATE public.schedules
SET judul = COALESCE(NULLIF(judul, ''), subject, ''),
    subject = COALESCE(NULLIF(subject, ''), judul, ''),
    kategori = COALESCE(NULLIF(kategori, ''), category, ''),
    category = COALESCE(NULLIF(category, ''), kategori, ''),
    hari = COALESCE(NULLIF(hari, ''), day_label, ''),
    day_label = COALESCE(NULLIF(day_label, ''), hari, ''),
    ruang = COALESCE(NULLIF(ruang, ''), room, ''),
    room = COALESCE(NULLIF(room, ''), ruang, ''),
    ustadzah = COALESCE(NULLIF(ustadzah, ''), teacher, ''),
    teacher = COALESCE(NULLIF(teacher, ''), ustadzah, '');

CREATE OR REPLACE FUNCTION public.sync_schedule_column_names()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.judul := COALESCE(NULLIF(NEW.judul, ''), NULLIF(NEW.subject, ''), '');
  NEW.subject := COALESCE(NULLIF(NEW.subject, ''), NEW.judul, '');
  NEW.kategori := COALESCE(NULLIF(NEW.kategori, ''), NULLIF(NEW.category, ''), '');
  NEW.category := COALESCE(NULLIF(NEW.category, ''), NEW.kategori, '');
  NEW.hari := COALESCE(NULLIF(NEW.hari, ''), NULLIF(NEW.day_label, ''), '');
  NEW.day_label := COALESCE(NULLIF(NEW.day_label, ''), NEW.hari, '');
  NEW.ruang := COALESCE(NULLIF(NEW.ruang, ''), NULLIF(NEW.room, ''), '');
  NEW.room := COALESCE(NULLIF(NEW.room, ''), NEW.ruang, '');
  NEW.ustadzah := COALESCE(NULLIF(NEW.ustadzah, ''), NULLIF(NEW.teacher, ''), '');
  NEW.teacher := COALESCE(NULLIF(NEW.teacher, ''), NEW.ustadzah, '');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_schedule_column_names ON public.schedules;
CREATE TRIGGER sync_schedule_column_names
  BEFORE INSERT OR UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.sync_schedule_column_names();

CREATE TABLE IF NOT EXISTS public.materi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul text NOT NULL,
  kategori text NOT NULL DEFAULT '',
  ustadzah text NOT NULL DEFAULT '',
  tanggal date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'Draft',
  konten text,
  file_url text,
  schedule_id uuid REFERENCES public.schedules(id) ON DELETE SET NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.keuangan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jenis_transaksi text NOT NULL DEFAULT 'masuk',
  kategori text NOT NULL,
  nominal numeric(12, 2) NOT NULL CHECK (nominal >= 0),
  deskripsi text,
  tanggal date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'Pending',
  bukti_pembayaran text,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS keuangan_user_created_idx
  ON public.keuangan (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS keuangan_category_date_idx
  ON public.keuangan (kategori, tanggal DESC);

CREATE TABLE IF NOT EXISTS public.financial_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.financial_settings (setting_name, setting_value, description)
VALUES
  ('uang_kas_mingguan', '10000', 'Nominal uang kas mingguan'),
  ('uang_kas_bulanan', '40000', 'Nominal uang kas bulanan')
ON CONFLICT (setting_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.hafalan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah text NOT NULL,
  ayat text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('completed', 'in_progress', 'not_started')),
  grade text,
  notes text,
  ustadzah text,
  assessed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nilai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  category text NOT NULL DEFAULT '',
  grade text NOT NULL,
  score numeric(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
  notes text,
  ustadzah text,
  assessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hafalan_user_created_idx
  ON public.hafalan (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS nilai_user_created_idx
  ON public.nilai (user_id, created_at DESC);

-- The dashboard's memorization summary reads the same records entered as hafalan.
CREATE OR REPLACE VIEW public.memorization
WITH (security_invoker = true)
AS
  SELECT id, user_id, surah, status, created_at
  FROM public.hafalan;

INSERT INTO public.profiles (id, full_name, email)
SELECT id,
       COALESCE(raw_user_meta_data->>'full_name', ''),
       COALESCE(email, '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attendance_profile_fkey'
  ) THEN
    ALTER TABLE public.attendance
      ADD CONSTRAINT attendance_profile_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'qr_attendance_profile_fkey'
  ) THEN
    ALTER TABLE public.qr_attendance
      ADD CONSTRAINT qr_attendance_profile_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.profiles, public.user_roles, public.schedules, public.attendance,
  public.qr_codes, public.qr_attendance, public.materi, public.keuangan,
  public.financial_settings, public.hafalan, public.nilai
  TO authenticated;
GRANT SELECT ON public.memorization TO authenticated;
GRANT ALL ON
  public.materi, public.keuangan, public.financial_settings, public.hafalan, public.nilai
  TO service_role;

ALTER TABLE public.materi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keuangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hafalan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nilai ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users and staff read roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin manage user roles" ON public.user_roles;
CREATE POLICY "Users and staff read roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR public.has_role((SELECT auth.uid()), 'guru'::public.app_role)
  );
CREATE POLICY "Admin manage user roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Read own profile or admin" ON public.profiles;
DROP POLICY IF EXISTS "Users and staff read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;
CREATE POLICY "Users and staff read profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR public.has_role((SELECT auth.uid()), 'guru'::public.app_role)
  );
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY "Admin manage profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Signed-in read schedules" ON public.schedules;
DROP POLICY IF EXISTS "Admin manage schedules" ON public.schedules;
CREATE POLICY "Signed-in read schedules" ON public.schedules
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage schedules" ON public.schedules
  FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Read own attendance or admin" ON public.attendance;
DROP POLICY IF EXISTS "Insert own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admin manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users and staff read attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users insert own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users delete own attendance" ON public.attendance;
CREATE POLICY "Users and staff read attendance" ON public.attendance
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR public.has_role((SELECT auth.uid()), 'guru'::public.app_role)
  );
CREATE POLICY "Users insert own attendance" ON public.attendance
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users delete own attendance" ON public.attendance
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Admin manage attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Public read active QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Signed-in read active QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Admin manage QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Admin read all QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Admin insert QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Admin update QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Users update own QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Admin delete QR codes" ON public.qr_codes;
CREATE POLICY "Signed-in read active QR codes" ON public.qr_codes
  FOR SELECT TO authenticated
  USING (
    is_active = true
    OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );
CREATE POLICY "Admin manage QR codes" ON public.qr_codes
  FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Public read attendance" ON public.qr_attendance;
DROP POLICY IF EXISTS "Users and staff read QR attendance" ON public.qr_attendance;
DROP POLICY IF EXISTS "Users insert own QR attendance" ON public.qr_attendance;
DROP POLICY IF EXISTS "Admin manage QR attendance" ON public.qr_attendance;
DROP POLICY IF EXISTS "Authenticated insert own attendance" ON public.qr_attendance;
DROP POLICY IF EXISTS "Admin read all attendance" ON public.qr_attendance;
DROP POLICY IF EXISTS "Admin manage attendance" ON public.qr_attendance;
CREATE POLICY "Users and staff read QR attendance" ON public.qr_attendance
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR public.has_role((SELECT auth.uid()), 'guru'::public.app_role)
  );
CREATE POLICY "Users insert own QR attendance" ON public.qr_attendance
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Admin manage QR attendance" ON public.qr_attendance
  FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Read published materials" ON public.materi;
DROP POLICY IF EXISTS "Admin manage materials" ON public.materi;
CREATE POLICY "Read published materials" ON public.materi
  FOR SELECT TO authenticated
  USING (
    (status = 'Terbit' AND is_deleted = false)
    OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );
CREATE POLICY "Admin manage materials" ON public.materi
  FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users read own transactions" ON public.keuangan;
DROP POLICY IF EXISTS "Users and admin read transactions" ON public.keuangan;
DROP POLICY IF EXISTS "Users insert own transactions" ON public.keuangan;
DROP POLICY IF EXISTS "Admin manage transactions" ON public.keuangan;
CREATE POLICY "Users and admin read transactions" ON public.keuangan
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );
CREATE POLICY "Users insert own transactions" ON public.keuangan
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Admin manage transactions" ON public.keuangan
  FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Authenticated read financial settings" ON public.financial_settings;
DROP POLICY IF EXISTS "Admin manage financial settings" ON public.financial_settings;
CREATE POLICY "Authenticated read financial settings" ON public.financial_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage financial settings" ON public.financial_settings
  FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users and staff read hafalan" ON public.hafalan;
DROP POLICY IF EXISTS "Staff manage hafalan" ON public.hafalan;
CREATE POLICY "Users and staff read hafalan" ON public.hafalan
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR public.has_role((SELECT auth.uid()), 'guru'::public.app_role)
  );
CREATE POLICY "Staff manage hafalan" ON public.hafalan
  FOR ALL TO authenticated
  USING (
    public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR public.has_role((SELECT auth.uid()), 'guru'::public.app_role)
  )
  WITH CHECK (
    public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR public.has_role((SELECT auth.uid()), 'guru'::public.app_role)
  );

DROP POLICY IF EXISTS "Users and staff read grades" ON public.nilai;
DROP POLICY IF EXISTS "Staff manage grades" ON public.nilai;
CREATE POLICY "Users and staff read grades" ON public.nilai
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR public.has_role((SELECT auth.uid()), 'guru'::public.app_role)
  );
CREATE POLICY "Staff manage grades" ON public.nilai
  FOR ALL TO authenticated
  USING (
    public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR public.has_role((SELECT auth.uid()), 'guru'::public.app_role)
  )
  WITH CHECK (
    public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR public.has_role((SELECT auth.uid()), 'guru'::public.app_role)
  );

NOTIFY pgrst, 'reload schema';
