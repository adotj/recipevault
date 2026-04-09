-- RecipeVault — run in Supabase SQL Editor (PostgreSQL 15+)
-- Creates tables, RLS, storage policies, and updated_at trigger.

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  meal_types text[] not null default '{}',
  ingredients jsonb not null default '[]',
  instructions text,
  prep_time integer,
  cook_time integer,
  servings integer not null default 1,
  nutrition jsonb,
  image_url text,
  tags text[] not null default '{}',
  notes text,
  favorite boolean not null default false,
  cook_count integer not null default 0,
  last_cooked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_user_id_idx on public.recipes (user_id);
create index if not exists recipes_user_created_idx on public.recipes (user_id, created_at desc);

create table if not exists public.cooked_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  cooked_at date not null default (timezone('utc', now())::date),
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists cooked_logs_user_idx on public.cooked_logs (user_id);
create index if not exists cooked_logs_recipe_idx on public.cooked_logs (recipe_id);
create index if not exists cooked_logs_cooked_at_idx on public.cooked_logs (user_id, cooked_at desc);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_date date not null,
  breakfast_recipe_id uuid references public.recipes (id) on delete set null,
  lunch_recipe_id uuid references public.recipes (id) on delete set null,
  dinner_recipe_id uuid references public.recipes (id) on delete set null,
  snack_recipe_id uuid references public.recipes (id) on delete set null,
  dessert_recipe_id uuid references public.recipes (id) on delete set null,
  unique (user_id, plan_date)
);

create index if not exists meal_plans_user_date on public.meal_plans (user_id, plan_date);

-- -----------------------------------------------------------------------------
-- updated_at
-- -----------------------------------------------------------------------------

create or replace function public.set_recipes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recipes_set_updated_at on public.recipes;
create trigger recipes_set_updated_at
  before update on public.recipes
  for each row
  execute procedure public.set_recipes_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.recipes enable row level security;
alter table public.cooked_logs enable row level security;
alter table public.meal_plans enable row level security;

drop policy if exists "recipes_select_own" on public.recipes;
drop policy if exists "recipes_insert_own" on public.recipes;
drop policy if exists "recipes_update_own" on public.recipes;
drop policy if exists "recipes_delete_own" on public.recipes;

create policy "recipes_select_own"
  on public.recipes for select
  using (auth.uid() = user_id);

create policy "recipes_insert_own"
  on public.recipes for insert
  with check (auth.uid() = user_id);

create policy "recipes_update_own"
  on public.recipes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "recipes_delete_own"
  on public.recipes for delete
  using (auth.uid() = user_id);

drop policy if exists "cooked_logs_all_own" on public.cooked_logs;
create policy "cooked_logs_all_own"
  on public.cooked_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "meal_plans_all_own" on public.meal_plans;
create policy "meal_plans_all_own"
  on public.meal_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Storage: recipe-images bucket (public read). Paths: {user_id}/{filename}
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

drop policy if exists "recipe_images_public_read" on storage.objects;
create policy "recipe_images_public_read"
  on storage.objects for select
  using (bucket_id = 'recipe-images');

drop policy if exists "recipe_images_insert_own" on storage.objects;
create policy "recipe_images_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'recipe-images'
    and coalesce(auth.uid()::text, '') = (storage.foldername(name))[1]
  );

drop policy if exists "recipe_images_update_own" on storage.objects;
create policy "recipe_images_update_own"
  on storage.objects for update
  using (
    bucket_id = 'recipe-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "recipe_images_delete_own" on storage.objects;
create policy "recipe_images_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'recipe-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
