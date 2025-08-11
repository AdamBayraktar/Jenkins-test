// debounce.test.js
'use strict';

const debounce = require('./debounce');

jest.useFakeTimers();

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers(); // ensure fake timers each test
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z')); // deterministic
  });

  test('calls function once after wait on trailing edge by default', () => {
    const fn = jest.fn();
    const d = debounce(fn, 100);

    d('a');
    d('b');
    d('c');

    // Not yet
    expect(fn).not.toHaveBeenCalled();

    // Advance just before wait
    jest.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();

    // Hit wait threshold
    jest.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith('c'); // last args win
  });

  test('leading: true triggers immediately, no trailing when trailing=false', () => {
    const fn = jest.fn();
    const d = debounce(fn, 100, { leading: true, trailing: false });

    d(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(1);

    // Burst of calls within wait should not trigger more
    d(2);
    d(3);
    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('leading + trailing triggers both edges', () => {
    const fn = jest.fn();
    const d = debounce(fn, 100, { leading: true, trailing: true });

    d('x'); // leading
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith('x');

    // More calls during the wait
    d('y');
    d('z');

    // trailing fires with last args
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('z');
  });

  test('maxWait forces an invoke during a long burst', () => {
    const fn = jest.fn();
    const d = debounce(fn, 100, { maxWait: 250 });

    // Call every 80ms for 5 times: without maxWait, trailing call only at end.
    for (let i = 0; i < 5; i++) {
      d(i);
      jest.advanceTimersByTime(80);
    }
    // With maxWait=250, we should see an invocation at ~250ms
    expect(fn).toHaveBeenCalled(); // at least once due to maxWait
    // Finish any trailing
    jest.advanceTimersByTime(200);
    // Should end with a trailing call too
    expect(fn.mock.calls.at(-1)[0]).toBe(4);
  });

  test('cancel prevents pending trailing call', () => {
    const fn = jest.fn();
    const d = debounce(fn, 100);

    d('work');
    d.cancel();

    jest.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });

  test('flush invokes trailing immediately if pending', () => {
    const fn = jest.fn().mockReturnValue('ok');
    const d = debounce(fn, 100);

    d('a');
    const res = d.flush();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith('a');
    expect(res).toBe('ok');
  });

  test('preserves this and passes latest arguments', () => {
    const target = {
      seen: [],
      push(arg) {
        this.seen.push(arg);
        return this.seen.length;
      },
    };
    const spy = jest.spyOn(target, 'push');
    const d = debounce(target.push, 50);

    d.call(target, 'one');
    d.call(target, 'two');

    jest.advanceTimersByTime(50);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(target.seen).toEqual(['two']);
  });

  test('returns leading call result when leading=true', () => {
    const fn = jest.fn(x => x * 2);
    const d = debounce(fn, 100, { leading: true, trailing: false });

    const out = d(7);
    expect(out).toBe(14);
    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('isPending reports whether a call is scheduled', () => {
    const fn = jest.fn();
    const d = debounce(fn, 100);

    expect(d.isPending()).toBe(false);
    d();
    expect(d.isPending()).toBe(true);
    jest.advanceTimersByTime(100);
    expect(d.isPending()).toBe(false);
  });

  test('throws when func is not a function', () => {
    expect(() => debounce(123)).toThrow(/Expected a function/);
  });
});
