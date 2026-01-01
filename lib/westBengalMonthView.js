/* -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*- */

// Pure logic module: no GNOME Shell imports.

function _parseDateNoon(dateStr) {
    const [y, m, d] = String(dateStr).split('-').map(Number);
    // Use local noon to avoid DST edge cases when computing day-of-week and day deltas.
    return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function _daysBetweenNoon(a, b) {
    // Both should be noon-local; this keeps day deltas stable even across DST transitions.
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    return Math.floor((b - a) / MS_PER_DAY);
}

/**
 * Compute a best-effort Bengali month view for West Bengal/India using the
 * mapping JSON (Sankranti dates).
 *
 * The mapping is keyed by Gregorian year string (e.g. "2025"), and each value
 * is a map of Bengali month index ("0".."11") to a Gregorian date string
 * ("YYYY-MM-DD") representing the Sankranti day. Day 1 of the Bengali month is
 * the following Gregorian day.
 *
 * @param {object} params
 * @param {object} params.monthStarts - month start mapping JSON
 * @param {number} params.month - Bengali month index (0..11)
 * @param {Date} params.anchorDate - Gregorian date near the month being viewed
 * @returns {{daysInMonth:number, firstDayOfWeek:number, prevMonthDays:number, yearKeyUsed:string}|null}
 */
export function computeWestBengalMonthView({ monthStarts, month, anchorDate }) {
    if (!monthStarts || typeof monthStarts !== 'object')
        return null;

    const monthKey = String(month);
    const nextMonthKey = String((month + 1) % 12);
    const prevMonthKey = String((month + 11) % 12);

    const safeAnchor = (anchorDate instanceof Date && !isNaN(anchorDate.getTime()))
        ? new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate(), 12, 0, 0, 0)
        : new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 12, 0, 0, 0);

    const anchorYear = safeAnchor.getFullYear();
    const candidateYears = [anchorYear, anchorYear - 1, anchorYear + 1].map(String);

    // Pick the mapping year whose month start is the latest one <= anchor date.
    // This matters for months like Poush: Jan dates belong to the previous year's mapping.
    let yearKeyUsed = null;
    let bestStart = null;
    for (const y of candidateYears) {
        const startStr = monthStarts?.[y]?.[monthKey];
        if (!startStr)
            continue;
        const start = _parseDateNoon(startStr);
        if (start <= safeAnchor && (!bestStart || start > bestStart)) {
            bestStart = start;
            yearKeyUsed = y;
        }
    }

    // Fallback: pick the first available candidate if none are <= anchor.
    if (!yearKeyUsed) {
        for (const y of candidateYears) {
            if (monthStarts?.[y]?.[monthKey]) {
                yearKeyUsed = y;
                break;
            }
        }
    }

    const yearData = yearKeyUsed ? monthStarts?.[yearKeyUsed] : null;
    if (!yearData)
        return null;

    const monthStartStr = yearData[monthKey];
    let nextMonthStartStr = yearData[nextMonthKey];

    if (month === 11) {
        const nextYearKey = String(Number(yearKeyUsed) + 1);
        if (monthStarts?.[nextYearKey]?.['0'])
            nextMonthStartStr = monthStarts[nextYearKey]['0'];
    }

    if (!monthStartStr || !nextMonthStartStr)
        return null;

    const monthStart = _parseDateNoon(monthStartStr);
    const nextMonthStart = _parseDateNoon(nextMonthStartStr);

    const daysInMonthRaw = _daysBetweenNoon(monthStart, nextMonthStart);
    const daysInMonth = Math.max(1, Math.min(daysInMonthRaw || 30, 32));

    const day1Date = new Date(monthStart);
    day1Date.setDate(day1Date.getDate() + 1);
    const firstDayOfWeek = day1Date.getDay(); // 0=Sun..6=Sat

    let prevMonthDays = 30;
    let prevMonthStartStr = yearData[prevMonthKey];
    if (month === 0) {
        const prevYearKey = String(Number(yearKeyUsed) - 1);
        if (monthStarts?.[prevYearKey]?.['11'])
            prevMonthStartStr = monthStarts[prevYearKey]['11'];
    }
    if (prevMonthStartStr) {
        const prevMonthStart = _parseDateNoon(prevMonthStartStr);
        const prevDaysRaw = _daysBetweenNoon(prevMonthStart, monthStart);
        prevMonthDays = Math.max(1, Math.min(prevDaysRaw || 30, 32));
    }

    return { daysInMonth, firstDayOfWeek, prevMonthDays, yearKeyUsed };
}
