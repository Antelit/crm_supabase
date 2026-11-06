
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Profile = {
    id_profile: string;
    full_name: string;
    role: 'manager' | 'executor';
};

type Task = {
    id_task: string;
    title: string;
    description: string | null;
    status: string;
    created_at: string;
};

type Props = {
    profile: Profile;
    onBack: () => void;
    onSelectTask: (taskId: string) => void;
};

export default function MyTasksPage({ profile, onBack, onSelectTask }: Props) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        let cancelled = false;

        void supabase
            .from('task')
            .select('id_task, title, description, status, created_at')
            .eq('id_profile_assignee', profile.id_profile)
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (cancelled) return;

                if (error) {
                    setMessage(error.message);
                    setLoading(false);
                    return;
                }

                setTasks(data ?? []);
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [profile.id_profile]);

    return (
        <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
            <button onClick={onBack}>← К объектам</button>

            <h1>Мои задачи</h1>

            {loading && <p>Загрузка...</p>}

            {!loading && tasks.length === 0 && <p>Назначенных задач пока нет</p>}

            {tasks.map(task => (
                <article
                    key={task.id_task}
                    style={{ padding: 16, borderBottom: '1px solid #ccc' }}
                >
                    <h3>{task.title}</h3>
                    <p>{task.description || 'Без описания'}</p>
                    <p>Статус: {task.status}</p>
                    <small>{new Date(task.created_at).toLocaleString()}</small>
                    <br />
                    <button onClick={() => onSelectTask(task.id_task)}>
                        Открыть задачу
                    </button>
                </article>
            ))}

            {message && <p>{message}</p>}
        </div>
    );
}
