REVOKE UPDATE ON public.task FROM PUBLIC, anon, authenticated;

GRANT UPDATE (
    id_object,
    id_profile_assignee,
    title,
    description,
    updated_at
)
ON public.task
TO authenticated;