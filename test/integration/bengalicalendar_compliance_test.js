/**
 * Test Bengali date conversion against bengalicalendar.com (India Panjika)
 * Reference: https://bengalicalendar.com/
 *
 * Format: [gregorianY, gregorianM, gregorianD, expectedBengaliDay, expectedBengaliMonth, expectedBengaliYear]
 * Month: 0=Boishakh, 1=Joishtho, ..., 10=Falgun, 11=Choitro
 */
import * as Assert from '../_assert.js';
import * as Bengali from '../../lib/bengaliCalendar.js';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

function loadMonthStarts() {
    const base = GLib.get_current_dir();
    const file = Gio.File.new_for_path(`${base}/lib/bengaliMonthStarts.json`);
    const [ok, bytes] = file.load_contents(null);
    if (!ok) return {};
    return JSON.parse(new TextDecoder('utf-8').decode(bytes));
}

const monthStarts = loadMonthStarts();

// Test cases from bengalicalendar.com (Gregorian -> Bengali day, month, year)
// [y, m, d, expectedDay, expectedMonth, expectedYear]
const TEST_CASES = [
    // Boishakh 1432 (Apr/May 2025) - 1=Apr15, 31=May15
    [2025, 4, 15, 1, 0, 1432],
    [2025, 4, 16, 2, 0, 1432],
    [2025, 4, 20, 6, 0, 1432],
    [2025, 5, 1, 17, 0, 1432],
    [2025, 5, 15, 31, 0, 1432],
    // Falgun 1432 (Feb/Mar 2026) - 1=Feb14, 13=Feb26 (per bengalicalendar.com grid)
    [2026, 2, 14, 1, 10, 1432],
    [2026, 2, 15, 2, 10, 1432],
    [2026, 2, 26, 13, 10, 1432],
    [2026, 2, 28, 15, 10, 1432],
    // Choitro 1432 (Mar/Apr 2026) - 1=Mar16, 30=Apr14
    [2026, 3, 16, 1, 11, 1432],
    [2026, 3, 20, 5, 11, 1432],
    [2026, 4, 14, 30, 11, 1432],
    // Boishakh 1433 (Apr/May 2026) - 1=Apr15, 31=May15
    [2026, 4, 15, 1, 0, 1433],
    [2026, 4, 16, 2, 0, 1433],
    [2026, 5, 9, 25, 0, 1433],
    [2026, 5, 15, 31, 0, 1433],
];

let passed = 0;
let failed = 0;

for (const [gy, gm, gd, expDay, expMonth, expYear] of TEST_CASES) {
    const result = Bengali.gregorianToBengali(gy, gm, gd, monthStarts);
    const ok = result && result.day === expDay && result.month === expMonth && result.year === expYear;
    if (ok) {
        passed++;
    } else {
        failed++;
        const got = result ? `${result.day} ${Bengali.BENGALI_MONTHS[result.month]} ${result.year}` : 'null';
        const exp = `${expDay} ${Bengali.BENGALI_MONTHS[expMonth]} ${expYear}`;
        console.error(`FAIL: ${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')} => got ${got}, expected ${exp}`);
    }
}

Assert.assertEquals(failed, 0, `${failed} of ${TEST_CASES.length} dates failed (${passed} passed)`);
console.log(`All ${TEST_CASES.length} bengalicalendar.com compliance tests passed!`);
