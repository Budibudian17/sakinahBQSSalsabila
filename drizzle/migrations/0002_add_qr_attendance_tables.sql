-- Create overload function for has_role to accept text parameter
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = _role)
$$;

-- Create qr_codes table for QR code attendance system
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson text NOT NULL,
  date text NOT NULL,
  qr_code_data text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create qr_attendance table for tracking QR code scans
CREATE TABLE IF NOT EXISTS public.qr_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id uuid NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Hadir',
  scan_time timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS qr_codes_active_idx ON public.qr_codes(is_active, expires_at);
CREATE INDEX IF NOT EXISTS qr_attendance_user_idx ON public.qr_attendance(user_id, scan_time DESC);
CREATE INDEX IF NOT EXISTS qr_attendance_qr_idx ON public.qr_attendance(qr_code_id, user_id);

-- Enable Row Level Security
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qr_codes
-- Everyone can read active QR codes
CREATE POLICY "Public read active QR codes" ON public.qr_codes FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Admin can read all QR codes
CREATE POLICY "Admin read all QR codes" ON public.qr_codes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert QR codes
CREATE POLICY "Admin insert QR codes" ON public.qr_codes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can update QR codes (including deactivation)
CREATE POLICY "Admin update QR codes" ON public.qr_codes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR created_by = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR created_by = auth.uid());

-- Users can update their own QR codes
CREATE POLICY "Users update own QR codes" ON public.qr_codes FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Admin can delete QR codes
CREATE POLICY "Admin delete QR codes" ON public.qr_codes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR created_by = auth.uid());

-- RLS Policies for qr_attendance
-- Everyone can read attendance records
CREATE POLICY "Public read attendance" ON public.qr_attendance FOR SELECT
  TO authenticated, anon
  USING (true);

-- Authenticated users can insert their own attendance
CREATE POLICY "Authenticated insert own attendance" ON public.qr_attendance FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admin can read all attendance
CREATE POLICY "Admin read all attendance" ON public.qr_attendance FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can manage attendance
CREATE POLICY "Admin manage attendance" ON public.qr_attendance FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_codes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_attendance TO service_role;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for qr_codes
CREATE TRIGGER update_qr_codes_updated_at
  BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();