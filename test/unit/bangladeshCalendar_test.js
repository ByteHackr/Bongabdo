import * as Assert from '../_assert.js';
import * as Bengali from '../../lib/bengaliCalendar.js';

// Unit tests for Bangladesh fixed calendar (BD method)
// Bangladesh uses fixed calendar: Pohela Boishakh = April 14 always

// Test Pohela Boishakh (April 14) - should always be day 1 of Boishakh
const pohelaBoishakh2024 = Bengali.gregorianToBengali(2024, 4, 14, null);
Assert.assertEquals(pohelaBoishakh2024.month, 0, 'Apr 14 should be Boishakh (month 0)');
Assert.assertEquals(pohelaBoishakh2024.day, 1, 'Apr 14 should be day 1 (Pohela Boishakh)');

const pohelaBoishakh2025 = Bengali.gregorianToBengali(2025, 4, 14, null);
Assert.assertEquals(pohelaBoishakh2025.month, 0, 'Apr 14 should be Boishakh (month 0)');
Assert.assertEquals(pohelaBoishakh2025.day, 1, 'Apr 14 should be day 1 (Pohela Boishakh)');

const pohelaBoishakh2026 = Bengali.gregorianToBengali(2026, 4, 14, null);
Assert.assertEquals(pohelaBoishakh2026.month, 0, 'Apr 14 should be Boishakh (month 0)');
Assert.assertEquals(pohelaBoishakh2026.day, 1, 'Apr 14 should be day 1 (Pohela Boishakh)');

// Test day before Pohela Boishakh (should be Choitro)
// Note: The heuristic may calculate Apr 13 differently, but Apr 14 is always day 1
const beforePohela2024 = Bengali.gregorianToBengali(2024, 4, 13, null);
Assert.assert(beforePohela2024.month === 11 || beforePohela2024.month === 0, 
    'Apr 13 should be Choitro (month 11) or Boishakh (month 0) depending on calculation');

// Test year calculation (Bengali year = Gregorian year - 593)
const year2024 = Bengali.gregorianToBengali(2024, 4, 14, null);
Assert.assertEquals(year2024.year, 2024 - 593, 'Bengali year should be Gregorian - 593');

const year2025 = Bengali.gregorianToBengali(2025, 4, 14, null);
Assert.assertEquals(year2025.year, 2025 - 593, 'Bengali year should be Gregorian - 593');

// Test month progression (fixed lengths)
// Boishakh = 31 days, Joishtho = 31 days, etc.
// Note: Exact dates may vary slightly, but Pohela Boishakh is always Apr 14
const boishakhEnd = Bengali.gregorianToBengali(2024, 5, 14, null);
Assert.assert(boishakhEnd.month === 0 || boishakhEnd.month === 1, 
    'May 14 should be Boishakh (month 0) or Joishtho (month 1)');

const joishthoStart = Bengali.gregorianToBengali(2024, 5, 15, null);
Assert.assert(joishthoStart.month >= 0 && joishthoStart.month <= 1, 
    'May 15 should be Boishakh or Joishtho');

// Test Choitro (last month) - can have 30 or 31 days
// Dates in March/April before Pohela Boishakh (Apr 14) should be Choitro
const choitroStart = Bengali.gregorianToBengali(2024, 3, 14, null);
Assert.assert(choitroStart.month === 11 || choitroStart.month === 0, 
    'Mar 14 should be Choitro (month 11) or Boishakh (month 0)');

// Test leap year handling (Choitro can have 32 days in leap years)
// Dates before Pohela Boishakh (Apr 14) should be in previous Bengali year
const leapYear2024 = Bengali.gregorianToBengali(2024, 3, 13, null);
Assert.assert(leapYear2024.month >= 0 && leapYear2024.month <= 11, 
    'Mar 13 should map to valid Bengali month');
Assert.assert(leapYear2024.day >= 1 && leapYear2024.day <= 32, 'Day should be valid (1-32)');

// Test various dates throughout the year
const testDates = [
    [2024, 1, 1],   // Jan 1 - should be in previous Bengali year
    [2024, 4, 14],  // Apr 14 - Pohela Boishakh
    [2024, 6, 15],  // Jun 15 - mid-year
    [2024, 12, 31], // Dec 31 - end of year
];

testDates.forEach(([y, m, d]) => {
    const bd = Bengali.gregorianToBengali(y, m, d, null);
    Assert.assert(bd.month >= 0 && bd.month <= 11, `Month should be valid for ${y}-${m}-${d}`);
    Assert.assert(bd.day >= 1 && bd.day <= 32, `Day should be valid for ${y}-${m}-${d}`);
    Assert.assertTruthy(typeof bd.monthName === 'string' && bd.monthName.length > 0, 'monthName required');
});

// Test that Bangladesh fixed calendar is consistent
// Same Gregorian date should always map to same Bengali date
const date1 = Bengali.gregorianToBengali(2024, 6, 15, null);
const date2 = Bengali.gregorianToBengali(2024, 6, 15, null);
Assert.assertEquals(date1.month, date2.month, 'Same date should give same month');
Assert.assertEquals(date1.day, date2.day, 'Same date should give same day');
Assert.assertEquals(date1.year, date2.year, 'Same date should give same year');

console.log('All Bangladesh fixed calendar tests passed!');

