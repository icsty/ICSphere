-- ICSphere only: crzgazzspwarsbjvtfsl.
-- Metadata inspection only. No schema changes, writes, or student records.
-- Verify the project reference in Supabase before running in its SQL Editor.

select table_schema, table_name, table_type
from information_schema.tables
where table_schema = 'public'
order by table_name;

select table_name, ordinal_position, column_name, data_type, udt_name,
       is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

select c.relname as table_name, c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
order by c.relname;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

select conrelid::regclass::text as table_name, conname as constraint_name,
       contype as constraint_type, pg_get_constraintdef(oid) as definition
from pg_constraint
where connamespace = 'public'::regnamespace
order by table_name, constraint_name;

select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

select event_object_schema, event_object_table, trigger_name,
       event_manipulation, action_timing, action_statement
from information_schema.triggers
where event_object_schema = 'public'
   or (event_object_schema = 'auth' and event_object_table = 'users')
order by event_object_schema, event_object_table, trigger_name;

select p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by function_name;

select table_name, grantee, privilege_type
from information_schema.table_privileges
where table_schema = 'public' and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by name;
