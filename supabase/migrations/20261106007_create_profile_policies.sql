CREATE POLICY "profile_select" ON public.profile
FOR SELECT TO authenticated
USING (
    id_profile = (SELECT auth.uid()) OR (SELECT public.get_user_role()) = 'manager'
);