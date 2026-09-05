import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useSessionGuard from '@/hooks/useSessionGuard';

describe('useSessionGuard hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('initializes with default safe state when unauthenticated (no sessionExpiresAt)', () => {
    const { result } = renderHook(() => useSessionGuard());

    expect(result.current.showWarning).toBe(false);
    expect(result.current.secondsLeft).toBe(300);
    expect(result.current.isExpired).toBe(false);
  });

  it('does not show warning when session expiry is far in the future (> 5 minutes)', () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    sessionStorage.setItem('sessionExpiresAt', futureDate);

    const { result } = renderHook(() => useSessionGuard());

    expect(result.current.showWarning).toBe(false);
    expect(result.current.isExpired).toBe(false);
  });

  it('triggers warning immediately on mount if within 5-minute warning window', () => {
    const fourMinutesFuture = new Date(Date.now() + 4 * 60 * 1000).toISOString();
    sessionStorage.setItem('sessionExpiresAt', fourMinutesFuture);

    const { result } = renderHook(() => useSessionGuard());

    expect(result.current.showWarning).toBe(true);
    expect(result.current.isExpired).toBe(false);

    // After 1 second interval tick, secondsLeft updates to remaining seconds
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.secondsLeft).toBeLessThanOrEqual(240);
    expect(result.current.secondsLeft).toBeGreaterThan(235);
  });

  it('counts down secondsLeft every second during the warning window', () => {
    const fourMinutesFuture = new Date(Date.now() + 240 * 1000).toISOString();
    sessionStorage.setItem('sessionExpiresAt', fourMinutesFuture);

    const { result } = renderHook(() => useSessionGuard());

    expect(result.current.showWarning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const initialSeconds = result.current.secondsLeft;

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.secondsLeft).toBe(initialSeconds - 3);
  });

  it('triggers immediate expiry on mount if sessionExpiresAt is already in the past', () => {
    const pastDate = new Date(Date.now() - 10000).toISOString();
    sessionStorage.setItem('sessionExpiresAt', pastDate);
    const onExpired = vi.fn();

    const { result } = renderHook(() => useSessionGuard(onExpired));

    expect(result.current.isExpired).toBe(true);
    expect(result.current.showWarning).toBe(false);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('triggers expiry when countdown reaches zero', () => {
    const tenSecondsFuture = new Date(Date.now() + 10 * 1000).toISOString();
    sessionStorage.setItem('sessionExpiresAt', tenSecondsFuture);
    const onExpired = vi.fn();

    const { result } = renderHook(() => useSessionGuard(onExpired));

    expect(result.current.showWarning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(11000);
    });

    expect(result.current.isExpired).toBe(true);
    expect(result.current.showWarning).toBe(false);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('clears session and removes user/storage keys on expiry', () => {
    const pastDate = new Date(Date.now() - 1000).toISOString();
    sessionStorage.setItem('sessionExpiresAt', pastDate);
    sessionStorage.setItem('token', 'active_jwt');
    localStorage.setItem('user', '{"id":1}');
    localStorage.setItem('token', 'active_jwt');
    localStorage.setItem('smaart_student_cache', 'cache_data');
    localStorage.setItem('course-notes-react', 'notes_data');
    localStorage.setItem('passport_demo_key', 'demo_data');
    localStorage.setItem('note_color_c1', 'blue');

    renderHook(() => useSessionGuard());

    expect(sessionStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('smaart_student_cache')).toBeNull();
    expect(localStorage.getItem('course-notes-react')).toBeNull();
    expect(localStorage.getItem('passport_demo_key')).toBeNull();
    expect(localStorage.getItem('note_color_c1')).toBeNull();
    expect(localStorage.getItem('logout-event')).toBeTruthy();
  });

  it('dismissWarning hides warning modal and stops the countdown timer', () => {
    const twoMinutesFuture = new Date(Date.now() + 120 * 1000).toISOString();
    sessionStorage.setItem('sessionExpiresAt', twoMinutesFuture);

    const { result } = renderHook(() => useSessionGuard());

    expect(result.current.showWarning).toBe(true);

    act(() => {
      result.current.dismissWarning();
    });

    expect(result.current.showWarning).toBe(false);

    // Advancing time should not decrease secondsLeft anymore while dismissed
    const secondsAfterDismiss = result.current.secondsLeft;
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.secondsLeft).toBe(secondsAfterDismiss);
  });

  it('periodic check interval (30s) triggers warning when session transitions into warning window', () => {
    // 5 minutes + 15 seconds from now
    const initialFuture = new Date(Date.now() + 315 * 1000).toISOString();
    sessionStorage.setItem('sessionExpiresAt', initialFuture);

    const { result } = renderHook(() => useSessionGuard());

    expect(result.current.showWarning).toBe(false);

    // Advance by 30 seconds -> now remaining is 285s (<= 300s threshold)
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(result.current.showWarning).toBe(true);
  });

  it('cleans up interval timers on unmount without throwing or triggering expiry', () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    sessionStorage.setItem('sessionExpiresAt', futureDate);
    const onExpired = vi.fn();

    const { unmount } = renderHook(() => useSessionGuard(onExpired));

    unmount();

    act(() => {
      vi.advanceTimersByTime(120000);
    });

    expect(onExpired).not.toHaveBeenCalled();
  });
});
