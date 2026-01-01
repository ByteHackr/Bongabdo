import GLib from 'gi://GLib';
import * as Assert from '../_assert.js';
import { computeWestBengalMonthView } from '../../lib/westBengalMonthView.js';

function readJson(path) {
    const [ok, bytes] = GLib.file_get_contents(path);
    Assert.assertTruthy(ok, `failed to read: ${path}`);
    return JSON.parse(new TextDecoder('utf-8').decode(bytes));
}

const monthStarts = readJson('lib/bengaliMonthStarts.json');

// Jan 1, 2026 (West Bengal): Bengali date is Poush 16, 1432 (Thursday).
// Poush day 1 is Dec 17, 2025, which is Wednesday => firstDayOfWeek = 3.
// This must use mapping year "2025" (since Poush start is in Dec 2025).
const viewJan1 = computeWestBengalMonthView({
    monthStarts,
    month: 8, // Poush
    anchorDate: new Date(2026, 0, 1, 12, 0, 0),
});

Assert.assertTruthy(!!viewJan1, 'expected view for Jan 1, 2026');
Assert.assertEquals(viewJan1.yearKeyUsed, '2025', 'Jan 1, 2026 Poush must use 2025 mapping');
Assert.assertEquals(viewJan1.firstDayOfWeek, 3, 'Poush day 1 (Dec 17, 2025) should be Wednesday');
Assert.assertEquals(viewJan1.daysInMonth, 30, 'Poush length expected 30 days in mapping');
Assert.assertEquals(viewJan1.prevMonthDays, 30, 'Ogrohayon length expected 30 days in mapping');

// For late December 2026, Poush should use mapping year "2026".
const viewDec20 = computeWestBengalMonthView({
    monthStarts,
    month: 8, // Poush
    anchorDate: new Date(2026, 11, 20, 12, 0, 0),
});

Assert.assertTruthy(!!viewDec20, 'expected view for Dec 20, 2026');
Assert.assertEquals(viewDec20.yearKeyUsed, '2026', 'Dec 2026 Poush must use 2026 mapping');

console.log('All West Bengal month view tests passed!');
