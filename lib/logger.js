// Minimal logging helpers for GNOME Shell 45+.
// Review guideline: avoid noisy logs; only emit debug logs when explicitly enabled.

const PREFIX = '[Bongabdo]';

function _debugEnabled() {
    // Enable by setting in Looking Glass (Alt+F2 -> lg):
    // `globalThis.BONGABDO_DEBUG = true`
    return !!globalThis.BONGABDO_DEBUG;
}

export function debug(...args) {
    if (_debugEnabled())
        console.debug(PREFIX, ...args);
}

export function warn(...args) {
    if (_debugEnabled())
        console.warn(PREFIX, ...args);
}

export function error(err, ...args) {
    // Errors are always useful in journals; keep them even when debug is off.
    if (err instanceof Error)
        console.error(PREFIX, ...args, err.message, err.stack ?? '');
    else
        console.error(PREFIX, ...args, err);
}


