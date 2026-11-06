
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
    created_at: string;
};

type Props = {
    profile: Profile;
    onLogout: () => void;
    onSelectObject: (objectId: string) => void;
    onShowMyTasks: () => void;
};

export default function ObjectsPage({ profile, onLogout, onSelectObject, onShowMyTasks }: Props) {
    const [objects, setObjects] = useState<ConstructionObject[]>([]);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        let active = true;

        void supabase
            .from('object')
            .select('id_object, name, address, created_at')
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (!active) return;

                if (error) {
                    setMessage(error.message);
                    setLoading(false);
                    return;
                }

                setObjects(data ?? []);
                setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const loadObjects = async () => {
        setLoading(true);
        setMessage('');

        const { data, error } = await supabase
            .from('object')
            .select('id_object, name, address, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            setMessage(error.message);
            setLoading(false);
            return;
        }

        setObjects(data ?? []);
        setLoading(false);
    };

    const createObject = async () => {
        if (!name.trim() || !address.trim()) {
            setMessage('Заполните название и адрес объекта');
            return;
        }

        const { error } = await supabase
            .from('object')
            .insert({
                name: name.trim(),
                address: address.trim(),
                id_profile_author: profile.id_profile
            });

        if (error) {
            setMessage(error.message);
            return;
        }

        setName('');
        setAddress('');
        await loadObjects();
    };

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Объекты</h1>
                    <div>{profile.full_name} · {profile.role}</div>
                    {profile.role === 'executor' && (
                        <button onClick={onShowMyTasks}>
                            Мои задачи
                        </button>
                    )}
                </div>

                <button onClick={onLogout}>Выйти</button>
            </header>

            {profile.role === 'manager' && (
                <section style={{ marginTop: 24 }}>
                    <h2>Новый объект</h2>

                    <div>
                        <input
                            placeholder="Название объекта"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div style={{ marginTop: 8 }}>
                        <input
                            placeholder="Адрес"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                        />
                    </div>

                    <button onClick={createObject} style={{ marginTop: 12 }}>
                        Создать объект
                    </button>
                </section>
            )}

            {message && <p>{message}</p>}

            <section style={{ marginTop: 32 }}>
                <h2>Список объектов</h2>

                {loading && <p>Загрузка...</p>}

                {!loading && objects.length === 0 && (
                    <p>Объекты не найдены</p>
                )}

                {objects.map(object => (
                    <article
                        key={object.id_object}
                        style={{
                            padding: 16,
                            marginBottom: 12,
                            border: '1px solid #ccc',
                            borderRadius: 6
                        }}
                    >
                        <h3>{object.name}</h3>
                        <p>{object.address}</p>
                        <button onClick={() => onSelectObject(object.id_object)}>
                            Открыть задачи
                        </button>
                    </article>
                ))}
            </section>
        </div>
    );
}
