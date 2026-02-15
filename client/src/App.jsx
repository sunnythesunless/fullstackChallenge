/**
 * App — Root with auth-protected routing and theme toggle.
 */
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EditorPage from './pages/EditorPage';
import PublishedPage from './pages/PublishedPage';
import AuthPage from './pages/AuthPage';
import useAuthStore from './stores/authStore';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <div className="relative">
      {/* Theme Toggle — always visible */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-5 right-5 z-[60] w-9 h-9 rounded-full
                   bg-[var(--bg-elevated)] border border-[var(--border)]
                   flex items-center justify-center text-base cursor-pointer
                   hover:bg-[var(--bg-hover)] hover:border-[var(--accent)]
                   hover:shadow-[var(--shadow-glow)]
                   transition-all duration-[var(--transition)]
                   active:scale-90"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {/* Logout — only when logged in */}
      {isAuthenticated && (
        <button
          onClick={logout}
          className="fixed bottom-5 right-16 z-[60] h-9 px-3 rounded-full
                     bg-[var(--bg-elevated)] border border-[var(--border)]
                     flex items-center justify-center text-[11px] font-medium
                     text-[var(--text-secondary)] cursor-pointer
                     hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]
                     hover:border-[var(--danger)]
                     transition-all duration-[var(--transition)]
                     active:scale-95"
          title="Sign out"
        >
          Logout
        </button>
      )}

      <Routes>
        <Route
          path="/auth"
          element={isAuthenticated ? <Navigate to="/" /> : <AuthPage />}
        />
        <Route
          path="/"
          element={isAuthenticated ? <EditorPage /> : <Navigate to="/auth" />}
        />
        <Route path="/post/:id" element={<PublishedPage />} />
      </Routes>
    </div>
  );
}
