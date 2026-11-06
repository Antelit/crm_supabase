CREATE OR REPLACE FUNCTION public.change_task_status(
    p_id_task UUID,
    p_to_status TEXT,
    p_comment TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER

AS $$
DECLARE
    v_user_id UUID;
    v_user_role TEXT;
    v_current_status TEXT;
    v_assignee_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    v_user_role := public.get_user_role();

    SELECT t.status, t.id_profile_assignee
        INTO v_current_status, v_assignee_id
    FROM public.task t
    WHERE t.id_task = p_id_task
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Task not found';
    END IF;

    IF v_user_role = 'manager' THEN
        IF v_current_status <> 'review' OR p_to_status NOT IN ('accepted', 'revision') THEN
            RAISE EXCEPTION 'Invalid manager status transition';
        END IF;

        IF p_to_status = 'revision' AND NULLIF(TRIM(p_comment), '') IS NULL THEN
            RAISE EXCEPTION 'Comment is required for revision';
        END IF;

    ELSIF v_user_role = 'executor' THEN
        IF v_assignee_id <> v_user_id THEN
            RAISE EXCEPTION 'You are not assigned to this task';
        END IF;

        IF NOT (
            (v_current_status = 'new' AND p_to_status = 'in_progress')
            OR (v_current_status = 'in_progress' AND p_to_status = 'review')
            OR (v_current_status = 'revision' AND p_to_status = 'in_progress')
        ) THEN
            RAISE EXCEPTION 'Invalid executor status transition';
        END IF;

    ELSE
        RAISE EXCEPTION 'Access denied';
    END IF;

    UPDATE public.task
        SET status = p_to_status, updated_at = NOW()
    WHERE id_task = p_id_task;

    INSERT INTO public.task_status_history (
        id_task, id_profile, from_status, to_status, comment
    )
    VALUES (
        p_id_task, v_user_id, v_current_status, p_to_status, NULLIF(TRIM(p_comment), '')
    );
END;
$$;