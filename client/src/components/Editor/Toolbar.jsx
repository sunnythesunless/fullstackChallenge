/**
 * Toolbar — Sharp, premium formatting toolbar.
 */
import { useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND } from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { $setBlocksType } from '@lexical/selection';
import { $getSelection, $isRangeSelection, $createParagraphNode } from 'lexical';

export default function Toolbar() {
    const [editor] = useLexicalComposerContext();

    const formatText = useCallback(
        (format) => editor.dispatchCommand(FORMAT_TEXT_COMMAND, format),
        [editor]
    );

    const formatHeading = useCallback(
        (tag) => {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createHeadingNode(tag));
                }
            });
        },
        [editor]
    );

    const formatParagraph = useCallback(() => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createParagraphNode());
            }
        });
    }, [editor]);

    const formatQuote = useCallback(() => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createQuoteNode());
            }
        });
    }, [editor]);

    const btnBase =
        'px-2 py-1.5 rounded-[var(--radius-sm)] text-[13px] font-medium cursor-pointer ' +
        'bg-transparent border-none text-[var(--text-secondary)] ' +
        'hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] ' +
        'transition-all duration-[var(--transition-fast)] ' +
        'active:scale-95';

    const divider = 'w-px h-5 bg-[var(--border)] mx-1 flex-shrink-0';

    return (
        <div
            className="flex items-center gap-0.5 px-3 py-2 border-b border-[var(--border)]
                  bg-[var(--bg-surface)] rounded-t-[var(--radius-lg)] sticky top-0 z-10"
        >
            {/* Text formatting */}
            <button className={btnBase} onClick={() => formatText('bold')} title="Bold (Ctrl+B)">
                <span className="font-bold">B</span>
            </button>
            <button className={btnBase} onClick={() => formatText('italic')} title="Italic (Ctrl+I)">
                <span className="italic">I</span>
            </button>
            <button className={btnBase} onClick={() => formatText('underline')} title="Underline (Ctrl+U)">
                <span className="underline">U</span>
            </button>
            <button className={btnBase} onClick={() => formatText('strikethrough')} title="Strikethrough">
                <span className="line-through">S</span>
            </button>

            <div className={divider} />

            {/* Block types */}
            <button className={btnBase} onClick={formatParagraph} title="Body text">
                ¶
            </button>
            <button className={`${btnBase} font-bold`} onClick={() => formatHeading('h1')} title="Heading 1">
                H1
            </button>
            <button className={`${btnBase} font-semibold`} onClick={() => formatHeading('h2')} title="Heading 2">
                H2
            </button>
            <button className={btnBase} onClick={() => formatHeading('h3')} title="Heading 3">
                H3
            </button>

            <div className={divider} />

            {/* Lists & Quote */}
            <button
                className={btnBase}
                onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
                title="Bullet list"
            >
                • List
            </button>
            <button
                className={btnBase}
                onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
                title="Numbered list"
            >
                1. List
            </button>
            <button className={btnBase} onClick={formatQuote} title="Block quote">
                ❝
            </button>
        </div>
    );
}
