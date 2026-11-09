alter function public.is_approved_student() security invoker;
comment on function public.is_approved_student() is 'Checks the current authenticated owner through existing owner-read RLS. No elevated privileges are required.';
