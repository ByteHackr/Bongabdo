/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

// Pure logic module: NO GNOME Shell imports here.

// Bengali month names
export const BENGALI_MONTHS = [
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
export const BENGALI_DAYS = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার'
];

// Bengali numerals (0-9)
export const BENGALI_NUMERALS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

// Bengali festivals and holidays (monthIndex, day, label)
// Note: This list is illustrative and not exhaustive.
export const BENGALI_FESTIVALS = [
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

export function toBengaliNumerals(num) {
  return num.toString()
    .split('')
    .map(ch => {
      if (ch === '-' || ch === '+')
        return ch;
      const digit = parseInt(ch, 10);
      return Number.isNaN(digit) ? ch : BENGALI_NUMERALS[digit];
    })
    .join('');
}

export function formatNumber(num, useBengaliNumerals) {
  return useBengaliNumerals ? toBengaliNumerals(num) : num.toString();
}

// Bengali New Year (Pohela Boishakh) heuristic (fallback).
// NOTE: This is an approximation and may be off for West Bengal.
export function getBengaliNewYearDate(gregorianYear) {
  return new Date(gregorianYear, 3, 14); // April 14
}

// Parse date string "YYYY-MM-DD" to Date object
function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Convert Gregorian to Bengali using month start mapping (West Bengal Surya Siddhanta)
// monthStarts: Object mapping year strings to month index -> date string, e.g. {"2024": {"0": "2024-04-14", ...}}
export function gregorianToBengali(year, month, day, monthStarts = null) {
  const gregorianDate = new Date(year, month - 1, day);
  
  // If monthStarts mapping is provided, use it for accurate West Bengal calendar
  if (monthStarts && typeof monthStarts === 'object') {
    // Find which Bengali year this date belongs to
    const yearStr = String(year);
    const prevYearStr = String(year - 1);
    
    // Get Pohela Boishakh dates for current and previous year
    let currentYearBoishakh = null;
    let prevYearBoishakh = null;
    
    if (monthStarts[yearStr] && monthStarts[yearStr]['0']) {
      currentYearBoishakh = parseDate(monthStarts[yearStr]['0']);
    }
    if (monthStarts[prevYearStr] && monthStarts[prevYearStr]['0']) {
      prevYearBoishakh = parseDate(monthStarts[prevYearStr]['0']);
    }
    
    // Determine Bengali year
    let bengaliYear;
    let yearData;
    
    // IMPORTANT: monthStarts stores the *Sankranti date*. In West Bengal/India (Surya Siddhanta),
    // that Gregorian date can still belong to the previous Bengali year/month (Sankranti later in day).
    // So treat the Sankranti date itself as "previous year" and start the new year the next day.
    if (currentYearBoishakh) {
      if (gregorianDate > currentYearBoishakh) {
        bengaliYear = year - 593;
        yearData = monthStarts[yearStr];
      } else if (prevYearBoishakh) {
        bengaliYear = year - 1 - 593;
        yearData = monthStarts[prevYearStr];
      } else {
        return gregorianToBengaliHeuristic(year, month, day);
      }
    } else if (prevYearBoishakh) {
      // Mapping for this Gregorian year is missing. We can still use the previous year's mapping
      // for dates early in the year (Jan–Mar), since that Bengali year spans into this Gregorian year.
      // Past ~Pohela Boishakh, the mapping becomes unreliable, so fall back.
      const approxNewYear = getBengaliNewYearDate(year); // heuristic boundary (Apr 14)
      if (gregorianDate < approxNewYear) {
        bengaliYear = year - 1 - 593;
        yearData = monthStarts[prevYearStr];
      } else {
        return gregorianToBengaliHeuristic(year, month, day);
      }
    } else {
      // Fallback to heuristic if mapping missing
      return gregorianToBengaliHeuristic(year, month, day);
    }
    
    if (!yearData) {
      return gregorianToBengaliHeuristic(year, month, day);
    }
    
    // Find which Bengali month this date falls into
    let bengaliMonth = 0;
    let monthStart = null;
    let nextMonthStart = null;
    
    for (let i = 0; i < 12; i++) {
      const monthKey = String(i);
      if (!yearData[monthKey]) continue;
      
      const thisMonthStart = parseDate(yearData[monthKey]);
      
      // Check if date is before next month (or is last month)
      // The JSON date represents Sankranti date. If Sankranti occurs later in the day (IST),
      // that Gregorian date is still the previous Bengali month. The next day is Day 1.
      // So we use > instead of >= to exclude the Sankranti date itself.
      if (i < 11) {
        const nextMonthKey = String(i + 1);
        if (yearData[nextMonthKey]) {
          nextMonthStart = parseDate(yearData[nextMonthKey]);
          // Use > to exclude the Sankranti date (it's still previous month)
          if (gregorianDate > thisMonthStart && gregorianDate < nextMonthStart) {
            bengaliMonth = i;
            monthStart = thisMonthStart;
            break;
          }
        }
      } else {
        // Last month (Choitro) - check if date is > its start
        if (gregorianDate > thisMonthStart) {
          bengaliMonth = i;
          monthStart = thisMonthStart;
          // Next month start would be next year's Boishakh
          if (monthStarts[String(year + 1)] && monthStarts[String(year + 1)]['0']) {
            nextMonthStart = parseDate(monthStarts[String(year + 1)]['0']);
          }
          break;
        }
      }
    }
    
    if (monthStart === null) {
      return gregorianToBengaliHeuristic(year, month, day);
    }
    
    // Calculate day within the Bengali month
    // Normalize dates to midnight to avoid timezone issues
    const normalizeDate = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };
    
    const normalizedGregorian = normalizeDate(gregorianDate);
    const normalizedMonthStart = normalizeDate(monthStart);
    
    const daysSinceMonthStart = Math.floor((normalizedGregorian - normalizedMonthStart) / (1000 * 60 * 60 * 24));
    
    // The JSON date represents the Sankranti date when the Bengali month begins.
    // If Sankranti occurs later in the day (afternoon/evening IST), that Gregorian date
    // is still part of the previous Bengali month. The next day is Day 1.
    // So if JSON says "2025-12-16", it means:
    // - Dec 16 = Sankranti day (still previous month if Sankranti is afternoon/evening)
    // - Dec 17 = Day 1 of the Bengali month
    // - Dec 31 = Day 15 (14 days after Dec 17)
    // Since we use > instead of >= for month detection, daysSinceMonthStart gives:
    // - Dec 17 = 1 day since Dec 16 = Day 1
    // - Dec 31 = 15 days since Dec 16 = Day 15
    const bengaliDay = daysSinceMonthStart;
    
    // Validate day is within month bounds
    // Bengali months can have up to 32 days (especially Choitro in certain years)
    let maxDay;
    if (nextMonthStart) {
      // Calculate actual days between month start and next month start
      const normalizedNextStart = normalizeDate(nextMonthStart);
      maxDay = Math.floor((normalizedNextStart - normalizedMonthStart) / (1000 * 60 * 60 * 24));
    } else {
      // Fallback: use standard month lengths (some months can have 32 days)
      const monthLengths = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30];
      const isLeapYear = (bengaliYear % 4 === 0 && bengaliYear % 100 !== 0) || (bengaliYear % 400 === 0);
      // Choitro (month 11) can have 31 or 32 days in leap years
      if (isLeapYear) monthLengths[11] = 32; // Allow 32 days for Choitro in leap years
      maxDay = monthLengths[bengaliMonth];
    }
    
    // Allow days 1-32 (Bengali months can have 32 days)
    const finalDay = Math.max(1, Math.min(bengaliDay, maxDay));
    
    return {
      year: bengaliYear,
      month: bengaliMonth,
      day: finalDay,
      monthName: BENGALI_MONTHS[bengaliMonth]
    };
  }
  
  // Fallback to heuristic method if no mapping provided
  return gregorianToBengaliHeuristic(year, month, day);
}

// Original heuristic method (fallback)
function gregorianToBengaliHeuristic(year, month, day) {
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
  // Choitro (month 11) can have 31 or 32 days in leap years
  if (isLeapYear)
    monthLengths[11] = 32; // Allow 32 days for Choitro in leap years

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

export function getFestivals(bengaliMonth, bengaliDay) {
  return BENGALI_FESTIVALS
    .filter(([m, d]) => m === bengaliMonth && d === bengaliDay)
    .map(([, , name]) => name);
}

export function formatBengaliDate(bengaliDate, dayName, format, useBengaliNumerals) {
  const dayNum = formatNumber(bengaliDate.day, useBengaliNumerals);
  const yearNum = formatNumber(bengaliDate.year, useBengaliNumerals);

  switch (format) {
    case 'short':
      return `${dayNum} ${bengaliDate.monthName}`;
    case 'date-only':
      return `${dayNum} ${bengaliDate.monthName} ${yearNum}`;
    case 'compact':
      return `${dayNum}/${formatNumber(bengaliDate.month + 1, useBengaliNumerals)}/${yearNum}`;
    case 'full':
    default:
      return `${dayName}, ${dayNum} ${bengaliDate.monthName} ${yearNum}`;
  }
}


