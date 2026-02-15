/**
 * Auth Zustand Store — manages JWT token and user state.
 */
import { create } from 'zustand';
import api from '../api/client';

const useAuthStore = create((set, get) => ({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    error: null,

    signup: async (email, password) => {
        // Register then auto-login
        await api.post('/auth/signup', { email, password });
        // Now login to get the token
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.access_token);
        set({ token: data.access_token, isAuthenticated: true, error: null });
    },

    login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.access_token);
        set({ token: data.access_token, isAuthenticated: true, error: null });
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null, isAuthenticated: false });
    },

    clearError: () => set({ error: null }),
}));

export default useAuthStore;
