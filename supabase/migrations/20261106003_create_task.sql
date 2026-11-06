CREATE TABLE public.task (
    id_task UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_object UUID NOT NULL REFERENCES public.object(id_object),
    id_profile_author UUID NOT NULL REFERENCES public.profile(id_profile),
    id_profile_assignee UUID NOT NULL REFERENCES public.profile(id_profile),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'in_progress', 'review', 'accepted', 'revision')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);