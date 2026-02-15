/**
 * Editor Zustand Store — manages posts, editor state, and auto-save.
 */
import { create } from 'zustand';
import api from '../api/client';

const useEditorStore = create((set, get) => ({
    // ─── State ───
    posts: [],
    activePostId: null,
    editorState: null,      // Lexical JSON
    title: 'Untitled',
    isSaving: false,
    lastSavedAt: null,
    isLoading: false,
    error: null,

    // ─── Editor State ───
    setEditorState: (state) => set({ editorState: state }),
    setTitle: (title) => set({ title }),

    // ─── Active Post ───
    setActivePost: (id) => {
        const post = get().posts.find((p) => p.id === id);
        if (post) {
            set({
                activePostId: id,
                title: post.title || 'Untitled',
                editorState: post.content_json,
            });
        }
    },

    // ─── CRUD ───
    fetchPosts: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await api.get('/posts/');
            set({ posts: data.posts, isLoading: false });
        } catch (err) {
            set({ error: err.message, isLoading: false });
        }
    },

    createPost: async () => {
        try {
            const { data } = await api.post('/posts/', { title: 'Untitled' });
            set((state) => ({
                posts: [data, ...state.posts],
                activePostId: data.id,
                title: data.title,
                editorState: data.content_json,
            }));
            return data;
        } catch (err) {
            set({ error: err.message });
            return null;
        }
    },

    savePost: async () => {
        const { activePostId, editorState, title } = get();
        if (!activePostId) return;

        set({ isSaving: true });
        try {
            const { data } = await api.patch(`/posts/${activePostId}`, {
                title,
                content_json: editorState,
            });
            set((state) => ({
                isSaving: false,
                lastSavedAt: new Date(),
                posts: state.posts.map((p) => (p.id === activePostId ? data : p)),
            }));
        } catch (err) {
            set({ isSaving: false, error: err.message });
        }
    },

    publishPost: async (id) => {
        const postId = id || get().activePostId;
        if (!postId) return;

        try {
            const { data } = await api.post(`/posts/${postId}/publish`);
            set((state) => ({
                posts: state.posts.map((p) => (p.id === postId ? data : p)),
            }));
        } catch (err) {
            set({ error: err.message });
        }
    },

    deletePost: async (id) => {
        try {
            await api.delete(`/posts/${id}`);
            set((state) => {
                const posts = state.posts.filter((p) => p.id !== id);
                const newActive = state.activePostId === id ? null : state.activePostId;
                return {
                    posts,
                    activePostId: newActive,
                    editorState: newActive ? state.editorState : null,
                    title: newActive ? state.title : 'Untitled',
                };
            });
        } catch (err) {
            set({ error: err.message });
        }
    },
}));

export default useEditorStore;
