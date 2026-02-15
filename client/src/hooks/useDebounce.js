/**
 * useDebounce — Custom debounce hook written from scratch (NO lodash).
 *
 * DSA Focus: Implements the debounce algorithm using useRef for timer management
 * and useCallback for stable function reference. Properly cleans up on unmount.
 *
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Delay in milliseconds (default: 1500ms)
 * @returns {Function} The debounced function
 */
import { useRef, useCallback, useEffect } from 'react';

export default function useDebounce(callback, delay = 1500) {
    const timerRef = useRef(null);
    const callbackRef = useRef(callback);

    // Always keep the latest callback reference (avoids stale closures)
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const debouncedFn = useCallback(
        (...args) => {
            // Clear any existing timer — resets the debounce window
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            // Set a new timer — callback fires only after `delay` ms of inactivity
            timerRef.current = setTimeout(() => {
                callbackRef.current(...args);
            }, delay);
        },
        [delay]
    );

    // Cleanup on unmount — prevent memory leaks
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    return debouncedFn;
}
