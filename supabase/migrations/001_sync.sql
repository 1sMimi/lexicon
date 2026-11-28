-- Apply to a user-owned Supabase project. Never expose service-role credentials.
begin;

create table if not exists public.lexicon_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  table_name text not null check (table_name in ('words','wordbooks','wordbook_memberships','user_word_states','notes','review_logs','reading_positions','vocabulary_tests','settings')),
  record_id text not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  version bigint not null default 1,
  updated_at timestamptz not null default clock_timestamp(),
  primary key(user_id, table_name, record_id)
);
alter table public.lexicon_records enable row level security;
drop policy if exists "Users read their own Lexicon rows" on public.lexicon_records;
create policy "Users read their own Lexicon rows" on public.lexicon_records for select to authenticated using (auth.uid() = user_id);
-- Writes go through CAS; callers cannot supply another user's identity.
create or replace function public.lexicon_write(p_table text, p_id text, p_payload jsonb, p_version bigint)
returns setof public.lexicon_records language plpgsql security definer set search_path = public as $$
declare existing public.lexicon_records;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if octet_length(p_payload::text) > 4000000 then raise exception 'Record too large'; end if;
  if p_payload->>'id' is distinct from p_id then raise exception 'Identity mismatch'; end if;
  if p_version = 0 then
    return query insert into public.lexicon_records(user_id,table_name,record_id,payload)
      values(auth.uid(),p_table,p_id,p_payload) on conflict do nothing returning *;
  else
    return query update public.lexicon_records set payload=p_payload,version=version+1,updated_at=clock_timestamp()
      where user_id=auth.uid() and table_name=p_table and record_id=p_id and version=p_version
      and (p_table <> 'review_logs' or payload=p_payload) returning *;
  end if;
end $$;
revoke all on function public.lexicon_write(text,text,jsonb,bigint) from public;
grant execute on function public.lexicon_write(text,text,jsonb,bigint) to authenticated;
grant select on public.lexicon_records to authenticated;
create index if not exists lexicon_records_incremental on public.lexicon_records(user_id,updated_at);

commit;
