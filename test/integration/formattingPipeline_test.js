const Assert = imports._assert;
const Bengali = imports.bengaliCalendar;

// Integration-ish tests: run the same pipeline extension uses:
// gregorian -> bengali -> format (with/without numerals) and verify stable output shapes.

const now = new Date(2024, 3, 14); // Apr 14, 2024 (Pohela Boishakh by heuristic)
const dayName = Bengali.BENGALI_DAYS[now.getDay()];
const bengaliDate = Bengali.gregorianToBengali(now.getFullYear(), now.getMonth() + 1, now.getDate());

const fullBn = Bengali.formatBengaliDate(bengaliDate, dayName, 'full', true);
Assert.assertTruthy(fullBn.includes('বৈশাখ'), 'full format should include month name');
Assert.assertTruthy(fullBn.includes('০') || fullBn.includes('১') || fullBn.includes('২') || fullBn.includes('৩') || fullBn.includes('৪') || fullBn.includes('৫') || fullBn.includes('৬') || fullBn.includes('৭') || fullBn.includes('৮') || fullBn.includes('৯'),
  'Bengali numerals expected in output');

const fullEn = Bengali.formatBengaliDate(bengaliDate, dayName, 'full', false);
Assert.assertTruthy(/[0-9]/.test(fullEn), 'Western numerals expected when disabled');

const compact = Bengali.formatBengaliDate(bengaliDate, dayName, 'compact', false);
Assert.assertTruthy(compact.includes('/'), 'compact should use / separators');


