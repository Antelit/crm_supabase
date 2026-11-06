import { useState } from 'react';
import { supabase } from '../lib/supabase';

type Task = {
    id_task: string;
    title: string;
    status: string;
};

export default function SupabaseSecurityTest() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [message, setMessage] = useState('');

    const login = async () => {
        setMessage('');
        setTasks([]);

        const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (loginError) {
            setMessage(loginError.message);
            return;
        }

        const { data, error } = await supabase
            .from('task')
            .select('id_task, title, status');

        if (error) {
            setMessage(error.message);
            return;
        }

        setTasks(data ?? []);
        setMessage(`Авторизация успешна. Найдено задач: ${data.length}`);
    };

    const tryDirectUpdate = async (id_task: string) => {
        const { error } = await supabase
            .from('task')
            .update({ status: 'review' })
            .eq('id_task', id_task);

        if (error) {
            setMessage(error.message);
            return;
        }

        setMessage('ОШИБКА: прямое изменение статуса прошло!');
    }

    const changeStatus = async (id_task: string) => {
        const { error } = await supabase.rpc('change_task_status', {
            p_id_task: id_task,
            p_to_status: 'in_progress',
            p_comment: null
        });

        if (error) {
            setMessage(error.message);
            return;
        }

        setMessage('Статус успешно изменён');

        const { data } = await supabase
            .from('task')
            .select('id_task, title, status');

        setTasks(data ?? []);
    };

    const tryUpdateHistory = async (id_task: string) => {
        const { data, error: selectError } = await supabase
            .from('task_status_history')
            .select('id_task_status_history')
            .eq('id_task', id_task)
            .limit(1)
            .single();

        if (selectError) {
            setMessage(selectError.message);
            return;
        }

        const { error } = await supabase
            .from('task_status_history')
            .update({ comment: 'Поддельный комментарий' })
            .eq('id_task_status_history', data.id_task_status_history);

        if (error) {
            setMessage(`Ожидаемый отказ: ${error.message}`);
            return;
        }

        setMessage('ОШИБКА: историю удалось изменить!');
    };

    const tryDeleteHistory = async (id_task: string) => {
        const { data, error: selectError } = await supabase
            .from('task_status_history')
            .select('id_task_status_history')
            .eq('id_task', id_task)
            .limit(1)
            .single();

        if (selectError) {
            setMessage(selectError.message);
            return;
        }

        const { error } = await supabase
            .from('task_status_history')
            .delete()
            .eq('id_task_status_history', data.id_task_status_history);

        if (error) {
            setMessage(`Ожидаемый отказ: ${error.message}`);
            return;
        }

        setMessage('ОШИБКА: историю удалось удалить!');
    };
    const logout = async () => {
        await supabase.auth.signOut();
        setTasks([]);
        setMessage('Вы вышли из системы');
    };

    return (
        <div style={{ padding: 24, maxWidth: 600 }}>
            <h2>Проверка Supabase RLS</h2>

            <div>
                <input
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
            </div>

            <div style={{ marginTop: 8 }}>
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
            </div>

            <div style={{ marginTop: 12 }}>
                <button onClick={login}>Войти и загрузить задачи</button>

                <button onClick={logout} style={{ marginLeft: 8 }}>Выйти</button>
            </div>

            <p>{message}</p>

            <h3>Доступные задачи: {tasks.length}</h3>

            {tasks.map(task => (
                <div key={task.id_task} style={{ marginBottom: 12 }}>
                    <strong>{task.title}</strong>
                    <div>Статус: {task.status}</div>
                    <button onClick={() => tryDirectUpdate(task.id_task)}>
                        статус напрямую
                    </button>
                    <button onClick={() => changeStatus(task.id_task)}>
                        через RPC
                    </button>

                    <button onClick={() => tryUpdateHistory(task.id_task)}>
                        Попробовать изменить историю
                    </button>

                    <button onClick={() => tryDeleteHistory(task.id_task)}>
                        Попробовать удалить историю
                    </button>
                </div>
            ))}
        </div>
    );
}