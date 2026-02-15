/**
 * AuthPage — Clean login/signup page.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password);
            }
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = `w-full h-11 px-4 rounded-[10px] text-sm
    bg-[var(--bg-input)] border border-[var(--border)]
    text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
    outline-none focus:border-[var(--accent)]
    focus:ring-2 focus:ring-[var(--accent-subtle)]
    transition-all duration-200`;

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{
                background: `
          radial-gradient(ellipse 80% 60% at 50% -20%, var(--accent-glow), transparent),
          var(--bg-base)
        `,
            }}
        >
            <div className="w-full max-w-[400px] animate-fade-in-scale">
                {/* ── Branding ── */}
                <div className="text-center mb-10">
                    <div
                        className="w-16 h-16 rounded-[18px] flex items-center justify-center text-[2rem]
                        mx-auto mb-5"
                        style={{
                            background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                            boxShadow: '0 8px 32px var(--accent-glow)',
                        }}
                    >
                        ✍️
                    </div>
                    <h1 className="text-[1.75rem] font-extrabold text-[var(--text-primary)] tracking-[-0.03em]">
                        Smart Blog Editor
                    </h1>
                    <p className="text-[13px] text-[var(--text-tertiary)] mt-2 leading-relaxed">
                        {isLogin
                            ? 'Sign in to continue writing'
                            : 'Create an account to get started'}
                    </p>
                </div>

                {/* ── Card ── */}
                <div
                    className="rounded-[16px] p-7 border border-[var(--border)]"
                    style={{
                        background: 'var(--bg-surface)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px var(--border-subtle)',
                    }}
                >
                    {/* Tab Toggle */}
                    <div className="flex gap-1 p-1 rounded-[10px] bg-[var(--bg-base)] mb-6">
                        <button
                            type="button"
                            onClick={() => { setIsLogin(true); setError(''); }}
                            className={`flex-1 py-2 text-[13px] font-semibold rounded-[8px] cursor-pointer
                          border-none transition-all duration-200
                          ${isLogin
                                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                                    : 'bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => { setIsLogin(false); setError(''); }}
                            className={`flex-1 py-2 text-[13px] font-semibold rounded-[8px] cursor-pointer
                          border-none transition-all duration-200
                          ${!isLogin
                                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                                    : 'bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-[0.08em]
                                text-[var(--text-tertiary)] mb-2 ml-1">
                                Email address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className={inputClass}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-[0.08em]
                                text-[var(--text-tertiary)] mb-2 ml-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                required
                                minLength={6}
                                className={inputClass}
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[10px]
                              bg-[var(--danger-bg)] border border-[rgba(248,113,113,0.15)]
                              animate-fade-in">
                                <span className="text-[var(--danger)] text-sm">⚠</span>
                                <span className="text-[var(--danger)] text-[12px] font-medium">{error}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 rounded-[10px] text-[13px] font-bold
                         text-white cursor-pointer border-none
                         transition-all duration-200
                         active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                                boxShadow: loading ? 'none' : '0 4px 16px var(--accent-glow)',
                            }}
                        >
                            {loading ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {isLogin ? 'Signing in…' : 'Creating account…'}
                                </span>
                            ) : (
                                isLogin ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer hint */}
                <p className="text-center text-[11px] text-[var(--text-tertiary)] mt-6 opacity-60">
                    AI-powered writing · Auto-save · Rich text editing
                </p>
            </div>
        </div>
    );
}
