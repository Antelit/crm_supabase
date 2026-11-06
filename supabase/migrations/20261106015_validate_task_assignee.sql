CREATE OR REPLACE FUNCTION public.validate_task_assignee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER

AS $$
DECLARE
    v_is_executor BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.profile p
        WHERE p.id_profile = NEW.id_profile_assignee
            AND p.role = 'executor'
    )
    INTO v_is_executor;

    IF NOT v_is_executor THEN
        RAISE EXCEPTION 'Task assignee must be an executor';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_task_assignee
BEFORE INSERT OR UPDATE OF id_profile_assignee ON public.task
FOR EACH ROW
EXECUTE FUNCTION public.validate_task_assignee();

REVOKE ALL ON FUNCTION public.validate_task_assignee() FROM PUBLIC, anon, authenticated;