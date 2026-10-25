begin;

alter table public.watches enable row level security;
drop policy if exists "Prima" on public.watches;

alter table public."Orologi_Caratteristiche" enable row level security;
drop policy if exists "Allow authenticated insert on Orologi_Caratteristiche"
  on public."Orologi_Caratteristiche";
drop policy if exists "Allow authenticated read access on Orologi_Caratteristiche"
  on public."Orologi_Caratteristiche";
drop policy if exists "aaaa" on public."Orologi_Caratteristiche";
drop policy if exists "bho" on public."Orologi_Caratteristiche";
drop policy if exists "Allow users to delete features from their own watches"
  on public."Orologi_Caratteristiche";
drop policy if exists "Users can read features from their own watches"
  on public."Orologi_Caratteristiche";
drop policy if exists "Users can add features to their own watches"
  on public."Orologi_Caratteristiche";
drop policy if exists "Users can delete features from their own watches"
  on public."Orologi_Caratteristiche";

create policy "Users can read features from their own watches"
  on public."Orologi_Caratteristiche" for select to authenticated
  using (
    exists (
      select 1
      from public.watches
      where watches.id = "Orologi_Caratteristiche".id_watch
        and watches.userid = (select auth.uid())
    )
  );

create policy "Users can add features to their own watches"
  on public."Orologi_Caratteristiche" for insert to authenticated
  with check (
    exists (
      select 1
      from public.watches
      where watches.id = "Orologi_Caratteristiche".id_watch
        and watches.userid = (select auth.uid())
    )
  );

create policy "Users can delete features from their own watches"
  on public."Orologi_Caratteristiche" for delete to authenticated
  using (
    exists (
      select 1
      from public.watches
      where watches.id = "Orologi_Caratteristiche".id_watch
        and watches.userid = (select auth.uid())
    )
  );

alter table public.user_profiles enable row level security;
grant insert on table public.user_profiles to authenticated;
drop policy if exists "InserimentoUtente" on public.user_profiles;
drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
  on public.user_profiles for insert to authenticated
  with check (id = (select auth.uid()));

create or replace function public.match_watches(
  query_embedding vector,
  match_threshold double precision,
  match_count integer
)
returns setof public.watches
language plpgsql
security invoker
set search_path = pg_catalog, public, extensions
as $function$
begin
  if auth.uid() is null or match_count is null or match_count < 1 then
    return;
  end if;

  return query
  select watches.*
  from public.watches
  where watches.userid = (select auth.uid())
    and 1 - (watches.embedding <=> query_embedding) > match_threshold
  order by watches.embedding <=> query_embedding
  limit match_count;
end;
$function$;

revoke all on function public.match_watches(vector, double precision, integer)
  from public, anon;
grant execute on function public.match_watches(vector, double precision, integer)
  to authenticated;

commit;
