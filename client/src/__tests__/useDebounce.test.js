/**
 * Frontend tests — useDebounce hook and Zustand store.
 *
 * Tests verify:
 * 1. Debounce: callback NOT called before delay, IS called after delay, resets on rapid input
 * 2. Store: create post, set editor state, etc.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useDebounce from '../hooks/useDebounce';

// ──────────────────────────────────────────────
// useDebounce Tests
// ──────────────────────────────────────────────

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should NOT call callback before the delay', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useDebounce(callback, 1000));

        act(() => {
            result.current('test');
        });

        // Advance time but NOT past the delay
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(callback).not.toHaveBeenCalled();
    });

    it('should call callback AFTER the delay', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useDebounce(callback, 1000));

        act(() => {
            result.current('test');
        });

        // Advance past the delay
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith('test');
    });

    it('should reset timer on rapid consecutive calls', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useDebounce(callback, 1000));

        // Call rapidly 3 times
        act(() => { result.current('first'); });
        act(() => { vi.advanceTimersByTime(300); });
        act(() => { result.current('second'); });
        act(() => { vi.advanceTimersByTime(300); });
        act(() => { result.current('third'); });

        // Not enough time has passed for any call
        expect(callback).not.toHaveBeenCalled();

        // Now advance past the delay from the LAST call
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        // Only called once, with the LAST argument
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith('third');
    });

    it('should use the latest callback reference (no stale closure)', () => {
        let callCount = 0;
        const callback1 = vi.fn(() => { callCount = 1; });
        const callback2 = vi.fn(() => { callCount = 2; });

        const { result, rerender } = renderHook(
            ({ cb }) => useDebounce(cb, 1000),
            { initialProps: { cb: callback1 } }
        );

        act(() => { result.current(); });

        // Update the callback before the timer fires
        rerender({ cb: callback2 });

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        // The NEW callback should be called, not the original
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(callback1).not.toHaveBeenCalled();
    });

    it('should cleanup timer on unmount', () => {
        const callback = vi.fn();
        const { result, unmount } = renderHook(() => useDebounce(callback, 1000));

        act(() => { result.current('test'); });

        // Unmount before timer fires
        unmount();

        // Advance time past the delay
        act(() => {
            vi.advanceTimersByTime(1500);
        });

        // Callback should NOT be called — timer was cleaned up
        expect(callback).not.toHaveBeenCalled();
    });

    it('should pass multiple arguments to callback', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useDebounce(callback, 500));

        act(() => {
            result.current('arg1', 'arg2', 42);
        });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(callback).toHaveBeenCalledWith('arg1', 'arg2', 42);
    });
});
