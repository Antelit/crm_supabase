CREATE POLICY "task_status_history_select" ON public.task_status_history
FOR SELECT TO authenticated
USING (
    (SELECT public.get_user_role()) = 'manager'
    OR EXISTS (
        SELECT 1
        FROM public.task t
        WHERE t.id_task = task_status_history.id_task
            AND t.id_profile_assignee = (SELECT auth.uid())
    )
);


REVOKE INSERT, UPDATE, DELETE ON public.task_status_history
FROM anon, authenticated;

GRANT SELECT ON public.task_status_history
TO authenticated;