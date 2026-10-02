-- Imita lo mínimo de Supabase para probar esquema.sql en un Postgres local (no se usa en Supabase).
create extension if not exists pgcrypto;
do $$ begin
  create role anon nologin;
exception when duplicate_object then null; end $$;
do $$ begin
  create role authenticated nologin;
exception when duplicate_object then null; end $$;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create schema if not exists storage;
grant usage on schema storage to anon, authenticated;
create table if not exists storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid default auth.uid()
);
alter table storage.objects enable row level security;
grant all on storage.objects, storage.buckets to authenticated;
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
$$;

do $$ begin
  create publication supabase_realtime;
exception when duplicate_object then null; end $$;
