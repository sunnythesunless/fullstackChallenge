/**
 * PublishedPage — Read-only view of a published post (for sharing / SEO).
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';

export default function PublishedPage() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const { data } = await api.get(`/posts/${id}`);
                setPost(data);
            } catch (err) {
                console.error('Failed to load post:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
                <div className="animate-pulse text-[var(--text-muted)]">Loading...</div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Post Not Found</h1>
                    <Link to="/" className="text-[var(--accent)] hover:underline">
                        ← Back to editor
                    </Link>
                </div>
            </div>
        );
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Nav */}
            <nav className="border-b border-[var(--border)] px-6 py-3">
                <Link
                    to="/"
                    className="text-sm text-[var(--accent)] hover:underline no-underline"
                >
                    ← Back to editor
                </Link>
            </nav>

            {/* Article */}
            <article className="max-w-2xl mx-auto px-6 py-12 animate-fade-in">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-[var(--text-primary)] leading-tight mb-4">
                        {post.title}
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                        <time>{formatDate(post.created_at)}</time>
                        <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${post.status === 'published'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                        >
                            {post.status}
                        </span>
                    </div>
                </header>

                {/* Render HTML content if available, otherwise show raw text */}
                {post.content_html ? (
                    <div
                        className="prose prose-lg max-w-none text-[var(--text-primary)]"
                        dangerouslySetInnerHTML={{ __html: post.content_html }}
                    />
                ) : post.content_json ? (
                    <div className="text-[var(--text-primary)] leading-relaxed">
                        {/* Simple JSON text extraction for display */}
                        {extractTextFromJSON(post.content_json)}
                    </div>
                ) : (
                    <p className="text-[var(--text-muted)] italic">No content yet.</p>
                )}
            </article>
        </div>
    );
}

/** Extract plain text from Lexical JSON for read-only display. */
function extractTextFromJSON(json) {
    if (!json?.root?.children) return '';

    const renderNode = (node, index) => {
        if (node.type === 'text') {
            let text = node.text || '';
            if (node.format & 1) text = <strong key={index}>{text}</strong>;
            if (node.format & 2) text = <em key={index}>{text}</em>;
            return text;
        }
        if (node.children) {
            const children = node.children.map((child, i) => renderNode(child, i));
            switch (node.type) {
                case 'heading':
                    const Tag = node.tag || 'h2';
                    return <Tag key={index} className="font-bold mb-3">{children}</Tag>;
                case 'paragraph':
                    return <p key={index} className="mb-3">{children}</p>;
                case 'quote':
                    return (
                        <blockquote key={index} className="border-l-3 border-[var(--accent)] pl-4 italic text-[var(--text-secondary)] my-4">
                            {children}
                        </blockquote>
                    );
                case 'list':
                    return node.listType === 'number' ? (
                        <ol key={index} className="list-decimal pl-6 mb-3">{children}</ol>
                    ) : (
                        <ul key={index} className="list-disc pl-6 mb-3">{children}</ul>
                    );
                case 'listitem':
                    return <li key={index} className="mb-1">{children}</li>;
                default:
                    return <div key={index}>{children}</div>;
            }
        }
        return null;
    };

    return json.root.children.map((node, i) => renderNode(node, i));
}
