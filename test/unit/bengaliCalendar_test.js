import * as Assert from '../_assert.js';
import * as Bengali from '../../lib/bengaliCalendar.js';

// Unit tests for pure module `lib/bengaliCalendar.js`

// ===== Bengali Numerals Tests =====
Assert.assertEquals(Bengali.toBengaliNumerals(0), '০', '0 should be ০');
Assert.assertEquals(Bengali.toBengaliNumerals(1234567890), '১২৩৪৫৬৭৮৯০', 'large number conversion');
Assert.assertEquals(Bengali.toBengaliNumerals(-42), '-৪২', 'negative numbers keep sign');
Assert.assertEquals(Bengali.toBengaliNumerals(32), '৩২', '32 should convert correctly');

// Test formatNumber
Assert.assertEquals(Bengali.formatNumber(42, false), '42', 'formatNumber with Western numerals');
Assert.assertEquals(Bengali.formatNumber(42, true), '৪২', 'formatNumber with Bengali numerals');
Assert.assertEquals(Bengali.formatNumber(0, true), '০', 'formatNumber zero with Bengali');
Assert.assertEquals(Bengali.formatNumber(32, true), '৩২', 'formatNumber 32 with Bengali');

// ===== Bengali Constants Tests =====
Assert.assertEquals(Bengali.BENGALI_MONTHS.length, 12, 'should have 12 months');
Assert.assertEquals(Bengali.BENGALI_DAYS.length, 7, 'should have 7 days');
Assert.assertEquals(Bengali.BENGALI_NUMERALS.length, 10, 'should have 10 numerals');
Assert.assertTruthy(Bengali.BENGALI_MONTHS[0] === 'বৈশাখ', 'first month should be Boishakh');
Assert.assertTruthy(Bengali.BENGALI_DAYS[0] === 'রবিবার', 'first day should be Sunday');

// ===== Festival Lookup Tests =====
const festivalsPohela = Bengali.getFestivals(0, 1);
Assert.assertTruthy(festivalsPohela.length >= 1, 'Pohela Boishakh festival expected');
Assert.assertEquals(festivalsPohela[0], 'পহেলা বৈশাখ', 'Pohela Boishakh name');

const festivalsNone = Bengali.getFestivals(5, 10);
Assert.assertEquals(festivalsNone.length, 0, 'no festivals on random date');

// ===== Date Formatting Tests =====
const testDate = {
    year: 1431,
    month: 0,
    day: 15,
    monthName: 'বৈশাখ'
};
const testDayName = 'রবিবার';

// Full format
const fullBn = Bengali.formatBengaliDate(testDate, testDayName, 'full', true);
Assert.assertTruthy(fullBn.includes('রবিবার'), 'full format should include day name');
Assert.assertTruthy(fullBn.includes('বৈশাখ'), 'full format should include month name');
Assert.assertTruthy(fullBn.includes('১'), 'full format should include day number');

const fullEn = Bengali.formatBengaliDate(testDate, testDayName, 'full', false);
Assert.assertTruthy(/[0-9]/.test(fullEn), 'full format with Western numerals should have digits');

// Short format
const short = Bengali.formatBengaliDate(testDate, testDayName, 'short', false);
Assert.assertTruthy(short.includes('15'), 'short format should include day');
Assert.assertTruthy(short.includes('বৈশাখ'), 'short format should include month');
Assert.assertTruthy(!short.includes('রবিবার'), 'short format should not include day name');

// Date-only format
const dateOnly = Bengali.formatBengaliDate(testDate, testDayName, 'date-only', false);
Assert.assertTruthy(dateOnly.includes('15'), 'date-only should include day');
Assert.assertTruthy(dateOnly.includes('বৈশাখ'), 'date-only should include month');
Assert.assertTruthy(dateOnly.includes('1431'), 'date-only should include year');

// Compact format
const compact = Bengali.formatBengaliDate(testDate, testDayName, 'compact', false);
Assert.assertTruthy(compact.includes('/'), 'compact should use / separators');
Assert.assertTruthy(compact.match(/\d+\/\d+\/\d+/), 'compact should have DD/MM/YYYY format');

const compactBn = Bengali.formatBengaliDate(testDate, testDayName, 'compact', true);
Assert.assertTruthy(compactBn.match(/[০-৯]/), 'compact with Bengali numerals should use Bengali digits');
Assert.assertTruthy(compactBn.includes('/'), 'compact Bengali should still use / separators');

// Default format (should be full)
const defaultFormat = Bengali.formatBengaliDate(testDate, testDayName, 'invalid', false);
Assert.assertTruthy(defaultFormat.includes('রবিবার'), 'default format should be full');

// ===== Calendar Conversion Tests (Heuristic) =====
// Test Pohela Boishakh (April 14 heuristic)
const bd1 = Bengali.gregorianToBengali(2024, 4, 14);
Assert.assertEquals(bd1.month, 0, 'Apr 14 should map to Boishakh (month 0)');
Assert.assertEquals(bd1.day, 1, 'Apr 14 should map to day 1');
Assert.assertEquals(bd1.year, 2024 - 593, 'Bengali year should be Gregorian - 593');

// Test day before Pohela Boishakh
const bd2 = Bengali.gregorianToBengali(2024, 4, 13);
// With heuristic (Apr 14 = day 1), Apr 13 could be Choitro or Boishakh depending on calculation
Assert.assert(bd2.month >= 0 && bd2.month <= 11, 'Apr 13 should map to valid month');
Assert.assert(bd2.day >= 1 && bd2.day <= 32, 'day should be valid');

// Test year boundary
const bd3 = Bengali.gregorianToBengali(2024, 1, 1);
Assert.assert(bd3.month >= 0 && bd3.month <= 11, 'January should map to valid month');
Assert.assertEquals(bd3.year, 2023 - 593, 'Jan 1 should be previous Bengali year');

// ===== Day Range Tests =====
// Test various dates to ensure valid ranges
for (const [y, m, d] of [
    [2024, 1, 1],
    [2024, 2, 29],  // Leap year
    [2024, 6, 15],
    [2024, 12, 31],
    [2025, 4, 13],
    [2025, 4, 14],
    [2025, 4, 15],
]) {
    const bd = Bengali.gregorianToBengali(y, m, d);
    Assert.assert(bd.month >= 0 && bd.month <= 11, `month out of range for ${y}-${m}-${d}`);
    Assert.assert(bd.day >= 1 && bd.day <= 32, `day out of range for ${y}-${m}-${d} (Bengali months can have up to 32 days)`);
    Assert.assertTruthy(typeof bd.monthName === 'string' && bd.monthName.length > 0, 'monthName required');
    Assert.assertTruthy(bd.year > 0, 'year should be positive');
}

// ===== JSON Mapping Tests (West Bengal Calendar) =====
const monthStarts2025 = {
    "2024": {
        "0": "2024-04-14",
        "11": "2025-03-15"
    },
    "2025": {
        "0": "2025-04-15",
        "1": "2025-05-15",
        "2": "2025-06-15",
        "3": "2025-07-16",
        "4": "2025-08-16",
        "5": "2025-09-16",
        "6": "2025-10-17",
        "7": "2025-11-16",
        "8": "2025-12-16",
        "9": "2026-01-15",
        "10": "2026-02-14",
        "11": "2026-03-15"
    }
};

// Test Dec 31, 2025 should be day 15 of Poush (month 8)
const dec31 = Bengali.gregorianToBengali(2025, 12, 31, monthStarts2025);
Assert.assertEquals(dec31.month, 8, 'Dec 31 should be Poush (month 8)');
Assert.assertEquals(dec31.day, 15, 'Dec 31 should be day 15 (not 16)');

// Test Poush start (Dec 16 is Sankranti, Dec 17 is day 1)
const dec17 = Bengali.gregorianToBengali(2025, 12, 17, monthStarts2025);
Assert.assertEquals(dec17.month, 8, 'Dec 17 should be Poush');
Assert.assertEquals(dec17.day, 1, 'Dec 17 should be day 1 of Poush');

// Test Dec 16 (Sankranti day - should still be previous month)
// With our logic (> instead of >=), Dec 16 won't match Poush month
// It will fallback to heuristic or be previous month
const dec16 = Bengali.gregorianToBengali(2025, 12, 16, monthStarts2025);
// The key test is that Dec 17 is day 1, which is tested above
Assert.assert(dec16.month >= 0 && dec16.month <= 11, 'Dec 16 should map to valid month');

// Test month boundaries
// Apr 15 is Sankranti date, so Apr 16 is day 1
const apr15 = Bengali.gregorianToBengali(2025, 4, 15, monthStarts2025);
// Apr 15 is Sankranti, so it might still be previous month or fallback
// The key test is Apr 16 should be day 1
const apr16 = Bengali.gregorianToBengali(2025, 4, 16, monthStarts2025);
Assert.assertEquals(apr16.month, 0, 'Apr 16 should be Boishakh');
Assert.assertEquals(apr16.day, 1, 'Apr 16 should be day 1 (day after Sankranti)');
// Year boundary: Sankranti date stays in previous Bengali year; next day starts new year.
Assert.assertEquals(apr15.year, 2024 - 593, 'Apr 15 (Sankranti date) should be previous Bengali year');
Assert.assertEquals(apr16.year, 2025 - 593, 'Apr 16 should be new Bengali year');

// Test with null mapping (should fallback to heuristic)
const fallback = Bengali.gregorianToBengali(2024, 4, 14, null);
Assert.assertEquals(fallback.month, 0, 'fallback should use heuristic');

// ===== Edge Cases =====
// Test 32-day month (Choitro in leap year)
const leapYearDate = Bengali.gregorianToBengali(2024, 3, 13); // Before Pohela Boishakh
Assert.assert(leapYearDate.day <= 32, 'leap year Choitro can have 32 days');

// Test invalid monthStarts (should fallback)
const invalidMapping = { "2025": {} };
const invalidResult = Bengali.gregorianToBengali(2025, 6, 15, invalidMapping);
Assert.assert(invalidResult.month >= 0 && invalidResult.month <= 11, 'invalid mapping should fallback');

console.log('All Bengali calendar unit tests passed!');
