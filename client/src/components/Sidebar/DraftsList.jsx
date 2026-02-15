/**
 * DraftsList — Sidebar showing all drafts/posts with premium dark styling.
 */
import { useEffect } from 'react';
import useEditorStore from '../../stores/editorStore';

export default function DraftsList() {
    const { posts, activePostId, setActivePost, createPost, deletePost, fetchPosts, isLoading } =
        useEditorStore();

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex flex-col h-full bg-[var(--bg-surface)]">
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                    <span className="text-lg">✍️</span>
                    <h2 className="text-xs font-semibold tracking-[0.1em] uppercase text-[var(--text-tertiary)]">
                        Posts
                    </h2>
                </div>
                <button
                    onClick={createPost}
                    className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)]
                     bg-[var(--accent)] text-white text-sm font-medium
                     hover:bg-[var(--accent-hover)] transition-all duration-[var(--transition-fast)]
                     cursor-pointer border-none shadow-sm hover:shadow-[var(--shadow-glow)]"
                    title="New post"
                >
                    +
                </button>
            </div>

            {/* ── Posts List ── */}
            <div className="flex-1 overflow-y-auto py-2 px-2">
                {isLoading ? (
                    <div className="px-3 py-10 text-center">
                        <div className="inline-flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" style={{ animationDelay: '200ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" style={{ animationDelay: '400ms' }} />
                        </div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="px-3 py-10 text-center animate-fade-in">
                        <div className="text-3xl mb-3 opacity-40">📄</div>
                        <p className="text-sm text-[var(--text-tertiary)] mb-3">No posts yet</p>
                        <button
                            onClick={createPost}
                            className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]
                         cursor-pointer bg-transparent border-none font-medium transition-colors"
                        >
                            Create your first post →
                        </button>
                    </div>
                ) : (
                    posts.map((post) => (
                        <div
                            key={post.id}
                            onClick={() => setActivePost(post.id)}
                            className={`
                group flex items-start justify-between px-3 py-3 rounded-[var(--radius)]
                cursor-pointer transition-all duration-[var(--transition-fast)] mb-0.5
                ${activePostId === post.id
                                    ? 'bg-[var(--accent-subtle)] border-l-[3px] border-[var(--accent)]'
                                    : 'hover:bg-[var(--bg-hover)] border-l-[3px] border-transparent'
                                }
              `}
                        >
                            <div className="flex-1 min-w-0">
                                <p
                                    className={`text-[13px] font-medium truncate leading-tight ${activePostId === post.id
                                            ? 'text-[var(--accent)]'
                                            : 'text-[var(--text-primary)]'
                                        }`}
                                >
                                    {post.title || 'Untitled'}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span
                                        className={`text-[10px] px-1.5 py-[1px] rounded-full font-semibold uppercase tracking-wider ${post.status === 'published'
                                                ? 'bg-[var(--success-bg)] text-[var(--success)]'
                                                : 'bg-[var(--warning-bg)] text-[var(--warning)]'
                                            }`}
                                    >
                                        {post.status === 'published' ? 'Live' : 'Draft'}
                                    </span>
                                    <span className="text-[10px] text-[var(--text-tertiary)]">
                                        {formatDate(post.updated_at)}
                                    </span>
                                </div>
                            </div>

                            {/* Delete — hover reveal */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Delete this post?')) deletePost(post.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-[var(--radius-sm)]
                           text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)]
                           transition-all duration-[var(--transition-fast)] cursor-pointer
                           bg-transparent border-none text-[10px] ml-1.5"
                                title="Delete"
                            >
                                ✕
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
