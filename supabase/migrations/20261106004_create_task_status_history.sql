CREATE TABLE public.task_status_history (
    id_task_status_history UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_task UUID NOT NULL REFERENCES public.task(id_task) ON DELETE CASCADE,
    id_profile UUID NOT NULL REFERENCES public.profile(id_profile),
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_task_status_history_from_status
        CHECK (from_status IS NULL OR from_status IN ('new', 'in_progress', 'review', 'accepted', 'revision')),

    CONSTRAINT chk_task_status_history_to_status
        CHECK (to_status IN ('new', 'in_progress', 'review', 'accepted', 'revision'))
);