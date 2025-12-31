import * as Assert from '../_assert.js';
import * as Bengali from '../../lib/bengaliCalendar.js';

// Unit tests for pure module `lib/bengaliCalendar.js`

// Numerals
Assert.assertEquals(Bengali.toBengaliNumerals(0), '০', '0 should be ০');
Assert.assertEquals(Bengali.toBengaliNumerals(1234567890), '১২৩৪৫৬৭৮৯০');
Assert.assertEquals(Bengali.toBengaliNumerals(-42), '-৪২', 'negative numbers keep sign');

// formatNumber
Assert.assertEquals(Bengali.formatNumber(42, false), '42');
Assert.assertEquals(Bengali.formatNumber(42, true), '৪২');

// Festivals lookup
const festivalsPohela = Bengali.getFestivals(0, 1);
Assert.assertTruthy(festivalsPohela.length >= 1, 'Pohela Boishakh festival expected');
Assert.assertEquals(festivalsPohela[0], 'পহেলা বৈশাখ');

// Conversion invariants (not astronomical correctness)
// New year day should map to day 1 month 0 (by our heuristic of Apr 14).
const bd1 = Bengali.gregorianToBengali(2024, 4, 14);
Assert.assertEquals(bd1.month, 0, 'Apr 14 should map to Boishakh (month 0) in our heuristic');
Assert.assertEquals(bd1.day, 1, 'Apr 14 should map to day 1 in our heuristic');

// Day range sanity (Bengali months can have up to 32 days)
for (const [y, m, d] of [
  [2024, 1, 1],
  [2024, 2, 29],
  [2024, 12, 31],
  [2025, 4, 13],
  [2025, 4, 14],
]) {
  const bd = Bengali.gregorianToBengali(y, m, d);
  Assert.assert(bd.month >= 0 && bd.month <= 11, `month out of range for ${y}-${m}-${d}`);
  Assert.assert(bd.day >= 1 && bd.day <= 32, `day out of range for ${y}-${m}-${d} (Bengali months can have up to 32 days)`);
  Assert.assertTruthy(typeof bd.monthName === 'string' && bd.monthName.length > 0, 'monthName required');
}

// Compact format should honor numeral preference for month/day/year
const sampleDate = new Date(2024, 3, 14); // April 14 2024
const sampleDayName = Bengali.BENGALI_DAYS[sampleDate.getDay()];
const sampleBengali = Bengali.gregorianToBengali(sampleDate.getFullYear(), sampleDate.getMonth() + 1, sampleDate.getDate());
const compact = Bengali.formatBengaliDate(sampleBengali, sampleDayName, 'compact', false);
Assert.assertTruthy(compact.includes('/'), 'compact should use / separators');
const compactBn = Bengali.formatBengaliDate(sampleBengali, sampleDayName, 'compact', true);
Assert.assertTruthy(compactBn.match(/[০-৯]/), 'compact should use Bengali numerals');


