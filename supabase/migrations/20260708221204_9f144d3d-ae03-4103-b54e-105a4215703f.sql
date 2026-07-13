
-- Enums
CREATE TYPE public.app_role AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE public.raffle_status AS ENUM ('pending_verification','live','drawing','completed','refunded','cancelled');
CREATE TYPE public.sellout_policy AS ENUM ('extend','proportional','refund');
CREATE TYPE public.payment_type AS ENUM ('ticket_purchase','payout','refund');
CREATE TYPE public.payment_status AS ENUM ('pending','held','released','refunded','failed');
CREATE TYPE public.verification_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.dispute_status AS ENUM ('open','under_review','resolved','rejected');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  kyc_status TEXT NOT NULL DEFAULT 'unverified',
  age_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by anyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Raffles
CREATE TABLE public.raffles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  target_value NUMERIC(12,2) NOT NULL,
  ticket_price NUMERIC(12,2) NOT NULL,
  total_tickets INTEGER NOT NULL,
  tickets_sold INTEGER NOT NULL DEFAULT 0,
  status public.raffle_status NOT NULL DEFAULT 'pending_verification',
  sellout_policy public.sellout_policy NOT NULL DEFAULT 'refund',
  min_tickets_threshold INTEGER NOT NULL DEFAULT 0,
  deadline TIMESTAMPTZ NOT NULL,
  hero_image TEXT,
  serial_number TEXT,
  commit_hash TEXT NOT NULL,
  seed_encrypted TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_raffles_status ON public.raffles(status);
CREATE INDEX idx_raffles_seller ON public.raffles(seller_id);
GRANT SELECT, INSERT, UPDATE ON public.raffles TO authenticated;
GRANT SELECT ON public.raffles TO anon;
GRANT ALL ON public.raffles TO service_role;
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public sees live/completed raffles" ON public.raffles FOR SELECT
  USING (status IN ('live','drawing','completed','refunded'));
CREATE POLICY "sellers see own raffles" ON public.raffles FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "sellers insert own raffles" ON public.raffles FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "admins full raffles" ON public.raffles FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Raffle images
CREATE TABLE public.raffle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, DELETE ON public.raffle_images TO authenticated;
GRANT SELECT ON public.raffle_images TO anon;
GRANT ALL ON public.raffle_images TO service_role;
ALTER TABLE public.raffle_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "images readable by all" ON public.raffle_images FOR SELECT USING (true);
CREATE POLICY "sellers manage own raffle images" ON public.raffle_images FOR ALL
  USING (EXISTS (SELECT 1 FROM public.raffles r WHERE r.id = raffle_id AND r.seller_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.raffles r WHERE r.id = raffle_id AND r.seller_id = auth.uid()));

-- Tickets
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_number INTEGER NOT NULL,
  payment_id UUID,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (raffle_id, ticket_number)
);
CREATE INDEX idx_tickets_raffle ON public.tickets(raffle_id);
CREATE INDEX idx_tickets_buyer ON public.tickets(buyer_id);
GRANT SELECT, INSERT ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buyers see own tickets" ON public.tickets FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "sellers see raffle tickets" ON public.tickets FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.raffles r WHERE r.id = raffle_id AND r.seller_id = auth.uid()));
CREATE POLICY "admins see all tickets" ON public.tickets FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  raffle_id UUID REFERENCES public.raffles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  type public.payment_type NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sellers see raffle payments" ON public.payments FOR SELECT
  USING (raffle_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.raffles r WHERE r.id = raffle_id AND r.seller_id = auth.uid()));
CREATE POLICY "admins full payments" ON public.payments FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Verifications
CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.verification_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  photo_url TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.verifications TO authenticated;
GRANT ALL ON public.verifications TO service_role;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sellers see own verifications" ON public.verifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.raffles r WHERE r.id = raffle_id AND r.seller_id = auth.uid()));
CREATE POLICY "admins full verifications" ON public.verifications FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Draws
CREATE TABLE public.draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL UNIQUE REFERENCES public.raffles(id) ON DELETE CASCADE,
  commit_hash TEXT NOT NULL,
  seed_revealed TEXT NOT NULL,
  public_input TEXT NOT NULL,
  public_input_source TEXT NOT NULL,
  winning_ticket_number INTEGER NOT NULL,
  winner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  proof JSONB NOT NULL,
  drawn_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.draws TO authenticated;
GRANT SELECT ON public.draws TO anon;
GRANT ALL ON public.draws TO service_role;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "draws readable by all" ON public.draws FOR SELECT USING (true);

-- Disputes
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID REFERENCES public.raffles(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status public.dispute_status NOT NULL DEFAULT 'open',
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.disputes TO authenticated;
GRANT ALL ON public.disputes TO service_role;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own disputes" ON public.disputes FOR SELECT USING (auth.uid() = opened_by);
CREATE POLICY "users open dispute" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = opened_by);
CREATE POLICY "admins full disputes" ON public.disputes FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  payload JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_raffles_updated BEFORE UPDATE ON public.raffles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_disputes_updated BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Atomic ticket allocation RPC
CREATE OR REPLACE FUNCTION public.allocate_tickets(_raffle_id UUID, _buyer_id UUID, _qty INTEGER, _payment_id UUID)
RETURNS INTEGER[] LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _current INTEGER;
  _total INTEGER;
  _status public.raffle_status;
  _start INTEGER;
  _numbers INTEGER[] := ARRAY[]::INTEGER[];
  _i INTEGER;
BEGIN
  SELECT tickets_sold, total_tickets, status INTO _current, _total, _status
  FROM public.raffles WHERE id = _raffle_id FOR UPDATE;
  IF _status <> 'live' THEN RAISE EXCEPTION 'Raffle not live'; END IF;
  IF _current + _qty > _total THEN RAISE EXCEPTION 'Not enough tickets available'; END IF;
  _start := _current + 1;
  FOR _i IN 0 .. _qty - 1 LOOP
    INSERT INTO public.tickets (raffle_id, buyer_id, ticket_number, payment_id)
    VALUES (_raffle_id, _buyer_id, _start + _i, _payment_id);
    _numbers := array_append(_numbers, _start + _i);
  END LOOP;
  UPDATE public.raffles SET tickets_sold = _current + _qty WHERE id = _raffle_id;
  RETURN _numbers;
END; $$;
