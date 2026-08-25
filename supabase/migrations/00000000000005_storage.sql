-- Storage buckets: public avatars, private per-delivery handoff/drop-off photos.

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('avatars', 'avatars', true, 5242880),
  ('delivery-photos', 'delivery-photos', false, 10485760);

-- avatars/{user_id}/... : anyone can view, only the owner can write
create policy "avatars are publicly readable" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "users manage own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users update own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- delivery-photos/{delivery_id}/... : only the two delivery participants can read/write
create policy "participants read delivery photos" on storage.objects for select to authenticated
  using (
    bucket_id = 'delivery-photos'
    and (storage.foldername(name))[1]::uuid in (
      select id from deliveries
      where driver_id = auth.uid() or sender_id = auth.uid()
    )
  );
create policy "participants upload delivery photos" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'delivery-photos'
    and (storage.foldername(name))[1]::uuid in (
      select id from deliveries
      where driver_id = auth.uid() or sender_id = auth.uid()
    )
  );
