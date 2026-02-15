/**
 * useAutoSave — Orchestrates debounced auto-save of editor content.
 *
 * Listens to editorState changes from the Zustand store and triggers
 * a debounced save (PATCH /api/posts/{id}) after 1.5 seconds of inactivity.
 */
import { useEffect, useCallback } from 'react';
import useDebounce from './useDebounce';
import useEditorStore from '../stores/editorStore';

export default function useAutoSave() {
    const { activePostId, editorState, savePost, isSaving, lastSavedAt } =
        useEditorStore();

    const performSave = useCallback(async () => {
        if (activePostId && editorState) {
            await savePost();
        }
    }, [activePostId, editorState, savePost]);

    const debouncedSave = useDebounce(performSave, 1500);

    // Trigger debounced save whenever editorState changes
    useEffect(() => {
        if (activePostId && editorState) {
            debouncedSave();
        }
    }, [editorState, activePostId, debouncedSave]);

    return { isSaving, lastSavedAt };
}
