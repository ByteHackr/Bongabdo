/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

// Pure logic module: no GNOME Shell imports.

/**
 * Build a 6x7 calendar matrix like GNOME Shell's calendar view.
 *
 * Cells are in row-major order starting Sunday.
 *
 * @param {object} params
 * @param {number} params.daysInMonth - Days in current month (1..32)
 * @param {number} params.firstDayOfWeek - Day of week for day 1 (0=Sun..6=Sat)
 * @param {number} [params.prevMonthDays] - Days in previous month (used for leading cells)
 * @returns {Array<{day:number,inMonth:boolean}>} 42 cells
 */
export function buildMonthMatrix({ daysInMonth, firstDayOfWeek, prevMonthDays }) {
  const dim = Number(daysInMonth);
  const fdow = Number(firstDayOfWeek);

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

  return cells.slice(0, 42);
}


