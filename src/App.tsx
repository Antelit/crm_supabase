import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import ObjectsPage from './components/ObjectsPage';
import ObjectTasksPage from './components/ObjectTasksPage';
import TaskDetailsPage from './components/TaskDetailsPage';
import MyTasksPage from './components/MyTasksPage';

type Profile = {
    id_profile: string;
    full_name: string;
    role: 'manager' | 'executor';
};

function App() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [showMyTasks, setShowMyTasks] = useState(false);

    const loadProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profile')
            .select('id_profile, full_name, role')
            .eq('id_profile', userId)
            .single();

        if (error) {
            setMessage(error.message);
            setProfile(null);
            return;
        }

        setProfile(data);
    };

    useEffect(() => {
        const initialize = async () => {
            const { data } = await supabase.auth.getSession();

            if (data.session) {
                await loadProfile(data.session.user.id);
            }

            setLoading(false);
        };

        void initialize();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                void loadProfile(session.user.id);
            }

            if (event === 'SIGNED_OUT') {
                setProfile(null);
            }
        });

        return () => authListener.subscription.unsubscribe();
    }, []);

    const login = async () => {
        setMessage('');

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            setMessage(error.message);
        }
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            setMessage(error.message);
        }
    };

    if (loading) return <div>Загрузка...</div>;

    if (!profile) {
        return (
            <div style={{ maxWidth: 350, margin: '100px auto' }}>
                <h2>Вход в CRM</h2>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', marginBottom: 12 }}
                />

                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%', marginBottom: 12 }}
                />

                <button onClick={login}>Войти</button>

                {message && <p>{message}</p>}
            </div>
        );
    }

    if (selectedTaskId) {
        return <TaskDetailsPage
            taskId={selectedTaskId}
            profile={profile}
            onBack={() => setSelectedTaskId(null)}
        />;
    }

    if (showMyTasks) {
        return <MyTasksPage
            profile={profile}
            onBack={() => setShowMyTasks(false)}
            onSelectTask={setSelectedTaskId}
        />;
    }

    if (selectedObjectId) {
        return <ObjectTasksPage
            objectId={selectedObjectId}
            profile={profile}
            onBack={() => setSelectedObjectId(null)}
            onSelectTask={setSelectedTaskId}
        />;
    }

    return <ObjectsPage
        profile={profile}
        onLogout={logout}
        onSelectObject={setSelectedObjectId}
        onShowMyTasks={() => setShowMyTasks(true)}
    />;
}

export default App;