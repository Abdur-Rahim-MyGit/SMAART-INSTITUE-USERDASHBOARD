import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useTabSwitchProctor from '@/hooks/useTabSwitchProctor';

describe('useTabSwitchProctor hook', () => {
  let stableCallback;

  beforeEach(() => {
    vi.useFakeTimers();
    stableCallback = vi.fn();
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.hidden = false;
  });

  it('initializes with zero violations and warning hidden when inactive', () => {
    const { result } = renderHook(() => useTabSwitchProctor(false, stableCallback));

    expect(result.current.violations).toBe(0);
    expect(result.current.warningLevel).toBe(0);
    expect(result.current.isWarningVisible).toBe(false);
    expect(result.current.isAutoSubmitted).toBe(false);
    expect(result.current.maxWarnings).toBe(3);
  });

  it('does not record violations when inactive even if visibility changes', () => {
    const { result } = renderHook(() => useTabSwitchProctor(false, stableCallback));

    act(() => {
      document.hidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.violations).toBe(0);
    expect(result.current.isWarningVisible).toBe(false);
    expect(stableCallback).not.toHaveBeenCalled();
  });

  it('records strike 1 on first visibility change when active', () => {
    const { result } = renderHook(() => useTabSwitchProctor(true, stableCallback));

    act(() => {
      document.hidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.violations).toBe(1);
    expect(result.current.warningLevel).toBe(1);
    expect(result.current.isWarningVisible).toBe(true);
    expect(result.current.isAutoSubmitted).toBe(false);
    expect(stableCallback).not.toHaveBeenCalled();
  });

  it('allows dismissing the warning via clearWarning()', () => {
    const { result } = renderHook(() => useTabSwitchProctor(true, stableCallback));

    act(() => {
      document.hidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.isWarningVisible).toBe(true);

    act(() => {
      result.current.clearWarning();
    });

    expect(result.current.isWarningVisible).toBe(false);
    expect(result.current.violations).toBe(1);
  });

  it('records strike 2 on second violation', () => {
    const { result } = renderHook(() => useTabSwitchProctor(true, stableCallback));

    // Strike 1
    act(() => {
      document.hidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Dismiss overlay
    act(() => {
      result.current.clearWarning();
    });

    // Strike 2
    act(() => {
      document.hidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.violations).toBe(2);
    expect(result.current.warningLevel).toBe(2);
    expect(result.current.isWarningVisible).toBe(true);
    expect(result.current.isAutoSubmitted).toBe(false);
  });

  it('triggers auto-submit on strike 3 after 2-second grace period', () => {
    const { result } = renderHook(() => useTabSwitchProctor(true, stableCallback));

    // Strike 1
    act(() => {
      document.hidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    // Strike 2
    act(() => {
      document.hidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    // Strike 3
    act(() => {
      document.hidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.violations).toBe(3);
    expect(result.current.warningLevel).toBe(3);
    expect(result.current.isAutoSubmitted).toBe(true);
    expect(result.current.isWarningVisible).toBe(true);

    // clearWarning has no effect once auto-submitted
    act(() => {
      result.current.clearWarning();
    });
    expect(result.current.isWarningVisible).toBe(true);

    // Callback should not be called immediately
    expect(stableCallback).not.toHaveBeenCalled();

    // Advance by 2000ms
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(stableCallback).toHaveBeenCalledTimes(1);
  });

  it('handles window blur event with 100ms debounce when document is not hidden', () => {
    const { result } = renderHook(() => useTabSwitchProctor(true, stableCallback));

    act(() => {
      document.hidden = false;
      window.dispatchEvent(new Event('blur'));
    });

    // Not triggered immediately before 100ms
    expect(result.current.violations).toBe(0);

    // Advance 100ms
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.violations).toBe(1);
    expect(result.current.isWarningVisible).toBe(true);
  });

  it('ignores blur event if document becomes hidden before 100ms timer fires', () => {
    const { result } = renderHook(() => useTabSwitchProctor(true, stableCallback));

    act(() => {
      document.hidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.violations).toBe(1);

    act(() => {
      window.dispatchEvent(new Event('blur'));
      vi.advanceTimersByTime(100);
    });

    // Still 1 violation because document.hidden was true during blur timer check
    expect(result.current.violations).toBe(1);
  });

  it('resets violation counts when transitioning from active to inactive and back to active', () => {
    const { result, rerender } = renderHook(
      ({ active }) => useTabSwitchProctor(active, stableCallback),
      { initialProps: { active: true } }
    );

    act(() => {
      document.hidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current.violations).toBe(1);

    // Deactivate
    rerender({ active: false });
    expect(result.current.violations).toBe(1);

    // Reactivate -> resets
    rerender({ active: true });
    expect(result.current.violations).toBe(0);
    expect(result.current.isWarningVisible).toBe(false);
  });

  it('removes event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const windowRemoveSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useTabSwitchProctor(true, stableCallback));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(windowRemoveSpy).toHaveBeenCalledWith('blur', expect.any(Function));
  });
});
