-- Keep the staff-access record aligned with the canonical public.users role.
create or replace function public.sync_staff_workspace_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role_id smallint;
  preferred_name text;
begin
  if new.role in ('admin', 'support_agent') then
    select id into target_role_id from public.roles where name = new.role;
    select coalesce(nullif(full_name, ''), new.email) into preferred_name
    from public.user_profiles
    where user_id = new.id;

    insert into public.admin_users (user_id, role_id, display_name, is_active)
    values (new.id, target_role_id, coalesce(preferred_name, new.email), true)
    on conflict (user_id) do update
    set role_id = excluded.role_id,
        display_name = excluded.display_name,
        is_active = true;
  else
    update public.admin_users set is_active = false where user_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists users_sync_staff_workspace_role on public.users;
create trigger users_sync_staff_workspace_role
after insert or update of role on public.users
for each row execute function public.sync_staff_workspace_role();

-- Align accounts whose role was changed before this trigger existed.
insert into public.admin_users (user_id, role_id, display_name, is_active)
select u.id, r.id, coalesce(nullif(p.full_name, ''), u.email), true
from public.users u
join public.roles r on r.name = u.role
left join public.user_profiles p on p.user_id = u.id
where u.role in ('admin', 'support_agent')
on conflict (user_id) do update
set role_id = excluded.role_id,
    display_name = excluded.display_name,
    is_active = true;

update public.admin_users au
set is_active = false
from public.users u
where au.user_id = u.id
  and u.role = 'applicant';

-- Admins can publish general updates or target applicants who selected a university.
alter table public.university_updates alter column university_id drop not null;

drop policy if exists "university updates visible to authenticated users" on public.university_updates;
drop policy if exists "updates visible to staff or selected applicants" on public.university_updates;
create policy "updates visible to staff or selected applicants" on public.university_updates
for select to authenticated using (
  public.is_staff()
  or university_id is null
  or exists (
    select 1 from public.university_selections selection
    where selection.user_id = (select auth.uid())
      and selection.university_id = public.university_updates.university_id
  )
);

create or replace function public.create_university_update(
  update_title text,
  update_description text,
  update_category public.update_category default 'general',
  target_university_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_update_id uuid;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if char_length(trim(update_title)) not between 4 and 160 then raise exception 'Title must be between 4 and 160 characters'; end if;
  if char_length(trim(update_description)) not between 1 and 2000 then raise exception 'Message must be between 1 and 2000 characters'; end if;
  if target_university_id is not null and not exists (select 1 from public.universities where id = target_university_id and is_active) then
    raise exception 'University not found';
  end if;

  insert into public.university_updates (university_id, title, description, category)
  values (target_university_id, trim(update_title), trim(update_description), update_category)
  returning id into new_update_id;

  insert into public.notifications (user_id, type, title, body, href)
  select u.id, 'update', trim(update_title), trim(update_description), '/dashboard/updates'
  from public.users u
  where u.role = 'applicant'
    and (
      target_university_id is null
      or exists (
        select 1 from public.university_selections selection
        where selection.user_id = u.id and selection.university_id = target_university_id
      )
    );

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'university_update.published', 'university_update', new_update_id::text, jsonb_build_object('university_id', target_university_id));
  return new_update_id;
end;
$$;

revoke all on function public.create_university_update(text, text, public.update_category, text) from public;
grant execute on function public.create_university_update(text, text, public.update_category, text) to authenticated;

-- Persistent staff-only group conversation. Messages can be edited but never deleted through the app.
create table if not exists public.staff_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.admin_users(user_id),
  body text not null check (char_length(body) between 1 and 5000),
  reply_to_id uuid references public.staff_messages(id) on delete restrict,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table if not exists public.staff_message_versions (
  id bigint generated always as identity primary key,
  message_id uuid not null references public.staff_messages(id) on delete restrict,
  body text not null,
  version integer not null check (version > 0),
  created_at timestamptz not null default now(),
  unique (message_id, version)
);

create index if not exists staff_messages_created_at_idx on public.staff_messages(created_at);
create index if not exists staff_messages_reply_to_id_idx on public.staff_messages(reply_to_id);
create index if not exists staff_message_versions_message_id_idx on public.staff_message_versions(message_id, version desc);

alter table public.staff_messages enable row level security;
alter table public.staff_message_versions enable row level security;
grant select on public.staff_messages, public.staff_message_versions to authenticated;
grant usage, select on sequence public.staff_message_versions_id_seq to authenticated;

drop policy if exists "staff can read group messages" on public.staff_messages;
drop policy if exists "staff can read message versions" on public.staff_message_versions;
create policy "staff can read group messages" on public.staff_messages for select to authenticated using (public.is_staff());
create policy "staff can read message versions" on public.staff_message_versions for select to authenticated using (public.is_staff());

create or replace function public.send_staff_message(
  message_body text,
  reply_to_message_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare new_message_id uuid;
begin
  if not public.is_staff() then raise exception 'Staff access required'; end if;
  if char_length(trim(message_body)) not between 1 and 5000 then raise exception 'Message must be between 1 and 5000 characters'; end if;
  if reply_to_message_id is not null and not exists (select 1 from public.staff_messages where id = reply_to_message_id) then raise exception 'Reply target not found'; end if;
  insert into public.staff_messages (sender_id, body, reply_to_id)
  values (auth.uid(), trim(message_body), reply_to_message_id)
  returning id into new_message_id;
  return new_message_id;
end;
$$;

create or replace function public.edit_staff_message(
  target_message_id uuid,
  replacement_body text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare current_body text; next_version integer;
begin
  if not public.is_staff() then raise exception 'Staff access required'; end if;
  if char_length(trim(replacement_body)) not between 1 and 5000 then raise exception 'Message must be between 1 and 5000 characters'; end if;
  select body into current_body from public.staff_messages where id = target_message_id and sender_id = auth.uid();
  if current_body is null then raise exception 'Only the sender can edit this message'; end if;
  if current_body = trim(replacement_body) then return target_message_id; end if;
  select coalesce(max(version), 0) + 1 into next_version from public.staff_message_versions where message_id = target_message_id;
  insert into public.staff_message_versions (message_id, body, version) values (target_message_id, current_body, next_version);
  update public.staff_messages set body = trim(replacement_body), edited_at = now() where id = target_message_id;
  return target_message_id;
end;
$$;

revoke all on function public.send_staff_message(text, uuid), public.edit_staff_message(uuid, text) from public;
grant execute on function public.send_staff_message(text, uuid), public.edit_staff_message(uuid, text) to authenticated;

-- Admin-managed application requirements. Existing databases can run this block safely.
alter table public.requirements add column if not exists submission_type text not null default 'file' check (submission_type in ('file', 'text', 'both'));
alter table public.user_requirements add column if not exists response_text text;

create or replace function public.create_requirement(requirement_title text, requirement_subtitle text, requirement_guidance text, requirement_submission_type text)
returns text language plpgsql security definer set search_path = '' as $$
declare new_requirement_id text;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if char_length(trim(requirement_title)) not between 2 and 140 or char_length(trim(requirement_subtitle)) not between 2 and 500 then raise exception 'Title or subtitle is invalid'; end if;
  if requirement_submission_type not in ('file', 'text', 'both') then raise exception 'Submission type is invalid'; end if;
  new_requirement_id := concat('req-', floor(extract(epoch from clock_timestamp()) * 1000)::bigint, '-', floor(random() * 1000000)::bigint);
  insert into public.requirements (id, title, description, guidance, submission_type, display_order)
  values (new_requirement_id, trim(requirement_title), trim(requirement_subtitle), nullif(trim(requirement_guidance), ''), requirement_submission_type, coalesce((select max(display_order) + 1 from public.requirements), 0));
  insert into public.user_requirements (user_id, requirement_id)
  select id, new_requirement_id from public.users where role = 'applicant' on conflict (user_id, requirement_id) do nothing;
  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id) values (auth.uid(), 'requirement.created', 'requirement', new_requirement_id);
  return new_requirement_id;
end;
$$;

create or replace function public.update_requirement(requirement_id text, requirement_title text, requirement_subtitle text, requirement_guidance text, requirement_submission_type text)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if char_length(trim(requirement_title)) not between 2 and 140 or char_length(trim(requirement_subtitle)) not between 2 and 500 then raise exception 'Title or subtitle is invalid'; end if;
  if requirement_submission_type not in ('file', 'text', 'both') then raise exception 'Submission type is invalid'; end if;
  update public.requirements set title = trim(requirement_title), description = trim(requirement_subtitle), guidance = nullif(trim(requirement_guidance), ''), submission_type = requirement_submission_type where id = requirement_id;
  if not found then raise exception 'Requirement not found'; end if;
  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id) values (auth.uid(), 'requirement.updated', 'requirement', requirement_id);
  return requirement_id;
end;
$$;

create or replace function public.delete_requirement(requirement_id text)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  delete from public.requirements where id = requirement_id;
  if not found then raise exception 'Requirement not found'; end if;
  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id) values (auth.uid(), 'requirement.deleted', 'requirement', requirement_id);
  return requirement_id;
end;
$$;

revoke all on function public.create_requirement(text, text, text, text), public.update_requirement(text, text, text, text, text), public.delete_requirement(text) from public;
grant execute on function public.create_requirement(text, text, text, text), public.update_requirement(text, text, text, text, text), public.delete_requirement(text) to authenticated;

create or replace function public.submit_requirement_text(target_requirement_id text, submitted_text text)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.requirements where id = target_requirement_id and is_active and submission_type in ('text', 'both')) then raise exception 'This requirement does not accept a text response'; end if;
  if char_length(trim(submitted_text)) not between 1 and 5000 then raise exception 'Response must be between 1 and 5000 characters'; end if;
  update public.user_requirements set response_text = trim(submitted_text), status = 'processing' where user_id = auth.uid() and requirement_id = target_requirement_id;
  if not found then raise exception 'Requirement not found for this applicant'; end if;
  return target_requirement_id;
end;
$$;
revoke all on function public.submit_requirement_text(text, text) from public;
grant execute on function public.submit_requirement_text(text, text) to authenticated;
