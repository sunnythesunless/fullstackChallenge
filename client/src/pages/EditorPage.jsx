/**
 * EditorPage — Premium editor view with sidebar, title, Lexical editor, save indicator, AI.
 */
import { useState, useCallback } from 'react';
import BlogEditor from '../components/Editor/BlogEditor';
import DraftsList from '../components/Sidebar/DraftsList';
import AiPanel from '../components/AI/AiPanel';
import useEditorStore from '../stores/editorStore';
import useAutoSave from '../hooks/useAutoSave';

export default function EditorPage() {
    const { activePostId, title, setTitle, editorState, publishPost, posts } =
        useEditorStore();

    const { isSaving, lastSavedAt } = useAutoSave();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Extract plain text from Lexical JSON for AI
    const getPlainText = useCallback(() => {
        if (!editorState?.root?.children) return '';
        const extractText = (node) => {
            if (node.text) return node.text;
            if (node.children) return node.children.map(extractText).join('');
            return '';
        };
        return editorState.root.children.map(extractText).join('\n');
    }, [editorState]);

    const activePost = posts.find((p) => p.id === activePostId);

    const formatSavedTime = () => {
        if (!lastSavedAt) return '';
        return lastSavedAt.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    return (
        <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">
            {/* ═══ Sidebar ═══ */}
            <aside
                className={`${sidebarOpen ? 'w-64' : 'w-0'
                    } transition-all duration-[var(--transition-slow)] border-r border-[var(--border)]
          overflow-hidden flex-shrink-0`}
            >
                <DraftsList />
            </aside>

            {/* ═══ Main ═══ */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* ── Top Bar ── */}
                <header className="flex items-center justify-between px-5 h-[52px] border-b border-[var(--border)]
                           bg-[var(--bg-surface)] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Sidebar toggle */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)]
                         hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)]
                         cursor-pointer bg-transparent border-none transition-colors text-base"
                            title={sidebarOpen ? 'Collapse' : 'Expand'}
                        >
                            {sidebarOpen ? '◀' : '▶'}
                        </button>

                        {/* Save indicator */}
                        <div className="flex items-center gap-1.5 text-[11px] font-medium">
                            {isSaving ? (
                                <span className="flex items-center gap-1.5 text-[var(--warning)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)] animate-pulse" />
                                    Saving…
                                </span>
                            ) : lastSavedAt ? (
                                <span className="flex items-center gap-1.5 text-[var(--success)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                                    Saved {formatSavedTime()}
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {/* Status badge */}
                        {activePost && (
                            <span
                                className={`text-[10px] px-2 py-[3px] rounded-full font-semibold uppercase tracking-wider ${activePost.status === 'published'
                                        ? 'bg-[var(--success-bg)] text-[var(--success)]'
                                        : 'bg-[var(--warning-bg)] text-[var(--warning)]'
                                    }`}
                            >
                                {activePost.status === 'published' ? 'Published' : 'Draft'}
                            </span>
                        )}

                        {/* Publish */}
                        {activePost && activePost.status === 'draft' && (
                            <button
                                onClick={() => publishPost()}
                                className="px-3.5 py-1.5 text-[12px] font-semibold rounded-[var(--radius)]
                           bg-[var(--accent)] text-white
                           hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-glow)]
                           transition-all duration-[var(--transition)] cursor-pointer
                           border-none active:scale-95"
                            >
                                Publish
                            </button>
                        )}
                    </div>
                </header>

                {/* ── Editor Area ── */}
                {activePostId ? (
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-[720px] mx-auto px-6 py-10 animate-fade-in">
                            {/* Title */}
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Post title..."
                                className="w-full text-[2rem] font-extrabold bg-transparent border-none outline-none
                           text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                           mb-6 leading-[1.2] tracking-[-0.02em] caret-[var(--accent)]"
                            />

                            {/* AI */}
                            <div className="mb-5 pb-5 border-b border-[var(--border-subtle)]">
                                <AiPanel editorText={getPlainText()} />
                            </div>

                            {/* Editor */}
                            <div className="rounded-[var(--radius-lg)] border border-[var(--border)]
                              bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]
                              overflow-hidden">
                                <BlogEditor />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Empty State ── */
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center animate-fade-in-scale">
                            <div className="w-20 h-20 rounded-2xl bg-[var(--accent-subtle)] flex items-center
                              justify-center text-4xl mx-auto mb-6 shadow-[var(--shadow-glow)]">
                                ✍️
                            </div>
                            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 tracking-[-0.02em]">
                                Smart Blog Editor
                            </h2>
                            <p className="text-sm text-[var(--text-tertiary)] mb-6 max-w-[280px] mx-auto leading-relaxed">
                                Select a post from the sidebar or create a new one to get started.
                            </p>
                            <button
                                onClick={() => useEditorStore.getState().createPost()}
                                className="px-5 py-2.5 rounded-[var(--radius-lg)] bg-[var(--accent)] text-white
                           text-sm font-semibold hover:bg-[var(--accent-hover)]
                           hover:shadow-[var(--shadow-glow)] transition-all duration-[var(--transition)]
                           cursor-pointer border-none active:scale-95"
                            >
                                + New Post
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
