import * as Assert from '../_assert.js';
import * as Bengali from '../../lib/bengaliCalendar.js';

// Integration tests: run the same pipeline extension uses:
// gregorian -> bengali -> format (with/without numerals) and verify stable output shapes.

const now = new Date(2024, 3, 14); // Apr 14, 2024 (Pohela Boishakh by heuristic)
const dayName = Bengali.BENGALI_DAYS[now.getDay()];
const bengaliDate = Bengali.gregorianToBengali(now.getFullYear(), now.getMonth() + 1, now.getDate());

// Test full format with Bengali numerals
const fullBn = Bengali.formatBengaliDate(bengaliDate, dayName, 'full', true);
Assert.assertTruthy(fullBn.includes('বৈশাখ'), 'full format should include month name');
Assert.assertTruthy(fullBn.includes('০') || fullBn.includes('১') || fullBn.includes('২') || fullBn.includes('৩') || fullBn.includes('৪') || fullBn.includes('৫') || fullBn.includes('৬') || fullBn.includes('৭') || fullBn.includes('৮') || fullBn.includes('৯'),
    'Bengali numerals expected in output');

// Test full format with Western numerals
const fullEn = Bengali.formatBengaliDate(bengaliDate, dayName, 'full', false);
Assert.assertTruthy(/[0-9]/.test(fullEn), 'Western numerals expected when disabled');
Assert.assertTruthy(!fullEn.match(/[০-৯]/), 'should not have Bengali numerals when disabled');

// Test compact format
const compact = Bengali.formatBengaliDate(bengaliDate, dayName, 'compact', false);
Assert.assertTruthy(compact.includes('/'), 'compact should use / separators');
Assert.assertTruthy(compact.match(/\d+\/\d+\/\d+/), 'compact should match DD/MM/YYYY pattern');

// Test compact with Bengali numerals
const compactBn = Bengali.formatBengaliDate(bengaliDate, dayName, 'compact', true);
Assert.assertTruthy(compactBn.includes('/'), 'compact Bengali should use / separators');
Assert.assertTruthy(compactBn.match(/[০-৯]/), 'compact Bengali should use Bengali numerals');

// Test all formats
const formats = ['full', 'short', 'date-only', 'compact'];
formats.forEach(format => {
    const formatted = Bengali.formatBengaliDate(bengaliDate, dayName, format, false);
    Assert.assertTruthy(typeof formatted === 'string', `${format} format should return string`);
    Assert.assertTruthy(formatted.length > 0, `${format} format should not be empty`);
});

// Test with different dates
const testDates = [
    new Date(2024, 0, 1),   // Jan 1
    new Date(2024, 5, 15),  // Jun 15
    new Date(2024, 11, 31), // Dec 31
];

testDates.forEach(date => {
    const dayName = Bengali.BENGALI_DAYS[date.getDay()];
    const bd = Bengali.gregorianToBengali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const formatted = Bengali.formatBengaliDate(bd, dayName, 'full', false);
    Assert.assertTruthy(formatted.length > 0, `formatting should work for ${date.toISOString()}`);
    Assert.assertTruthy(bd.month >= 0 && bd.month <= 11, 'month should be valid');
    Assert.assertTruthy(bd.day >= 1 && bd.day <= 32, 'day should be valid');
});

console.log('All formatting pipeline tests passed!');
