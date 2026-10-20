-- رِواق: مخطط قاعدة البيانات الأولي
-- شغّل هذا الملف في Supabase SQL Editor بعد إنشاء مشروع Supabase.
-- الجداول مهيأة لحسابات الهاتف. لا تخزن رموز OTP في هذه الجداول؛ Supabase Auth يديرها.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  username text unique check (username is null or username ~ '^[a-zA-Z0-9_]{3,24}$'),
  avatar_url text,
  bio text check (char_length(bio) <= 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  category text not null default 'شخصي',
  priority text not null default 'متوسطة' check (priority in ('عالية','متوسطة','منخفضة')),
  due_at timestamptz,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 3000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_created_idx on public.tasks(user_id, created_at desc);
create index if not exists posts_created_idx on public.posts(created_at desc);
create index if not exists comments_post_created_idx on public.comments(post_id, created_at asc);

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;

-- Profiles: المستخدم يستطيع تعديل ملفه، ويمكن عرض الملفات العامة.
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Tasks: خاصة بصاحبها.
create policy "Users can view their own tasks" on public.tasks
  for select using (auth.uid() = user_id);
create policy "Users can create their own tasks" on public.tasks
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own tasks" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own tasks" on public.tasks
  for delete using (auth.uid() = user_id);

-- Posts: المنشورات عامة للقراءة، والكتابة والتعديل والحذف لصاحبها فقط.
create policy "Posts are viewable by everyone" on public.posts
  for select using (true);
create policy "Authenticated users can create posts" on public.posts
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own posts" on public.posts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own posts" on public.posts
  for delete using (auth.uid() = user_id);

create policy "Likes are viewable by everyone" on public.post_likes
  for select using (true);
create policy "Users can like as themselves" on public.post_likes
  for insert with check (auth.uid() = user_id);
create policy "Users can remove their own likes" on public.post_likes
  for delete using (auth.uid() = user_id);

create policy "Comments are viewable by everyone" on public.comments
  for select using (true);
create policy "Authenticated users can comment as themselves" on public.comments
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own comments" on public.comments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own comments" on public.comments
  for delete using (auth.uid() = user_id);

-- إنشاء ملف شخصي تلقائيًا عند إنشاء مستخدم في Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
