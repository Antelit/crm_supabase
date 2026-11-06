REVOKE INSERT ON public.task
FROM PUBLIC, anon, authenticated;

GRANT INSERT (
    id_object,
    id_profile_author,
    id_profile_assignee,
    title,
    description
)
ON public.task
TO authenticated;