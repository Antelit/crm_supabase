
import { useCallback, useEffect, useState } from 'react';
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
    id_profile_assignee: string;
    created_at: string;
};

type HistoryItem = {
    id_task_status_history: string;
    from_status: string | null;
    to_status: string;
    comment: string | null;
    created_at: string;
    id_profile_author: string;
    author_name: string;
};

type Executor = {
    id_profile: string;
    full_name: string;
};

type Props = {
    taskId: string;
    profile: Profile;
    onBack: () => void;
};

export default function TaskDetailsPage({ taskId, profile, onBack }: Props) {
    const [task, setTask] = useState<Task | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [comment, setComment] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [executors, setExecutors] = useState<Executor[]>([]);
    const [editAssignee, setEditAssignee] = useState('');
    const [assigneeName, setAssigneeName] = useState('');

    const loadData = useCallback(async (isActive: () => boolean = () => true) => {
        const { data: taskData, error: taskError } = await supabase
            .from('task')
            .select('id_task, title, description, status, id_profile_assignee, created_at')
            .eq('id_task', taskId)
            .single();

        if (!isActive()) return;

        setMessage('');

        if (taskError) {
            setMessage(taskError.message);
            setLoading(false);
            return;
        }

        setTask(taskData);

        const { data: assigneeData, error: assigneeError } = await supabase
            .from('profile')
            .select('full_name')
            .eq('id_profile', taskData.id_profile_assignee)
            .single();

        if (!isActive()) return;

        if (assigneeError) {
            setMessage(assigneeError.message);
            setLoading(false);
            return;
        }

        setAssigneeName(assigneeData.full_name);

        const { data: historyData, error: historyError } = await supabase.rpc(
            'get_task_status_history',
            { p_id_task: taskId }
        );

        if (!isActive()) return;

        if (historyError) {
            setMessage(historyError.message);
            setLoading(false);
            return;
        }

        setHistory(historyData ?? []);

        if (profile.role === 'manager') {
            const { data: executorData, error: executorError } = await supabase
                .from('profile')
                .select('id_profile, full_name')
                .eq('role', 'executor')
                .order('full_name');

            if (!isActive()) return;

            if (executorError) {
                setMessage(executorError.message);
                setLoading(false);
                return;
            }

            setExecutors(executorData ?? []);
        }

        setLoading(false);
    }, [taskId, profile.role]);

    const changeStatus = async (nextStatus: string) => {
        setActionLoading(true);
        setMessage('');

        const { error } = await supabase.rpc('change_task_status', {
            p_id_task: taskId,
            p_to_status: nextStatus,
            p_comment: nextStatus === 'revision' ? comment : null
        });

        if (error) {
            setMessage(error.message);
            setActionLoading(false);
            return;
        }

        setComment('');
        await loadData();
        setActionLoading(false);
    };

    const saveTask = async () => {
        if (!editTitle.trim()) {
            setMessage('Название задачи обязательно');
            return;
        }

        setActionLoading(true);
        setMessage('');

        const { error } = await supabase
            .from('task')
            .update({
                title: editTitle.trim(),
                description: editDescription.trim() || null,
                id_profile_assignee: editAssignee
            })
            .eq('id_task', taskId);

        if (error) {
            setMessage(error.message);
            setActionLoading(false);
            return;
        }

        setEditMode(false);
        await loadData();
        setActionLoading(false);
    };

    useEffect(() => {
        let active = true;

        void Promise.resolve().then(() => loadData(() => active));

        return () => {
            active = false;
        };
    }, [loadData]);

    if (loading) return <div style={{ padding: 24 }}>Загрузка...</div>;

    if (!task) {
        return (
            <div style={{ padding: 24 }}>
                <p>{message || 'Задача не найдена'}</p>
                <button onClick={onBack}>Назад</button>
            </div>
        );
    }

    const isAssignee = task.id_profile_assignee === profile.id_profile;

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
            <button onClick={onBack}>← Назад к задачам</button>

            {editMode ? (
                <div>
                    <h2>Редактирование задачи</h2>

                    <input
                        value={editTitle}
                        onChange={event => setEditTitle(event.target.value)}
                        placeholder="Название задачи"
                    />

                    <br />

                    <textarea
                        value={editDescription}
                        onChange={event => setEditDescription(event.target.value)}
                        placeholder="Описание задачи"
                        rows={4}
                    />

                    <br />

                    <select
                        value={editAssignee}
                        onChange={event => setEditAssignee(event.target.value)}
                    >
                        {executors.map(executor => (
                            <option key={executor.id_profile} value={executor.id_profile}>
                                {executor.full_name}
                            </option>
                        ))}
                    </select>
                    <br />

                    <button disabled={actionLoading} onClick={() => void saveTask()}>
                        Сохранить
                    </button>

                    <button disabled={actionLoading} onClick={() => setEditMode(false)}>
                        Отмена
                    </button>
                </div>
            ) : (
                <>
                    <h1>{task.title}</h1>
                    <p>{task.description || 'Без описания'}</p>

                    {profile.role === 'manager' && (
                        <button
                            onClick={() => {
                                setEditTitle(task.title);
                                setEditDescription(task.description || '');
                                setEditAssignee(task.id_profile_assignee);
                                setEditMode(true);
                            }}
                        >
                            Редактировать
                        </button>
                    )}
                </>
            )}

            <p>Статус: {task.status}</p>
            <p>Исполнитель: {assigneeName}</p>
            <p>Создана: {new Date(task.created_at).toLocaleString()}</p>

            {!editMode && (
                <>
                    <h2>Действия</h2>

                    {profile.role === 'executor' && isAssignee && task.status === 'new' && (
                        <button disabled={actionLoading} onClick={() => void changeStatus('in_progress')}>
                            Взять в работу
                        </button>
                    )}

                    {profile.role === 'executor' && isAssignee && task.status === 'in_progress' && (
                        <button disabled={actionLoading} onClick={() => void changeStatus('review')}>
                            Отправить на проверку
                        </button>
                    )}

                    {profile.role === 'executor' && isAssignee && task.status === 'revision' && (
                        <button disabled={actionLoading} onClick={() => void changeStatus('in_progress')}>
                            Вернуть в работу
                        </button>
                    )}

                    {profile.role === 'manager' && task.status === 'review' && (
                        <>
                            <button disabled={actionLoading} onClick={() => void changeStatus('accepted')}>
                                Принять
                            </button>

                            <div style={{ marginTop: 12 }}>
                                <textarea
                                    value={comment}
                                    onChange={event => setComment(event.target.value)}
                                    placeholder="Комментарий с замечаниями"
                                    rows={3}
                                />

                                <br />

                                <button
                                    disabled={actionLoading || !comment.trim()}
                                    onClick={() => void changeStatus('revision')}
                                >
                                    Вернуть на доработку
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}

            <h2>История изменений</h2>

            {history.length === 0 && <p>История пока пуста</p>}

            {history.map(item => (
                <article
                    key={item.id_task_status_history}
                    style={{ padding: 12, borderBottom: '1px solid #ccc' }}
                >
                    <strong>{item.from_status || 'Создание'} → {item.to_status}</strong>
                    <p>{item.comment || 'Без комментария'}</p>
                    <small>
                        {item.author_name} · {new Date(item.created_at).toLocaleString()}
                    </small>
                </article>
            ))}

            {message && <p>{message}</p>}
        </div>
    );
}
