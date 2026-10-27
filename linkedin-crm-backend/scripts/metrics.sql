-- Activation and retention of the accounts created since the measurement
-- started. Read-only. Run it in the Supabase SQL editor of the production
-- project, once a week, and copy the result into the private tracking doc.
-- Never commit the results: this repository is public.
--
-- Definitions (decided in the plan review of 2026-10-27):
--   cohort      accounts created on or after the start below, minus the
--               excluded accounts (our own), minus deleted ones.
--   activated   the first contact was saved within 24 hours of sign-up.
--   retained    the account was used 21 days or more after sign-up, by
--                 - writing: a contact created or changed (Connection), or
--                 - using:   the extension renewed its sign-in (auth.sessions).
--               "21 days or more" rather than "in week 4": Connection keeps
--               only the last change, so a change in week 5 hides one in
--               week 4. Only accounts at least 28 days old are eligible.
--
-- auth.sessions is Supabase's own table. The extension renews its sign-in
-- only while it is being used (since 1.3.8), so a renewal means use. Signing
-- out deletes the session, so this signal undercounts; it never overcounts.
-- If Supabase changes that table this query fails loudly instead of
-- returning 0.
--
-- No row here contains a note, a name or an email address.

with params as (
  select timestamptz '2026-10-27 00:00:00+01' as cohort_start
),

-- Our own accounts. Add their auth.users ids here; the check row at the
-- bottom shows how many of them were found.
excluded(user_id) as (
  values
    ('0ce77965-a6eb-4910-8fd8-50801199a163'::uuid),
    ('e3de549f-d381-41fa-adf2-61ab61ca306f'::uuid),
    ('38f0bf69-c159-46bf-9d2a-ef344088792f'::uuid),
    ('1b4e5f92-e6b4-48d3-88a5-aac519449375'::uuid),
    ('234c8941-f082-45c4-ab6d-9c7c3d711de8'::uuid),
    ('1dd97f35-d16e-4945-9ba7-932ce98805a1'::uuid),
    ('f8a6a21f-c357-460f-9b95-dd58f5bdb7b3'::uuid)
),

cohort as (
  select u.id, u.created_at
  from auth.users u, params p
  where u.created_at >= p.cohort_start
    and u.deleted_at is null
    and u.id not in (select user_id from excluded)
),

first_contact as (
  select c."ownerId" as user_id, min(c."createdAt") as first_at
  from public."Connection" c
  join cohort on cohort.id = c."ownerId"
  group by c."ownerId"
),

activated as (
  select cohort.id
  from cohort
  join first_contact f on f.user_id = cohort.id
  where f.first_at < cohort.created_at + interval '24 hours'
),

eligible as (
  select id, created_at from cohort where created_at <= now() - interval '28 days'
),

retained_write as (
  select distinct e.id
  from eligible e
  join public."Connection" c on c."ownerId" = e.id
  where greatest(c."createdAt", c."updatedAt") >= e.created_at + interval '21 days'
),

retained_use as (
  select distinct e.id
  from eligible e
  join auth.sessions s on s.user_id = e.id
  -- refreshed_at is a timestamp without time zone, in UTC.
  where coalesce(s.refreshed_at at time zone 'UTC', s.updated_at) >= e.created_at + interval '21 days'
),

retained as (
  select id from retained_write
  union
  select id from retained_use
)

select 'check: excluded accounts found' as metric,
       (select count(*) from auth.users where id in (select user_id from excluded)) as value,
       null::bigint as out_of, null::text as pct, null::text as threshold
union all
select 'new accounts (cohort)', (select count(*) from cohort), null, null, '>= 15'
union all
select 'activated within 24h', (select count(*) from activated), (select count(*) from cohort),
       coalesce(round(100.0 * (select count(*) from activated) / nullif((select count(*) from cohort), 0))::text || '%',
                'n/a (n=0)'),
       '>= 50%'
union all
select 'eligible for retention (>= 28 days old)', (select count(*) from eligible), (select count(*) from cohort),
       null, null
union all
select 'retained (writing or using)', (select count(*) from retained), (select count(*) from eligible),
       coalesce(round(100.0 * (select count(*) from retained) / nullif((select count(*) from eligible), 0))::text || '%',
                'n/a (n=0)'),
       '>= 5 accounts'
union all
select '  of which by writing', (select count(*) from retained_write), (select count(*) from eligible), null, null
union all
select '  of which by using the extension', (select count(*) from retained_use), (select count(*) from eligible),
       null, null;
