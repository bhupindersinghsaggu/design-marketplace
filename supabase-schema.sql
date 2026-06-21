-- ============================================
-- DESIGN MARKETPLACE - SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. PROFILES (extends auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'creator', 'admin')),
  bio text,
  bank_account text,
  bank_ifsc text,
  upi_id text,
  total_earnings numeric(10,2) not null default 0,
  total_withdrawn numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 2. CATEGORIES
-- ============================================
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  slug text not null unique,
  icon text
);

insert into public.categories (name, slug, icon) values
  ('Logo', 'logo', '🎯'),
  ('Banner', 'banner', '🖼️'),
  ('Flyer', 'flyer', '📄'),
  ('Business Card', 'business-card', '💳'),
  ('Social Media', 'social-media', '📱'),
  ('T-Shirt Design', 't-shirt', '👕'),
  ('Invitation', 'invitation', '💌'),
  ('Certificate', 'certificate', '🏆'),
  ('Brochure', 'brochure', '📋'),
  ('Poster', 'poster', '📢');

-- ============================================
-- 3. DESIGNS
-- ============================================
create table public.designs (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  category_id uuid references public.categories(id),
  tags text[] default '{}',
  type text not null default 'free' check (type in ('free', 'premium')),
  price numeric(10,2) default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  downloads_count integer not null default 0,
  preview_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index designs_status_idx on public.designs(status);
create index designs_type_idx on public.designs(type);
create index designs_creator_idx on public.designs(creator_id);

-- ============================================
-- 4. DESIGN FILES
-- ============================================
create table public.design_files (
  id uuid default uuid_generate_v4() primary key,
  design_id uuid references public.designs(id) on delete cascade not null,
  file_type text not null check (file_type in ('cdr', 'svg', 'psd', 'ai', 'png', 'jpg')),
  file_url text not null,
  file_key text not null,
  file_size bigint,
  original_name text
);

-- ============================================
-- 5. SUBSCRIPTION PLANS
-- ============================================
create table public.subscription_plans (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  tier text not null check (tier in ('basic', 'pro')),
  interval text not null check (interval in ('monthly', 'yearly')),
  price numeric(10,2) not null,
  features text[] default '{}',
  razorpay_plan_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.subscription_plans (name, tier, interval, price, features) values
  ('Basic Monthly', 'basic', 'monthly', 99, ARRAY['Unlimited free downloads', 'Access to all premium designs', 'CDR, SVG, PSD, AI formats', 'Email support']),
  ('Basic Yearly', 'basic', 'yearly', 799, ARRAY['Unlimited free downloads', 'Access to all premium designs', 'CDR, SVG, PSD, AI formats', 'Email support', 'Save 33% vs monthly']),
  ('Pro Monthly', 'pro', 'monthly', 199, ARRAY['Everything in Basic', 'Early access to new designs', 'Priority support', 'Commercial license', 'Exclusive pro-only designs']),
  ('Pro Yearly', 'pro', 'yearly', 1599, ARRAY['Everything in Basic', 'Early access to new designs', 'Priority support', 'Commercial license', 'Exclusive pro-only designs', 'Save 33% vs monthly']);

-- ============================================
-- 6. USER SUBSCRIPTIONS
-- ============================================
create table public.user_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan_id uuid references public.subscription_plans(id) not null,
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired')),
  razorpay_subscription_id text unique,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,
  created_at timestamptz not null default now()
);

create index user_subscriptions_user_idx on public.user_subscriptions(user_id);

-- ============================================
-- 7. PURCHASES (per-design)
-- ============================================
create table public.purchases (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references public.profiles(id) not null,
  design_id uuid references public.designs(id) not null,
  amount numeric(10,2) not null,
  platform_fee numeric(10,2) not null,
  creator_earning numeric(10,2) not null,
  razorpay_payment_id text unique,
  created_at timestamptz not null default now(),
  unique(buyer_id, design_id)
);

-- ============================================
-- 8. DOWNLOADS
-- ============================================
create table public.downloads (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  design_id uuid references public.designs(id) not null,
  download_type text not null check (download_type in ('free', 'subscription', 'purchase')),
  created_at timestamptz not null default now()
);

create index downloads_design_idx on public.downloads(design_id);
create index downloads_user_idx on public.downloads(user_id);

-- ============================================
-- 9. EARNINGS
-- ============================================
create table public.earnings (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.profiles(id) not null,
  design_id uuid references public.designs(id),
  amount numeric(10,2) not null,
  type text not null check (type in ('purchase', 'subscription_pool')),
  settlement_month text,
  created_at timestamptz not null default now()
);

create index earnings_creator_idx on public.earnings(creator_id);

-- ============================================
-- 10. WITHDRAWALS
-- ============================================
create table public.withdrawals (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.profiles(id) not null,
  amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  razorpay_payout_id text,
  note text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ============================================
-- 11. MONTHLY SETTLEMENTS
-- ============================================
create table public.monthly_settlements (
  id uuid default uuid_generate_v4() primary key,
  month text not null unique,
  total_subscription_revenue numeric(10,2) not null default 0,
  platform_cut numeric(10,2) not null default 0,
  creator_pool numeric(10,2) not null default 0,
  total_downloads integer not null default 0,
  settled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.designs enable row level security;
alter table public.design_files enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.purchases enable row level security;
alter table public.downloads enable row level security;
alter table public.earnings enable row level security;
alter table public.withdrawals enable row level security;
alter table public.monthly_settlements enable row level security;

-- Profiles
create policy "Public profiles are viewable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Categories (public read)
create policy "Categories are public" on public.categories for select using (true);

-- Designs (approved designs are public)
create policy "Approved designs are public" on public.designs for select using (status = 'approved');
create policy "Creators see own designs" on public.designs for select using (auth.uid() = creator_id);
create policy "Authenticated users can insert" on public.designs for insert with check (auth.uid() = creator_id);
create policy "Creators update own designs" on public.designs for update using (auth.uid() = creator_id);

-- Design files
create policy "Files of approved designs are public" on public.design_files for select
  using (exists (select 1 from public.designs where id = design_id and status = 'approved'));
create policy "Creators see own files" on public.design_files for select
  using (exists (select 1 from public.designs where id = design_id and creator_id = auth.uid()));
create policy "Creators insert files" on public.design_files for insert
  with check (exists (select 1 from public.designs where id = design_id and creator_id = auth.uid()));

-- Subscription plans (public)
create policy "Plans are public" on public.subscription_plans for select using (true);

-- User subscriptions
create policy "Users see own subscriptions" on public.user_subscriptions for select using (auth.uid() = user_id);

-- Purchases
create policy "Users see own purchases" on public.purchases for select using (auth.uid() = buyer_id);

-- Downloads
create policy "Users see own downloads" on public.downloads for select using (auth.uid() = user_id);

-- Earnings
create policy "Creators see own earnings" on public.earnings for select using (auth.uid() = creator_id);

-- Withdrawals
create policy "Creators see own withdrawals" on public.withdrawals for select using (auth.uid() = creator_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Increment total_earnings for a creator
create or replace function public.increment_earnings(user_id uuid, amount numeric)
returns void as $$
  update public.profiles
  set total_earnings = total_earnings + amount
  where id = user_id;
$$ language sql security definer;
