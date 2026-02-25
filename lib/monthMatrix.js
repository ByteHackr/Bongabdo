/* -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*- */

// Pure logic module: no GNOME Shell imports.

/**
 * Get the locale's first day of week: 0 = Sunday, 1 = Monday.
 * Falls back to 0 (Sunday) if Intl.Locale.getWeekInfo is unavailable.
 *
 * @returns {number} 0 for Sunday-first, 1 for Monday-first
 */
export function getLocaleWeekStart() {
    try {
        const locale = (typeof Intl !== 'undefined' && Intl.DateTimeFormat)
            ? (new Intl.DateTimeFormat().resolvedOptions().locale || 'en-US')
            : 'en-US';
        const loc = new Intl.Locale(locale);
        const weekInfo = (typeof loc.getWeekInfo === 'function') ? loc.getWeekInfo() : null;
        if (weekInfo && typeof weekInfo.firstDay === 'number' && weekInfo.firstDay === 1) {
            return 1;
        }
    } catch (_e) {
        /* ignore */
    }
    return 0;
}

/**
 * Build a 6x7 calendar matrix like GNOME Shell's calendar view.
 *
 * Cells are in row-major order. Column order follows locale week start
 * (Sunday-first or Monday-first via weekStart parameter).
 *
 * @param {object} params
 * @param {number} params.daysInMonth - Days in current month (1..32)
 * @param {number} params.firstDayOfWeek - Day of week for day 1 (0=Sun..6=Sat, JS getDay())
 * @param {number} [params.prevMonthDays] - Days in previous month (used for leading cells)
 * @param {number} [params.weekStart] - 0=Sunday-first, 1=Monday-first (default: 0)
 * @returns {Array<{day:number,inMonth:boolean}>} 42 cells
 */
export function buildMonthMatrix({ daysInMonth, firstDayOfWeek, prevMonthDays, weekStart = 0 }) {
    const dim = Number(daysInMonth);
    let fdow = Number(firstDayOfWeek);
    const useMondayFirst = Number(weekStart) === 1;

    if (useMondayFirst) {
        fdow = (fdow + 6) % 7;
    }

    const safeDaysInMonth = Number.isFinite(dim) ? Math.max(1, Math.min(dim, 32)) : 30;
    const safeFirstDow = Number.isFinite(fdow) ? Math.max(0, Math.min(fdow, 6)) : 0;
    const safePrevDays = Number.isFinite(prevMonthDays)
        ? Math.max(1, Math.min(Number(prevMonthDays), 32))
        : null;

    const cells = [];

    const leading = safeFirstDow;
    if (leading > 0) {
        if (safePrevDays) {
            const start = safePrevDays - leading + 1;
            for (let d = start; d <= safePrevDays; d++)
                cells.push({ day: d, inMonth: false });
        } else {
            for (let i = 0; i < leading; i++)
                cells.push({ day: 0, inMonth: false });
        }
    }

    for (let d = 1; d <= safeDaysInMonth; d++)
        cells.push({ day: d, inMonth: true });

    let nextDay = 1;
    while (cells.length < 42) {
        cells.push({ day: nextDay, inMonth: false });
        nextDay++;
    }

    let result = cells.slice(0, 42);
    if (useMondayFirst) {
        result = _rotateCellsMondayFirst(result);
    }
    return result;
}

function _rotateCellsMondayFirst(cells) {
    const out = [];
    for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 7; c++) {
            const srcCol = (c + 1) % 7;
            out.push(cells[r * 7 + srcCol]);
        }
    }
    return out;
}
