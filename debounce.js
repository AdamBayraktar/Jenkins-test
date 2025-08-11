// debounce.js (CommonJS)
'use strict';

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * ms have elapsed since the last call. Options:
 *  - leading (boolean): invoke on the leading edge
 *  - trailing (boolean): invoke on the trailing edge (default true)
 *  - maxWait (number): maximum wait before forced invoke
 *
 * The debounced function has .cancel() and .flush() helpers.
 */
function debounce(func, wait = 0, options = {}) {
  if (typeof func !== 'function') {
    throw new TypeError('Expected a function');
  }
  wait = Math.max(0, Number(wait) || 0);

  const leading = !!options.leading;
  const trailing = options.trailing !== false; // default true
  const maxWait = options.maxWait != null ? Math.max(0, Number(options.maxWait) || 0) : null;

  let timerId;
  let lastArgs;
  let lastThis;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  let result;

  function invokeFunc(time) {
    lastInvokeTime = time;
    const r = func.apply(lastThis, lastArgs);
    result = r;
    lastArgs = lastThis = undefined;
    return r;
  }

  function leadingEdge(time) {
    lastInvokeTime = time;
    if (leading) {
      // invoke immediately
      result = invokeFunc(time);
    }
    // start timer for trailing edge
    startTimer(time);
    return result;
  }

  function startTimer(now) {
    // Determine remaining time to next trailing invoke.
    const waitTime = wait;
    // If using maxWait, timer drives by the smaller of remaining wait vs remaining maxWait.
    let remaining = waitTime;
    if (maxWait != null) {
      const timeSinceLastInvoke = now - lastInvokeTime;
      const remainingMax = Math.max(0, maxWait - timeSinceLastInvoke);
      remaining = Math.min(remaining, remainingMax);
    }
    clearTimer();
    timerId = setTimeout(timerExpired, remaining);
  }

  function timerExpired() {
    const now = Date.now();
    if (shouldInvoke(now)) {
      // trailing edge
      return trailingEdge(now);
    }
    // restart timer with remaining wait
    startTimer(now);
  }

  function trailingEdge(time) {
    clearTimer();
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    // First call, or enough time has passed since last call (>= wait)
    const passWait = timeSinceLastCall >= wait;

    // Handle clock skew or first call after long pause
    const firstCall = lastCallTime === 0;

    // If maxWait is set, force invoke when exceeded
    const passMaxWait = maxWait != null && timeSinceLastInvoke >= maxWait;

    return firstCall || passWait || passMaxWait;
  }

  function clearTimer() {
    if (timerId != null) {
      clearTimeout(timerId);
      timerId = undefined;
    }
  }

  function debounced(...args) {
    const now = Date.now();
    lastArgs = args;
    lastThis = this;
    lastCallTime = now;

    const shouldCallNow = shouldInvoke(now);

    if (shouldCallNow) {
      if (timerId === undefined) {
        // no timer running — leading edge
        return leadingEdge(now);
      }
      if (maxWait != null) {
        // handle maxWait on a running timer
        startTimer(now);
        return trailing ? invokeFunc(now) : (result = undefined);
      }
    }

    if (timerId === undefined) {
      startTimer(now);
    }

    return result;
  }

  debounced.cancel = function cancel() {
    clearTimer();
    lastInvokeTime = 0;
    lastArgs = lastThis = undefined;
    lastCallTime = 0;
  };

  debounced.flush = function flush() {
    const now = Date.now();
    if (timerId === undefined) return result;
    return trailingEdge(now);
  };

  debounced.isPending = function isPending() {
    return timerId != null;
  };

  return debounced;
}

module.exports = debounce;
