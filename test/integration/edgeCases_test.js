import * as Assert from '../_assert.js';
import * as Bengali from '../../lib/bengaliCalendar.js';

// Test edge cases and error handling

// ===== Invalid Input Tests =====
// Test with invalid monthStarts (should fallback gracefully)
const emptyMapping = {};
const emptyResult = Bengali.gregorianToBengali(2024, 4, 14, emptyMapping);
Assert.assert(emptyResult.month >= 0 && emptyResult.month <= 11, 'empty mapping should fallback');

const partialMapping = { "2024": { "0": "2024-04-14" } };
const partialResult = Bengali.gregorianToBengali(2024, 6, 15, partialMapping);
Assert.assert(partialResult.month >= 0 && partialResult.month <= 11, 'partial mapping should fallback');

// ===== Year Boundary Tests =====
// Test dates around Bengali New Year (heuristic: Apr 14 = Pohela Boishakh)
const beforeNewYear = Bengali.gregorianToBengali(2024, 4, 13);
const onNewYear = Bengali.gregorianToBengali(2024, 4, 14);
const afterNewYear = Bengali.gregorianToBengali(2024, 4, 15);

// With heuristic, Apr 14 is day 1, so Apr 13 is previous month
Assert.assert(beforeNewYear.month === 11 || beforeNewYear.month === 0, 
    'day before new year should be Choitro or Boishakh (heuristic)');
Assert.assertEquals(onNewYear.month, 0, 'new year day should be Boishakh');
Assert.assertEquals(afterNewYear.month, 0, 'day after new year should be Boishakh');

// ===== Leap Year Tests =====
// Test leap year handling
const leapYear = Bengali.gregorianToBengali(2024, 2, 29);
Assert.assert(leapYear.month >= 0 && leapYear.month <= 11, 'leap day should map to valid month');
Assert.assert(leapYear.day >= 1 && leapYear.day <= 32, 'leap day should be valid');

// ===== Month Length Tests =====
// Test that months can have different lengths
const monthStarts = {
    "2024": {
        "0": "2024-04-14",
        "1": "2024-05-15",
        "2": "2024-06-15",
        "3": "2024-07-16",
        "4": "2024-08-16",
        "5": "2024-09-16",
        "6": "2024-10-17",
        "7": "2024-11-16",
        "8": "2024-12-16",
        "9": "2025-01-15",
        "10": "2025-02-14",
        "11": "2025-03-15"
    }
};

// Calculate month lengths
const parseDate = (str) => {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
};

for (let i = 0; i < 12; i++) {
    const monthKey = String(i);
    const nextMonthKey = String((i + 1) % 12);
    const nextYearKey = i === 11 ? "2025" : "2024";
    
    if (!monthStarts["2024"][monthKey]) continue;
    
    const monthStart = parseDate(monthStarts["2024"][monthKey]);
    let nextStart;
    if (i === 11) {
        // Last month - need next year's Boishakh
        if (monthStarts[nextYearKey] && monthStarts[nextYearKey]["0"]) {
            nextStart = parseDate(monthStarts[nextYearKey]["0"]);
        } else {
            continue; // Skip if next year data not available
        }
    } else {
        if (!monthStarts["2024"][nextMonthKey]) continue;
        nextStart = parseDate(monthStarts["2024"][nextMonthKey]);
    }
    
    // Days between Sankranti dates (actual month length)
    const days = Math.floor((nextStart - monthStart) / (1000 * 60 * 60 * 24));
    // Month lengths can vary: 29-32 days depending on Sankranti timing
    Assert.assert(days >= 29 && days <= 32, `Month ${i} should have 29-32 days, got ${days}`);
}

// ===== Format Edge Cases =====
// Test formatting with edge values
const edgeDate = {
    year: 1,
    month: 0,
    day: 1,
    monthName: 'বৈশাখ'
};

const edgeFormatted = Bengali.formatBengaliDate(edgeDate, 'রবিবার', 'full', false);
Assert.assertTruthy(edgeFormatted.length > 0, 'edge date should format correctly');

// Test 32-day formatting
const day32Date = {
    year: 1431,
    month: 11,
    day: 32,
    monthName: 'চৈত্র'
};
const day32Formatted = Bengali.formatBengaliDate(day32Date, 'রবিবার', 'full', true);
Assert.assertTruthy(day32Formatted.includes('৩২'), 'day 32 should format with Bengali numerals');

// ===== Festival Edge Cases =====
// Test festivals on non-existent dates
const noFestivals = Bengali.getFestivals(5, 99);
Assert.assertEquals(noFestivals.length, 0, 'non-existent date should have no festivals');

// Test festivals on month boundaries
const monthStartFestivals = Bengali.getFestivals(0, 1);
Assert.assertTruthy(monthStartFestivals.length > 0, 'month start should have festivals');

// ===== Numeral Edge Cases =====
// Test large numbers
const largeNum = Bengali.toBengaliNumerals(999999);
Assert.assertTruthy(largeNum.match(/^[০-৯]+$/), 'large number should convert correctly');

// Test zero
Assert.assertEquals(Bengali.toBengaliNumerals(0), '০', 'zero should convert to ০');

// Test negative numbers
const negative = Bengali.toBengaliNumerals(-123);
Assert.assertTruthy(negative.startsWith('-'), 'negative should keep sign');
Assert.assertTruthy(negative.match(/^-[০-৯]+$/), 'negative should have Bengali numerals');

console.log('All edge case tests passed!');

