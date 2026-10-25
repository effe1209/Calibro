insert into storage.buckets (id, name, public)
values ('watch-photos-private', 'watch-photos-private', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can read own private watch photos" on storage.objects;
create policy "Users can read own private watch photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'watch-photos-private'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'private'
  );

drop policy if exists "Users can add own private watch photos" on storage.objects;
create policy "Users can add own private watch photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'watch-photos-private'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'private'
  );

drop policy if exists "Users can update own private watch photos" on storage.objects;
create policy "Users can update own private watch photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'watch-photos-private'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'private'
  )
  with check (
    bucket_id = 'watch-photos-private'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'private'
  );

drop policy if exists "Users can delete own private watch photos" on storage.objects;
create policy "Users can delete own private watch photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'watch-photos-private'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'private'
  );

create or replace function public.create_watch_with_features(p_watch jsonb, p_features jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_allowed_columns text[] := array[
    'name', 'brand', 'year', 'condition_rating', 'money', 'purchase_date',
    'declared_value', 'movement', 'color', 'occasions', 'note', 'isFavorite',
    'has_box', 'has_papers', 'accessories', 'has_warranty', 'warranty_start',
    'warranty_end', 'warranty_provider', 'image'
  ];
  v_watch_data jsonb;
  v_columns text;
  v_watch public.watches;
  v_feature_id text;
  v_watch_id_type text;
  v_feature_id_type text;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;
  if jsonb_typeof(p_watch) is distinct from 'object' then
    raise exception 'Watch data must be an object';
  end if;
  if jsonb_typeof(p_features) is distinct from 'array' then
    raise exception 'Watch features must be an array';
  end if;
  if exists (
    select 1
    from jsonb_object_keys(p_watch) as supplied(key)
    where not (supplied.key = any(v_allowed_columns))
  ) then
    raise exception 'Watch data contains unsupported fields';
  end if;
  if p_watch ? 'image'
    and p_watch->>'image' is not null
    and p_watch->>'image' !~ ('^' || v_user_id::text || '/private/[A-Za-z0-9_-][A-Za-z0-9._-]*$') then
    raise exception 'Watch image path must belong to the authenticated user';
  end if;

  v_watch_data := p_watch || jsonb_build_object('userid', v_user_id);
  select string_agg(format('%I', allowed.column_name), ', ' order by allowed.ordinality)
    into v_columns
  from unnest(v_allowed_columns || array['userid']) with ordinality as allowed(column_name, ordinality)
  where v_watch_data ? allowed.column_name;

  execute format(
    'insert into public.watches (%1$s) select %1$s from jsonb_populate_record(null::public.watches, $1) as incoming returning *',
    v_columns
  )
  into v_watch
  using v_watch_data;

  select format_type(attribute.atttypid, attribute.atttypmod)
    into v_watch_id_type
  from pg_attribute as attribute
  where attribute.attrelid = 'public."Orologi_Caratteristiche"'::regclass
    and attribute.attname = 'id_watch'
    and attribute.attnum > 0
    and not attribute.attisdropped;

  select format_type(attribute.atttypid, attribute.atttypmod)
    into v_feature_id_type
  from pg_attribute as attribute
  where attribute.attrelid = 'public."Orologi_Caratteristiche"'::regclass
    and attribute.attname = 'id_caratteristica'
    and attribute.attnum > 0
    and not attribute.attisdropped;

  for v_feature_id in
    select distinct item.value #>> '{}'
    from jsonb_array_elements(p_features) as item(value)
  loop
    execute format(
      'insert into public."Orologi_Caratteristiche" (id_watch, id_caratteristica) values ($1::%1$s, $2::%2$s)',
      v_watch_id_type,
      v_feature_id_type
    )
    using v_watch.id::text, v_feature_id;
  end loop;

  return to_jsonb(v_watch);
end;
$$;

create or replace function public.update_watch_with_features(
  p_watch_id text,
  p_watch_data jsonb,
  p_features jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_allowed_columns text[] := array[
    'name', 'brand', 'year', 'condition_rating', 'money', 'purchase_date',
    'declared_value', 'movement', 'color', 'occasions', 'note', 'isFavorite',
    'has_box', 'has_papers', 'accessories', 'has_warranty', 'warranty_start',
    'warranty_end', 'warranty_provider', 'image', 'embedding'
  ];
  v_set_clause text;
  v_watch public.watches;
  v_feature_id text;
  v_watch_id_type text;
  v_feature_id_type text;
  v_updated_rows integer;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;
  if jsonb_typeof(p_watch_data) is distinct from 'object'
    or jsonb_typeof(p_features) is distinct from 'array' then
    raise exception 'Invalid watch update';
  end if;
  if exists (
    select 1
    from jsonb_object_keys(p_watch_data) as supplied(key)
    where not (supplied.key = any(v_allowed_columns))
  ) then
    raise exception 'Watch update contains unsupported fields';
  end if;
  if p_watch_data ? 'image'
    and p_watch_data->>'image' is not null
    and p_watch_data->>'image' !~ ('^' || v_user_id::text || '/private/[A-Za-z0-9_-][A-Za-z0-9._-]*$') then
    raise exception 'Watch image path must belong to the authenticated user';
  end if;

  select string_agg(format('%I = incoming.%I', supplied.key, supplied.key), ', ')
    into v_set_clause
  from jsonb_object_keys(p_watch_data) as supplied(key);
  if v_set_clause is null then
    raise exception 'Watch update is empty';
  end if;

  execute format(
    'update public.watches as target set %1$s from jsonb_populate_record(null::public.watches, $2) as incoming where target.id::text = $1 and target.userid = $3 returning target.*',
    v_set_clause
  )
  into v_watch
  using p_watch_id, p_watch_data, v_user_id;

  get diagnostics v_updated_rows = row_count;
  if v_updated_rows = 0 then
    raise exception 'Watch not found';
  end if;

  select format_type(attribute.atttypid, attribute.atttypmod)
    into v_watch_id_type
  from pg_attribute as attribute
  where attribute.attrelid = 'public."Orologi_Caratteristiche"'::regclass
    and attribute.attname = 'id_watch'
    and attribute.attnum > 0
    and not attribute.attisdropped;

  select format_type(attribute.atttypid, attribute.atttypmod)
    into v_feature_id_type
  from pg_attribute as attribute
  where attribute.attrelid = 'public."Orologi_Caratteristiche"'::regclass
    and attribute.attname = 'id_caratteristica'
    and attribute.attnum > 0
    and not attribute.attisdropped;

  execute 'delete from public."Orologi_Caratteristiche" where id_watch::text = $1'
    using v_watch.id::text;

  for v_feature_id in
    select distinct item.value #>> '{}'
    from jsonb_array_elements(p_features) as item(value)
  loop
    execute format(
      'insert into public."Orologi_Caratteristiche" (id_watch, id_caratteristica) values ($1::%1$s, $2::%2$s)',
      v_watch_id_type,
      v_feature_id_type
    )
    using v_watch.id::text, v_feature_id;
  end loop;

  return to_jsonb(v_watch);
end;
$$;

create or replace function public.restore_watch_collection(
  p_watches jsonb,
  p_maintenance jsonb,
  p_outfit_feedback jsonb,
  p_notification_preferences jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_watch_allowed_columns text[] := array[
    'name', 'brand', 'year', 'condition_rating', 'money', 'purchase_date',
    'declared_value', 'movement', 'color', 'occasions', 'note', 'isFavorite',
    'has_box', 'has_papers', 'accessories', 'has_warranty', 'warranty_start',
    'warranty_end', 'warranty_provider', 'image'
  ];
  v_watch_columns text;
  v_watch_updates text;
  v_watch_item jsonb;
  v_watch_data jsonb;
  v_watch public.watches;
  v_watch_id text;
  v_watch_id_type text;
  v_feature_id_type text;
  v_feature_id text;
  v_maintenance_item jsonb;
  v_row jsonb;
  v_feedback_item jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;
  if jsonb_typeof(p_watches) is distinct from 'array'
    or jsonb_typeof(p_maintenance) is distinct from 'array'
    or jsonb_typeof(p_outfit_feedback) is distinct from 'array' then
    raise exception 'Backup data is invalid';
  end if;

  select format_type(attribute.atttypid, attribute.atttypmod)
    into v_watch_id_type
  from pg_attribute as attribute
  where attribute.attrelid = 'public."Orologi_Caratteristiche"'::regclass
    and attribute.attname = 'id_watch'
    and attribute.attnum > 0
    and not attribute.attisdropped;

  select format_type(attribute.atttypid, attribute.atttypmod)
    into v_feature_id_type
  from pg_attribute as attribute
  where attribute.attrelid = 'public."Orologi_Caratteristiche"'::regclass
    and attribute.attname = 'id_caratteristica'
    and attribute.attnum > 0
    and not attribute.attisdropped;

  for v_watch_item in select value from jsonb_array_elements(p_watches)
  loop
    if jsonb_typeof(v_watch_item->'fields') is distinct from 'object'
      or jsonb_typeof(v_watch_item->'feature_ids') is distinct from 'array' then
      raise exception 'Backup watch entry is invalid';
    end if;

    v_watch_data := (v_watch_item->'fields') || jsonb_build_object(
      'userid', v_user_id,
      'backup_uid', v_watch_item->>'backup_uid',
      'image', v_watch_item->'image'
    );
    if exists (
      select 1
      from jsonb_object_keys(v_watch_data) as supplied(key)
      where not (supplied.key = any(v_watch_allowed_columns || array['userid', 'backup_uid']))
    ) then
      raise exception 'Backup watch contains unsupported fields';
    end if;
    if v_watch_data->>'image' is not null
      and v_watch_data->>'image' !~ ('^' || v_user_id::text || '/private/[A-Za-z0-9_-][A-Za-z0-9._-]*$') then
      raise exception 'Backup image path must belong to the authenticated user';
    end if;

    select string_agg(format('%I', allowed.column_name), ', ' order by allowed.ordinality)
      into v_watch_columns
    from unnest(v_watch_allowed_columns || array['userid', 'backup_uid']) with ordinality as allowed(column_name, ordinality)
    where v_watch_data ? allowed.column_name;

    select string_agg(
      format('%1$I = excluded.%1$I', allowed.column_name),
      ', ' order by allowed.ordinality
    )
      into v_watch_updates
    from unnest(v_watch_allowed_columns) with ordinality as allowed(column_name, ordinality)
    where v_watch_data ? allowed.column_name;

    execute format(
      'insert into public.watches (%1$s) select %1$s from jsonb_populate_record(null::public.watches, $1) as incoming on conflict (userid, backup_uid) do update set %2$s returning *',
      v_watch_columns,
      v_watch_updates
    )
    into v_watch
    using v_watch_data;

    v_watch_id := v_watch.id::text;
    execute 'delete from public."Orologi_Caratteristiche" where id_watch::text = $1'
      using v_watch_id;

    for v_feature_id in
      select distinct item.value #>> '{}'
      from jsonb_array_elements(v_watch_item->'feature_ids') as item(value)
    loop
      execute format(
        'insert into public."Orologi_Caratteristiche" (id_watch, id_caratteristica) select $1::%1$s, $2::%2$s where not exists (select 1 from public."Orologi_Caratteristiche" where id_watch::text = $1 and id_caratteristica::text = $2)',
        v_watch_id_type,
        v_feature_id_type
      )
      using v_watch_id, v_feature_id;
    end loop;
  end loop;

  for v_maintenance_item in select value from jsonb_array_elements(p_maintenance)
  loop
    select id::text into v_watch_id
    from public.watches
    where userid = v_user_id
      and backup_uid = (v_maintenance_item->>'watch_backup_uid')::uuid;
    if v_watch_id is null then
      raise exception 'Backup maintenance entry references a missing watch';
    end if;

    v_row := (v_maintenance_item->'fields') || jsonb_build_object(
      'user_id', v_user_id,
      'watch_id', v_watch_id,
      'backup_uid', v_maintenance_item->>'backup_uid'
    );
    insert into public.watch_maintenance (
      user_id, watch_id, backup_uid, service_date, service_type,
      description, cost, provider, next_service_date
    )
    select
      incoming.user_id, incoming.watch_id, incoming.backup_uid,
      incoming.service_date, incoming.service_type, incoming.description,
      incoming.cost, incoming.provider, incoming.next_service_date
    from jsonb_populate_record(null::public.watch_maintenance, v_row) as incoming
    on conflict (user_id, backup_uid) do update set
      watch_id = excluded.watch_id,
      service_date = excluded.service_date,
      service_type = excluded.service_type,
      description = excluded.description,
      cost = excluded.cost,
      provider = excluded.provider,
      next_service_date = excluded.next_service_date;
  end loop;

  for v_feedback_item in select value from jsonb_array_elements(p_outfit_feedback)
  loop
    select id::text into v_watch_id
    from public.watches
    where userid = v_user_id
      and backup_uid = (v_feedback_item->>'watch_backup_uid')::uuid;
    if v_watch_id is null then
      raise exception 'Backup feedback entry references a missing watch';
    end if;

    v_row := jsonb_build_object(
      'user_id', v_user_id,
      'watch_id', v_watch_id,
      'occasion', v_feedback_item->>'occasion',
      'color_family', v_feedback_item->>'color_family',
      'feedback', v_feedback_item->>'feedback',
      'updated_at', now()
    );
    insert into public.watch_outfit_feedback (
      user_id, watch_id, occasion, color_family, feedback, updated_at
    )
    select
      incoming.user_id, incoming.watch_id, incoming.occasion,
      incoming.color_family, incoming.feedback, incoming.updated_at
    from jsonb_populate_record(null::public.watch_outfit_feedback, v_row) as incoming
    on conflict (user_id, watch_id, occasion, color_family) do update set
      feedback = excluded.feedback,
      updated_at = excluded.updated_at;
  end loop;

  if p_notification_preferences is not null
    and jsonb_typeof(p_notification_preferences) <> 'null' then
    insert into public.watch_notification_preferences (
      user_id, maintenance_enabled, warranty_enabled, reminder_days_before, updated_at
    )
    select
      v_user_id,
      incoming.maintenance_enabled,
      incoming.warranty_enabled,
      incoming.reminder_days_before,
      now()
    from jsonb_populate_record(
      null::public.watch_notification_preferences,
      p_notification_preferences
    ) as incoming
    on conflict (user_id) do update set
      maintenance_enabled = excluded.maintenance_enabled,
      warranty_enabled = excluded.warranty_enabled,
      reminder_days_before = excluded.reminder_days_before,
      updated_at = excluded.updated_at;
  end if;

  return jsonb_build_object(
    'watches', jsonb_array_length(p_watches),
    'maintenance', jsonb_array_length(p_maintenance),
    'outfitFeedback', jsonb_array_length(p_outfit_feedback),
    'notificationPreferences',
      p_notification_preferences is not null
      and jsonb_typeof(p_notification_preferences) <> 'null'
  );
end;
$$;

revoke all on function public.create_watch_with_features(jsonb, jsonb) from public;
revoke all on function public.update_watch_with_features(text, jsonb, jsonb) from public;
revoke all on function public.restore_watch_collection(jsonb, jsonb, jsonb, jsonb) from public;
grant execute on function public.create_watch_with_features(jsonb, jsonb) to authenticated;
grant execute on function public.update_watch_with_features(text, jsonb, jsonb) to authenticated;
grant execute on function public.restore_watch_collection(jsonb, jsonb, jsonb, jsonb) to authenticated;
