-- Authorized registration workflow. Target: crzgazzspwarsbjvtfsl.
-- Existing users/status values are preserved; application status is authoritative.
alter table public.student_profiles add column if not exists last_name text;
alter table public.student_profiles add column if not exists first_name text;
alter table public.student_profiles add column if not exists middle_name text;
alter table public.student_profiles add column if not exists suffix text;

create table public.registration_screenings (
  auth_user_id uuid primary key references auth.users(id),
  id uuid not null unique,
  state text not null check (state in ('processing','passed','failed')),
  personal jsonb not null check (jsonb_typeof(personal) = 'object'),
  document_path text,
  original jsonb,
  extracted jsonb,
  message text,
  created_at timestamptz not null default now(),
  check (state <> 'passed' or (original is not null and extracted is not null and document_path is not null))
);
create table public.registration_applications (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id),
  status text not null check (status in ('pending','approved','rejected','deactivated')),
  version integer not null default 1 check (version > 0),
  screening_id uuid not null,
  personal jsonb not null,
  academic jsonb not null,
  original jsonb not null,
  document_path text not null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id),
  review_reason text,
  check (jsonb_typeof(personal)='object' and jsonb_typeof(academic)='object' and jsonb_typeof(original)='object')
);
create index registration_applications_review_queue on public.registration_applications(status,submitted_at);
create table public.registration_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.registration_applications(id),
  application_version integer not null,
  administrator_id uuid not null references public.users(id),
  decision text not null check (decision in ('approved','rejected','deactivated')),
  reason text,
  -- Preserve each reviewed application, including original OCR and corrections.
  application_snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create index registration_reviews_application on public.registration_reviews(application_id,created_at);
alter table public.registration_screenings enable row level security;
alter table public.registration_applications enable row level security;
alter table public.registration_reviews enable row level security;
revoke all on public.registration_screenings, public.registration_applications, public.registration_reviews from anon, authenticated;
grant select on public.registration_applications to authenticated;
create policy registration_read_own on public.registration_applications for select to authenticated using (auth_user_id = (select auth.uid()));
-- No direct client writes, including approval/role/profile edits. Service-only API.
revoke all on public.users, public.student_profiles from anon, authenticated;
grant select on public.users, public.student_profiles to authenticated;
create policy users_read_own on public.users for select to authenticated using (auth_user_id = (select auth.uid()));
create policy profiles_read_own on public.student_profiles for select to authenticated using (user_id in (select id from public.users where auth_user_id = (select auth.uid())));
grant all on public.registration_screenings, public.registration_applications, public.registration_reviews to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('registration-documents','registration-documents',false,3145728,array['image/jpeg','image/png','application/pdf']);
-- Deliberately no client Storage policies. Upload/read URLs are authorized server-side.

create function public.registration_begin_screening(p_auth uuid,p_email text,p_id uuid,p_personal jsonb,p_path text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare u public.users; a public.registration_applications; s public.registration_screenings; old_path text;
begin
  if p_email !~ '^202[0-9]-[0-9]{6}@rtu[.]edu[.]ph$' or p_personal->>'studentNumber' is distinct from split_part(p_email,'@',1)
     or p_path not like p_auth::text || '/' || p_id::text || '.%' then raise exception 'Invalid registration identity'; end if;
  insert into public.users(auth_user_id,email) values(p_auth,p_email) on conflict(auth_user_id) do nothing;
  select * into u from public.users where auth_user_id=p_auth for update;
  if u.role <> 'STUDENT' or u.status in ('SUSPENDED','DEACTIVATED','ACTIVE') then raise exception 'Account cannot register'; end if;
  select * into a from public.registration_applications where auth_user_id=p_auth for update;
  if a.status in ('pending','approved','deactivated') then raise exception 'Application cannot be changed'; end if;
  select * into s from public.registration_screenings where auth_user_id=p_auth for update;
  if s.created_at > now()-interval '30 seconds' or (s.state='processing' and s.created_at > now()-interval '2 minutes') then raise exception 'Screening busy'; end if;
  old_path := s.document_path;
  insert into public.registration_screenings(auth_user_id,id,state,personal,document_path)
  values(p_auth,p_id,'processing',p_personal,p_path)
  on conflict(auth_user_id) do update set id=excluded.id,state='processing',personal=excluded.personal,document_path=excluded.document_path,original=null,extracted=null,message=null,created_at=now();
  -- A rejected application's document remains evidence until it is resubmitted.
  if old_path = a.document_path then old_path := null; end if;
  return jsonb_build_object('old_path',old_path);
end $$;

create function public.registration_submit(p_auth uuid,p_screening uuid,p_personal jsonb,p_academic jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare u public.users; a public.registration_applications; s public.registration_screenings;
begin
  select * into u from public.users where auth_user_id=p_auth for update;
  if u.id is null or u.role <> 'STUDENT' or u.status <> 'RESTRICTED' then raise exception 'Account cannot submit'; end if;
  select * into a from public.registration_applications where auth_user_id=p_auth for update;
  -- Retrying an already successful submission is idempotent.
  if a.screening_id = p_screening and a.status='pending' then return to_jsonb(a)-'document_path'; end if;
  if a.status in ('pending','approved','deactivated') then raise exception 'Application cannot be changed'; end if;
  select * into s from public.registration_screenings where auth_user_id=p_auth and id=p_screening for update;
  if s.id is null or s.state <> 'passed' or s.created_at < now()-interval '24 hours'
     or s.original->>'studentNumber' is distinct from p_personal->>'studentNumber'
     or p_personal->>'studentNumber' is distinct from split_part(u.email,'@',1)
     or coalesce(s.original->>'programField','') !~* '^BSINFOTECH([ :]|$)' then raise exception 'Valid screening required'; end if;
  insert into public.registration_applications(auth_user_id,status,screening_id,personal,academic,original,document_path)
  values(p_auth,'pending',p_screening,p_personal,p_academic,s.original,s.document_path)
  on conflict(auth_user_id) do update set status='pending',version=registration_applications.version+1,screening_id=excluded.screening_id,
    personal=excluded.personal,academic=excluded.academic,original=excluded.original,document_path=excluded.document_path,
    submitted_at=now(),reviewed_at=null,reviewed_by=null,review_reason=null returning * into a;
  return to_jsonb(a)-'document_path';
end $$;

create function public.registration_review(p_admin uuid,p_id uuid,p_version integer,p_decision text,p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare administrator public.users; u public.users; a public.registration_applications;
begin
  select * into administrator from public.users where auth_user_id=p_admin for share;
  if administrator.id is null or administrator.role <> 'ADMIN' or administrator.status <> 'ACTIVE' then raise exception 'Administrator required'; end if;
  -- Same lock order as submission/screening: user, then application.
  select u2.* into u from public.users u2 join public.registration_applications a2 on a2.auth_user_id=u2.auth_user_id where a2.id=p_id for update of u2;
  select * into a from public.registration_applications where id=p_id for update;
  if a.id is null or a.version <> p_version or u.role <> 'STUDENT' then raise exception 'Stale application'; end if;
  if not ((a.status='pending' and p_decision in ('approved','rejected')) or (a.status='approved' and p_decision='deactivated')) then raise exception 'Invalid transition'; end if;
  if a.status='pending' and u.status <> 'RESTRICTED' then raise exception 'Account no longer eligible for review'; end if;
  if p_decision <> 'approved' and (p_reason is null or length(trim(p_reason)) < 5 or length(p_reason)>1000) then raise exception 'Reason required'; end if;
  insert into public.registration_reviews(application_id,application_version,administrator_id,decision,reason,application_snapshot)
  values(a.id,a.version,administrator.id,p_decision,p_reason,to_jsonb(a));
  update public.registration_applications set status=p_decision,version=version+1,reviewed_at=now(),reviewed_by=administrator.id,review_reason=p_reason where id=a.id returning * into a;
  update public.users set status=case p_decision when 'approved' then 'ACTIVE' when 'deactivated' then 'DEACTIVATED' else 'RESTRICTED' end where id=u.id;
  if p_decision='approved' then
    insert into public.student_profiles(user_id,student_number,full_name,last_name,first_name,middle_name,suffix,program_code,section)
    values(u.id,a.personal->>'studentNumber',concat_ws(' ',nullif(a.personal->>'firstName',''),nullif(a.personal->>'middleName',''),nullif(a.personal->>'lastName',''),nullif(a.personal->>'suffix','')),
      a.personal->>'lastName',a.personal->>'firstName',a.personal->>'middleName',a.personal->>'suffix','BSINFOTECH',a.academic->>'section')
    on conflict(user_id) do update set student_number=excluded.student_number,full_name=excluded.full_name,last_name=excluded.last_name,first_name=excluded.first_name,middle_name=excluded.middle_name,suffix=excluded.suffix,program_code=excluded.program_code,section=excluded.section;
  end if;
  return to_jsonb(a)-'document_path';
end $$;

create function public.is_approved_student() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.users u join public.registration_applications a on a.auth_user_id=u.auth_user_id
    where u.auth_user_id=auth.uid() and u.role='STUDENT' and u.status='ACTIVE' and a.status='approved');
$$;
revoke all on function public.registration_begin_screening(uuid,text,uuid,jsonb,text),public.registration_submit(uuid,uuid,jsonb,jsonb),public.registration_review(uuid,uuid,integer,text,text) from public,anon,authenticated;
grant execute on function public.registration_begin_screening(uuid,text,uuid,jsonb,text),public.registration_submit(uuid,uuid,jsonb,jsonb),public.registration_review(uuid,uuid,integer,text,text) to service_role;
revoke all on function public.is_approved_student() from public,anon;
grant execute on function public.is_approved_student() to authenticated,service_role;
