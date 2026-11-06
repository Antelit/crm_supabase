CREATE POLICY "task_select" ON public.task
FOR SELECT TO authenticated
USING (
    (SELECT public.get_user_role()) = 'manager' OR id_profile_assignee = (SELECT auth.uid())
);

CREATE POLICY "task_insert" ON public.task
FOR INSERT TO authenticated
WITH CHECK (
    (SELECT public.get_user_role()) = 'manager' AND id_profile_author = (SELECT auth.uid())
);

CREATE POLICY "task_update" ON public.task
FOR UPDATE TO authenticated
USING ((SELECT public.get_user_role()) = 'manager')
WITH CHECK ((SELECT public.get_user_role()) = 'manager');

CREATE POLICY "task_delete" ON public.task
FOR DELETE TO authenticated
USING ((SELECT public.get_user_role()) = 'manager');