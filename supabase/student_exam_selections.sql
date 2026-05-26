create table if not exists public.student_exam_selections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  exam text not null check (exam in ('JEE', 'NEET', 'UPSC', 'GATE', 'CAT')),
  selected_at timestamptz not null default now()
);

alter table public.student_exam_selections enable row level security;

create policy "Students can read their own exam selection"
on public.student_exam_selections
for select
to authenticated
using (auth.uid() = user_id);

create policy "Students can insert their own exam selection"
on public.student_exam_selections
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Students can update their own exam selection"
on public.student_exam_selections
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
