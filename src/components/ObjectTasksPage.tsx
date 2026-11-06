
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Profile = {
    id_profile: string;
    full_name: string;
    role: 'manager' | 'executor';
};

type ConstructionObject = {
    id_object: string;
    name: string;
    address: string;
};

type Executor = {
    id_profile: string;
    full_name: string;
};

type Task = {
    id_task: string;
    title: string;
    description: string | null;
    status: string;
    id_profile_assignee: string;
    created_at: string;
};

type Props = {
    objectId: string;
    profile: Profile;
    onBack: () => void;
    onSelectTask: (taskId: string) => void;
};

export default function ObjectTasksPage({ objectId, profile, onBack, onSelectTask }: Props) {
    const [object, setObject] = useState<ConstructionObject | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [executors, setExecutors] = useState<Executor[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        let active = true;

        const loadData = async () => {
            const { data: objectData, error: objectError } = await supabase
                .from('object')
                .select('id_object, name, address')
                .eq('id_object', objectId)
                .single();

            if (!active) return;

            if (objectError) {
                setMessage(objectError.message);
                setLoading(false);
                return;
            }

            setObject(objectData);

            const { data: taskData, error: taskError } = await supabase
                .from('task')
                .select('id_task, title, description, status, id_profile_assignee, created_at')
                .eq('id_object', objectId)
                .order('created_at', { ascending: false });

            if (!active) return;

            if (taskError) {
                setMessage(taskError.message);
                setLoading(false);
                return;
            }

            setTasks(taskData ?? []);

            if (profile.role === 'manager') {
                const { data: executorData, error: executorError } = await supabase
                    .from('profile')
                    .select('id_profile, full_name')
                    .eq('role', 'executor')
                    .order('full_name');

                if (!active) return;

                if (executorError) {
                    setMessage(executorError.message);
                    setLoading(false);
                    return;
                }

                setExecutors(executorData ?? []);
            }

            setMessage('');
            setLoading(false);
        };

        void loadData();

        return () => {
            active = false;
        };
    }, [objectId, profile.role]);

    const loadData = async () => {
        setLoading(true);
        setMessage('');

        const { data: objectData, error: objectError } = await supabase
            .from('object')
            .select('id_object, name, address')
            .eq('id_object', objectId)
            .single();

        if (objectError) {
            setMessage(objectError.message);
            setLoading(false);
            return;
        }

        setObject(objectData);

        const { data: taskData, error: taskError } = await supabase
            .from('task')
            .select('id_task, title, description, status, id_profile_assignee, created_at')
            .eq('id_object', objectId)
            .order('created_at', { ascending: false });

        if (taskError) {
            setMessage(taskError.message);
            setLoading(false);
            return;
        }

        setTasks(taskData ?? []);
        setLoading(false);
    };

    const createTask = async () => {
        if (!title.trim() || !assigneeId) {
            setMessage('Укажите название задачи и исполнителя');
            return;
        }

        const { error } = await supabase
            .from('task')
            .insert({
                id_object: objectId,
                id_profile_author: profile.id_profile,
                id_profile_assignee: assigneeId,
                title: title.trim(),
                description: description.trim() || null
            });

        if (error) {
            setMessage(error.message);
            return;
        }

        setTitle('');
        setDescription('');
        setAssigneeId('');
        await loadData();
    };

    const getExecutorName = (id: string) => {
        return executors.find(executor => executor.id_profile === id)?.full_name
            ?? (id === profile.id_profile ? profile.full_name : 'Исполнитель');
    };

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
            <button onClick={onBack}>← К объектам</button>

            {loading && <p>Загрузка...</p>}

            {!loading && object && (
                <>
                    <h1>{object.name}</h1>
                    <p>{object.address}</p>

                    {profile.role === 'manager' && (
                        <section style={{ marginTop: 24 }}>
                            <h2>Новая задача</h2>

                            <div>
                                <input
                                    placeholder="Название задачи"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </div>

                            <div style={{ marginTop: 8 }}>
                                <textarea
                                    placeholder="Описание задачи"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>

                            <div style={{ marginTop: 8 }}>
                                <select
                                    value={assigneeId}
                                    onChange={e => setAssigneeId(e.target.value)}
                                >
                                    <option value="">Выберите исполнителя</option>
                                    {executors.map(executor => (
                                        <option key={executor.id_profile} value={executor.id_profile}>
                                            {executor.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button onClick={createTask} style={{ marginTop: 12 }}>
                                Создать задачу
                            </button>
                        </section>
                    )}

                    <section style={{ marginTop: 32 }}>
                        <h2>Задачи ({tasks.length})</h2>

                        {tasks.length === 0 && <p>Задач пока нет</p>}

                        {tasks.map(task => (
                            <article
                                key={task.id_task}
                                style={{
                                    padding: 16,
                                    marginBottom: 12,
                                    border: '1px solid #ccc',
                                    borderRadius: 6
                                }}
                            >
                                <h3>{task.title}</h3>
                                <p>{task.description || 'Без описания'}</p>
                                <p>Статус: {task.status}</p>
                                <p>Исполнитель: {getExecutorName(task.id_profile_assignee)}</p>
                                <small>
                                    Создана: {new Date(task.created_at).toLocaleString()}
                                </small>
                                <br />
                                <button onClick={() => onSelectTask(task.id_task)}>
                                    Открыть задачу
                                </button>
                            </article>
                        ))}
                    </section>
                </>
            )}

            {message && <p>{message}</p>}
        </div>
    );
}
