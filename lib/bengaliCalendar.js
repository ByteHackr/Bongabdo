/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* exported
  BENGALI_MONTHS,
  BENGALI_DAYS,
  BENGALI_NUMERALS,
  BENGALI_FESTIVALS,
  toBengaliNumerals,
  formatNumber,
  getBengaliNewYearDate,
  gregorianToBengali,
  getFestivals,
  formatBengaliDate
*/

// Pure logic module: NO GNOME Shell imports here.

// Bengali month names
var BENGALI_MONTHS = [
  'বৈশাখ',    // Boishakh
  'জ্যৈষ্ঠ',   // Joishtho
  'আষাঢ়',     // Asharh
  'শ্রাবণ',    // Srabon
  'ভাদ্র',     // Bhadro
  'আশ্বিন',    // Ashwin
  'কার্তিক',   // Kartik
  'অগ্রহায়ণ',  // Ogrohayon
  'পৌষ',       // Poush
  'মাঘ',       // Magh
  'ফাল্গুন',    // Falgun
  'চৈত্র'      // Choitro
];

// Bengali day names (0=Sunday)
var BENGALI_DAYS = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার'
];

// Bengali numerals (0-9)
var BENGALI_NUMERALS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

// Bengali festivals and holidays (monthIndex, day, label)
// Note: This list is illustrative and not exhaustive.
var BENGALI_FESTIVALS = [
  [0, 1, 'পহেলা বৈশাখ'],
  [0, 15, 'রবীন্দ্রনাথ ঠাকুরের জন্মদিন'],
  [0, 25, 'কাজী নজরুল ইসলামের জন্মদিন'],
  [1, 15, 'বিশ্ব পরিবেশ দিবস'],
  [2, 1, 'আষাঢ়ের প্রথম দিন'],
  [3, 15, 'শ্রাবণ সংক্রান্তি'],
  [4, 1, 'ভাদ্রের প্রথম দিন'],
  [5, 1, 'আশ্বিনের প্রথম দিন'],
  [5, 15, 'দুর্গা পূজা শুরু'],
  [5, 20, 'দুর্গা পূজা'],
  [6, 1, 'কার্তিকের প্রথম দিন'],
  [6, 15, 'কালী পূজা'],
  [7, 1, 'অগ্রহায়ণের প্রথম দিন'],
  [7, 15, 'অগ্রহায়ণ সংক্রান্তি'],
  [8, 1, 'পৌষের প্রথম দিন'],
  [8, 15, 'পৌষ সংক্রান্তি'],
  [9, 1, 'মাঘের প্রথম দিন'],
  [9, 15, 'মাঘ সংক্রান্তি'],
  [10, 1, 'ফাল্গুনের প্রথম দিন'],
  [10, 15, 'ফাল্গুন সংক্রান্তি'],
  [11, 1, 'চৈত্রের প্রথম দিন'],
  [11, 15, 'চৈত্র সংক্রান্তি'],
  [11, 30, 'চৈত্র সংক্রান্তি']
];

function toBengaliNumerals(num) {
  return num.toString()
    .split('')
    .map(ch => BENGALI_NUMERALS[parseInt(ch, 10)])
    .join('');
}

function formatNumber(num, useBengaliNumerals) {
  return useBengaliNumerals ? toBengaliNumerals(num) : num.toString();
}

// Bengali New Year (Pohela Boishakh) heuristic.
// NOTE: This is an approximation and may be off for some locales/years.
function getBengaliNewYearDate(gregorianYear) {
  return new Date(gregorianYear, 3, 14); // April 14
}

function gregorianToBengali(year, month, day) {
  const gregorianDate = new Date(year, month - 1, day);

  const currentYearNewYear = getBengaliNewYearDate(year);
  const prevYearNewYear = getBengaliNewYearDate(year - 1);

  let bengaliYear;
  let yearStart;

  if (gregorianDate >= currentYearNewYear) {
    bengaliYear = year - 593;
    yearStart = currentYearNewYear;
  } else {
    bengaliYear = year - 1 - 593;
    yearStart = prevYearNewYear;
  }

  const daysSinceNewYear = Math.floor((gregorianDate - yearStart) / (1000 * 60 * 60 * 24));

  const monthLengths = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30];
  const isLeapYear = (bengaliYear % 4 === 0 && bengaliYear % 100 !== 0) || (bengaliYear % 400 === 0);
  if (isLeapYear)
    monthLengths[11] = 31;

  let bengaliMonth = 0;
  let bengaliDay = daysSinceNewYear + 1;

  for (let i = 0; i < monthLengths.length; i++) {
    if (bengaliDay <= monthLengths[i]) {
      bengaliMonth = i;
      break;
    }
    bengaliDay -= monthLengths[i];
  }

  if (bengaliDay < 1)
    bengaliDay = 1;
  if (bengaliDay > monthLengths[bengaliMonth])
    bengaliDay = monthLengths[bengaliMonth];

  return {
    year: bengaliYear,
    month: bengaliMonth,
    day: bengaliDay,
    monthName: BENGALI_MONTHS[bengaliMonth]
  };
}

function getFestivals(bengaliMonth, bengaliDay) {
  return BENGALI_FESTIVALS
    .filter(([m, d]) => m === bengaliMonth && d === bengaliDay)
    .map(([, , name]) => name);
}

function formatBengaliDate(bengaliDate, dayName, format, useBengaliNumerals) {
  const dayNum = formatNumber(bengaliDate.day, useBengaliNumerals);
  const yearNum = formatNumber(bengaliDate.year, useBengaliNumerals);

  switch (format) {
    case 'short':
      return `${dayNum} ${bengaliDate.monthName}`;
    case 'date-only':
      return `${dayNum} ${bengaliDate.monthName} ${yearNum}`;
    case 'compact':
      return `${dayNum}/${bengaliDate.month + 1}/${yearNum}`;
    case 'full':
    default:
      return `${dayName}, ${dayNum} ${bengaliDate.monthName} ${yearNum}`;
  }
}


