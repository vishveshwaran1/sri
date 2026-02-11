
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'technician', 'viewer');

-- Create device status enum
CREATE TYPE public.device_status AS ENUM ('online', 'offline', 'maintenance', 'alert');

-- Create alert type enum
CREATE TYPE public.alert_type AS ENUM ('theft', 'wastage', 'anomaly');

-- Create alert severity enum
CREATE TYPE public.alert_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Devices table
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  zone TEXT,
  status device_status NOT NULL DEFAULT 'offline',
  assigned_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sensor readings table
CREATE TABLE public.sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE NOT NULL,
  voltage DOUBLE PRECISION NOT NULL DEFAULT 0,
  current DOUBLE PRECISION NOT NULL DEFAULT 0,
  power DOUBLE PRECISION NOT NULL DEFAULT 0,
  ldr DOUBLE PRECISION DEFAULT 0,
  pir INTEGER DEFAULT 0,
  energy_kwh DOUBLE PRECISION DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE NOT NULL,
  type alert_type NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'medium',
  message TEXT,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maintenance logs table
CREATE TABLE public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  action TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Device API keys table (for ESP32 auth)
CREATE TABLE public.device_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_sensor_readings_device_time ON public.sensor_readings(device_id, recorded_at DESC);
CREATE INDEX idx_alerts_device_time ON public.alerts(device_id, created_at DESC);
CREATE INDEX idx_devices_assigned_user ON public.devices(assigned_user);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- Helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_technician_or_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'technician')
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  -- Default role: viewer
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies: profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies: user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.is_admin());
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.is_admin());

-- RLS Policies: devices
CREATE POLICY "Admins can manage all devices" ON public.devices FOR ALL USING (public.is_admin());
CREATE POLICY "Users can view assigned devices" ON public.devices FOR SELECT USING (assigned_user = auth.uid());

-- RLS Policies: sensor_readings
CREATE POLICY "Admins can manage all readings" ON public.sensor_readings FOR ALL USING (public.is_admin());
CREATE POLICY "Users can view readings of assigned devices" ON public.sensor_readings FOR SELECT
  USING (device_id IN (SELECT id FROM public.devices WHERE assigned_user = auth.uid()));

-- RLS Policies: alerts
CREATE POLICY "Admins can manage all alerts" ON public.alerts FOR ALL USING (public.is_admin());
CREATE POLICY "Users can view alerts of assigned devices" ON public.alerts FOR SELECT
  USING (device_id IN (SELECT id FROM public.devices WHERE assigned_user = auth.uid()));
CREATE POLICY "Users can acknowledge alerts of assigned devices" ON public.alerts FOR UPDATE
  USING (device_id IN (SELECT id FROM public.devices WHERE assigned_user = auth.uid()));

-- RLS Policies: maintenance_logs
CREATE POLICY "Admins can manage all logs" ON public.maintenance_logs FOR ALL USING (public.is_admin());
CREATE POLICY "Technicians can create logs for assigned devices" ON public.maintenance_logs FOR INSERT
  WITH CHECK (public.is_technician_or_admin() AND device_id IN (SELECT id FROM public.devices WHERE assigned_user = auth.uid()));
CREATE POLICY "Users can view logs of assigned devices" ON public.maintenance_logs FOR SELECT
  USING (device_id IN (SELECT id FROM public.devices WHERE assigned_user = auth.uid()));

-- RLS Policies: device_api_keys
CREATE POLICY "Admins can manage API keys" ON public.device_api_keys FOR ALL USING (public.is_admin());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
