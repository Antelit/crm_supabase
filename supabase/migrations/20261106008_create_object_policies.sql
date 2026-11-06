CREATE POLICY "object_select" ON public.object
FOR SELECT TO authenticated
USING (
    (SELECT public.get_user_role()) = 'manager'
    OR EXISTS (
        SELECT 1
        FROM public.task t
        WHERE t.id_object = object.id_object
            AND t.id_profile_assignee = (SELECT auth.uid())
    )
);

CREATE POLICY "object_insert" ON public.object
FOR INSERT TO authenticated
WITH CHECK (
    (SELECT public.get_user_role()) = 'manager' AND id_profile = (SELECT auth.uid())
);

CREATE POLICY "object_update" ON public.object
FOR UPDATE TO authenticated
USING ((SELECT public.get_user_role()) = 'manager')
WITH CHECK ((SELECT public.get_user_role()) = 'manager');

CREATE POLICY "object_delete" ON public.object
FOR DELETE TO authenticated
USING ((SELECT public.get_user_role()) = 'manager');