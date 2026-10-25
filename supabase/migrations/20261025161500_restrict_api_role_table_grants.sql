begin;

revoke all privileges on table
  public.watches,
  public."Orologi_Caratteristiche",
  public.caratteristiche,
  public.user_profiles,
  public.watch_maintenance,
  public.watch_notification_preferences,
  public.watch_outfit_feedback
from public, anon, authenticated;

grant select, insert, update, delete on table public.watches to authenticated;
grant select, insert, delete on table public."Orologi_Caratteristiche" to authenticated;
grant select on table public.caratteristiche to authenticated;
grant select, insert, update on table public.user_profiles to authenticated;
grant select, insert, update, delete on table public.watch_maintenance to authenticated;
grant select, insert, update on table public.watch_notification_preferences to authenticated;
grant select, insert, update on table public.watch_outfit_feedback to authenticated;

commit;
