/**
 * AiPanel — Premium slide-out AI panel.
 */
import { useState, useCallback } from 'react';
import api from '../../api/client';

export default function AiPanel({ editorText }) {
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const generate = useCallback(
        async (actionType) => {
            if (!editorText || editorText.trim().length === 0) {
                setResult('Write some content in the editor first.');
                setAction(actionType);
                setIsOpen(true);
                return;
            }

            setLoading(true);
            setAction(actionType);
            setIsOpen(true);
            setResult('');

            try {
                const { data } = await api.post('/ai/generate', {
                    text: editorText,
                    action: actionType,
                });
                setResult(data.result);
            } catch (err) {
                setResult('Error: ' + (err.response?.data?.detail || err.message));
            } finally {
                setLoading(false);
            }
        },
        [editorText]
    );

    const actions = [
        { key: 'summarize', icon: '⚡', label: 'Summarize', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-subtle)]', hoverBg: 'hover:bg-[var(--accent-subtle)]' },
        { key: 'fix_grammar', icon: '✏️', label: 'Fix Grammar', color: 'text-[var(--success)]', bg: 'bg-[var(--success-bg)]', hoverBg: 'hover:bg-[var(--success-bg)]' },
        { key: 'expand', icon: '📖', label: 'Expand', color: 'text-[var(--info)]', bg: 'bg-[var(--info-bg)]', hoverBg: 'hover:bg-[var(--info-bg)]' },
        { key: 'title', icon: '💡', label: 'Titles', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning-bg)]', hoverBg: 'hover:bg-[var(--warning-bg)]' },
    ];

    const actionLabels = {
        summarize: '⚡ Summary',
        fix_grammar: '✏️ Grammar Fix',
        expand: '📖 Expanded',
        title: '💡 Title Suggestions',
    };

    return (
        <>
            {/* ── Action Buttons ── */}
            <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--text-tertiary)] mr-1">
                    AI
                </span>
                {actions.map((a) => (
                    <button
                        key={a.key}
                        onClick={() => generate(a.key)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-full
                        ${a.bg} ${a.color} ${a.hoverBg}
                        transition-all duration-[var(--transition-fast)] cursor-pointer border-none
                        active:scale-95`}
                    >
                        {a.icon} {a.label}
                    </button>
                ))}
            </div>

            {/* ── Slide-out Panel ── */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[2px]"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="fixed inset-y-0 right-0 w-[420px] max-w-full bg-[var(--bg-surface)]
                          border-l border-[var(--border)] z-50 animate-slide-in flex flex-col
                          shadow-[var(--shadow-lg)]">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-glow" />
                                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                                    {actionLabels[action] || 'AI Result'}
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)]
                           hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)]
                           cursor-pointer bg-transparent border-none transition-colors text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 p-5 overflow-y-auto">
                            {loading ? (
                                <div className="space-y-3">
                                    {[80, 100, 60].map((w, i) => (
                                        <div
                                            key={i}
                                            className="h-3 rounded-full bg-[var(--bg-elevated)]"
                                            style={{
                                                width: `${w}%`,
                                                background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%)',
                                                backgroundSize: '200% 100%',
                                                animation: 'shimmer 1.5s infinite',
                                                animationDelay: `${i * 200}ms`,
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap animate-fade-in">
                                    {result}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
