-- Supabase Storage policies for AdventuresCalendar
--
-- IMPORTANT:
-- - Run this in the Supabase Dashboard -> SQL Editor.
-- - This cannot be applied via `npm run db:apply` because the connection role
--   typically is not the owner of `storage.objects`.
--
-- Bucket: user-media
-- Paths:
-- - profiles/{uid}/avatar.*
-- - profiles/{uid}/cover.*
-- - profiles/{uid}/certifications/{id}.pdf
-- - adventures/{uid}/{adventureId}/cover.*

-- Notes (from Supabase docs):
-- - Storage uploads with `upsert: true` require SELECT + UPDATE in addition to INSERT.
-- - Using `auth.jwt() ->> 'sub'` is the most reliable way to reference the authenticated user id.

-- Public read (needed if you're serving these via public URLs)
drop policy if exists "user-media public read" on storage.objects;
create policy "user-media public read"
on storage.objects
for select
to public
using (
  bucket_id = 'user-media'
);

-- Allow authenticated users to insert objects only into profiles/{uid}/...
drop policy if exists "user-media profiles insert own" on storage.objects;
create policy "user-media profiles insert own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'user-media'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (
    (storage.foldername(name))[3] is null
    or (
      (storage.foldername(name))[3] = 'certifications'
      and lower(storage.extension(name)) = 'pdf'
    )
  )
);

-- Allow authenticated users to insert objects only into adventures/{uid}/...
drop policy if exists "user-media adventures insert own" on storage.objects;
create policy "user-media adventures insert own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'user-media'
  and (storage.foldername(name))[1] = 'adventures'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to update objects only in their own folder
drop policy if exists "user-media profiles update own" on storage.objects;
create policy "user-media profiles update own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'user-media'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (
    (storage.foldername(name))[3] is null
    or (
      (storage.foldername(name))[3] = 'certifications'
      and lower(storage.extension(name)) = 'pdf'
    )
  )
)
with check (
  bucket_id = 'user-media'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (
    (storage.foldername(name))[3] is null
    or (
      (storage.foldername(name))[3] = 'certifications'
      and lower(storage.extension(name)) = 'pdf'
    )
  )
);

drop policy if exists "user-media adventures update own" on storage.objects;
create policy "user-media adventures update own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'user-media'
  and (storage.foldername(name))[1] = 'adventures'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'user-media'
  and (storage.foldername(name))[1] = 'adventures'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- Optional: allow deletes only in their own folder
drop policy if exists "user-media profiles delete own" on storage.objects;
create policy "user-media profiles delete own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'user-media'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (
    (storage.foldername(name))[3] is null
    or (
      (storage.foldername(name))[3] = 'certifications'
      and lower(storage.extension(name)) = 'pdf'
    )
  )
);

drop policy if exists "user-media adventures delete own" on storage.objects;
create policy "user-media adventures delete own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'user-media'
  and (storage.foldername(name))[1] = 'adventures'
  and (storage.foldername(name))[2] = auth.uid()::text
);
