import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const KEY = 'chargesathi_token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore a saved login when the app opens
    useEffect(() => {
        (async () => {
            try {
                const saved = await SecureStore.getItemAsync(KEY);
                if (saved) {
                    const res = await api('/me', { token: saved });
                    setToken(saved);
                    setUser(res.user);
                }
            } catch {
                await SecureStore.deleteItemAsync(KEY);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const start = async (res) => {
        await SecureStore.setItemAsync(KEY, res.token);
        setToken(res.token);
        setUser(res.user);
    };

    const login = async (email, password) => start(await api('/login', { method: 'POST', body: { email, password } }));
    const register = async (form) => start(await api('/register', { method: 'POST', body: form }));

    const logout = async () => {
        try {
            await api('/logout', { method: 'POST', token });
        } catch {}
        await SecureStore.deleteItemAsync(KEY);
        setToken(null);
        setUser(null);
    };

    return <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);