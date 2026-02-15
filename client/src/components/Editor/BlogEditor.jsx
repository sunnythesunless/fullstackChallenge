/**
 * BlogEditor — Lexical editor wrapper with rich-text formatting.
 * Uses LexicalComposer with HeadingNode, ListNode, ListItemNode, QuoteNode.
 * OnChangePlugin captures editor state as JSON → pushes to Zustand store.
 */
import { useEffect, useCallback } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $getRoot, $createParagraphNode } from 'lexical';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import Toolbar from './Toolbar';
import useEditorStore from '../../stores/editorStore';

// Plugin to load initial editor state from Zustand
function LoadStatePlugin() {
    const [editor] = useLexicalComposerContext();
    const editorState = useEditorStore((s) => s.editorState);
    const activePostId = useEditorStore((s) => s.activePostId);

    useEffect(() => {
        if (activePostId) {
            if (editorState) {
                try {
                    const state = editor.parseEditorState(JSON.stringify(editorState));
                    editor.setEditorState(state);
                } catch (e) {
                    console.warn('Failed to load editor state:', e);
                }
            } else {
                // Reset to empty state for new/empty posts
                editor.update(() => {
                    const root = $getRoot();
                    root.clear();
                    root.append($createParagraphNode());
                });
            }
        }
    }, [activePostId]); // only reload when switching posts

    return null;
}

// Theme for Lexical node styling
const editorTheme = {
    paragraph: 'editor-paragraph',
    heading: {
        h1: 'editor-heading-h1',
        h2: 'editor-heading-h2',
        h3: 'editor-heading-h3',
    },
    list: {
        ol: 'editor-list-ol',
        ul: 'editor-list-ul',
        listitem: 'editor-listItem',
    },
    quote: 'editor-quote',
    text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
    },
};

export default function BlogEditor() {
    const setEditorState = useEditorStore((s) => s.setEditorState);

    const onChange = useCallback(
        (state) => {
            const json = state.toJSON();
            setEditorState(json);
        },
        [setEditorState]
    );

    const initialConfig = {
        namespace: 'SmartBlogEditor',
        theme: editorTheme,
        onError: (error) => console.error('Lexical error:', error),
        nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className="editor-container">
                <Toolbar />
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable className="editor-input" />
                    }
                    placeholder={
                        <div className="editor-placeholder">Start writing your story...</div>
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <ListPlugin />
                <OnChangePlugin onChange={onChange} ignoreSelectionChange />
                <LoadStatePlugin />
            </div>
        </LexicalComposer>
    );
}
