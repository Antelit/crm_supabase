CREATE OR REPLACE FUNCTION public.get_task_status_history(
    p_id_task UUID
)
RETURNS TABLE (
    id_task_status_history UUID,
    from_status TEXT,
    to_status TEXT,
    comment TEXT,
    created_at TIMESTAMPTZ,
    id_profile UUID,
    author_name VARCHAR(255)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID;
    v_user_role TEXT;
BEGIN
    v_user_id := auth.uid();
    v_user_role := public.get_user_role();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.task t
        WHERE t.id_task = p_id_task
            AND (v_user_role = 'manager' OR t.id_profile_assignee = v_user_id)
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT
        h.id_task_status_history,
        h.from_status::text,
        h.to_status::text,
        h.comment::text,
        h.created_at,
        h.id_profile,
        p.full_name
    FROM public.task_status_history h
        JOIN public.profile p USING(id_profile)
    WHERE h.id_task = p_id_task
    ORDER BY h.created_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_task_status_history(UUID)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_task_status_history(UUID)
TO authenticated;