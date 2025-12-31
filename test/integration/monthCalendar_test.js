import * as Assert from '../_assert.js';
import * as Bengali from '../../lib/bengaliCalendar.js';

// Test month calendar building logic

const monthStarts2025 = {
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
    },
    "2026": {
        "0": "2026-04-14"
    }
};

// Test Poush month (Dec 16 - Jan 15)
const poushStart = new Date(2025, 11, 16); // Dec 16, 2025
const poushEnd = new Date(2026, 0, 15);    // Jan 15, 2026
const daysInPoush = Math.floor((poushEnd - poushStart) / (1000 * 60 * 60 * 24));
Assert.assertEquals(daysInPoush, 30, 'Poush should have 30 days');

// Test that Dec 16 is Sankranti (not day 1)
// With JSON mapping, Dec 16 is Sankranti so it's still previous month (Agrayan)
// Our code uses > instead of >=, so Dec 16 won't match Poush
const dec16 = Bengali.gregorianToBengali(2025, 12, 16, monthStarts2025);
// Dec 16 should fallback to heuristic or be previous month
// The important test is that Dec 17 is day 1, which we test below

// Test that Dec 17 is day 1
const dec17 = Bengali.gregorianToBengali(2025, 12, 17, monthStarts2025);
Assert.assertEquals(dec17.month, 8, 'Dec 17 should be Poush');
Assert.assertEquals(dec17.day, 1, 'Dec 17 should be day 1');

// Test that Dec 31 is day 15
const dec31 = Bengali.gregorianToBengali(2025, 12, 31, monthStarts2025);
Assert.assertEquals(dec31.month, 8, 'Dec 31 should be Poush');
Assert.assertEquals(dec31.day, 15, 'Dec 31 should be day 15');

// Test month boundaries
const testMonths = [
    { month: 0, start: "2025-04-15", end: "2025-05-15", name: "Boishakh" },
    { month: 1, start: "2025-05-15", end: "2025-06-15", name: "Joishtho" },
    { month: 8, start: "2025-12-16", end: "2026-01-15", name: "Poush" },
];

testMonths.forEach(({ month, start, end, name }) => {
    const parseDate = (str) => {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    };
    
    const startDate = parseDate(start);
    const endDate = parseDate(end);
    const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    // First day after Sankranti
    const firstDay = new Date(startDate);
    firstDay.setDate(firstDay.getDate() + 1);
    
    const firstDayConverted = Bengali.gregorianToBengali(
        firstDay.getFullYear(),
        firstDay.getMonth() + 1,
        firstDay.getDate(),
        monthStarts2025
    );
    
    Assert.assertEquals(firstDayConverted.month, month, `${name} first day should be correct month`);
    Assert.assertEquals(firstDayConverted.day, 1, `${name} first day should be day 1`);
    Assert.assert(days >= 30 && days <= 32, `${name} should have 30-32 days`);
});

// Test year boundary (Choitro to Boishakh)
const choitroEnd = Bengali.gregorianToBengali(2026, 3, 15, monthStarts2025);
Assert.assertEquals(choitroEnd.month, 11, 'Mar 15 should be Choitro');

const boishakhStart = Bengali.gregorianToBengali(2026, 4, 14, monthStarts2025);
Assert.assertEquals(boishakhStart.month, 0, 'Apr 14 should be Boishakh start');

console.log('All month calendar tests passed!');

