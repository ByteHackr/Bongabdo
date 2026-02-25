/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

// Pure logic module: NO GNOME Shell imports here.

import { calculateMonthLengthBisuddhaSiddhanta, YEAR_MONTH_OVERRIDES } from './bisuddhaSiddhanta.js';

/**
 * Check if a date equals a Sankranti date and determine which month it belongs to.
 * Uses override data to determine if the Sankranti date is Day 1 of new month or last day of previous month.
 * 
 * @param {Date} gregorianDate - The date to check
 * @param {Date} sankrantiDate - The Sankranti date for a month
 * @param {number} monthIndex - Bengali month index (0-11)
 * @param {number} bengaliYear - Bengali year
 * @returns {boolean} True if the date belongs to the new month (is Day 1), false if it belongs to previous month
 */
function isSankrantiDateDayOne(gregorianDate, sankrantiDate, monthIndex, bengaliYear) {
    const normalizeDate = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    };
    
    const normalizedGregorian = normalizeDate(gregorianDate);
    const normalizedSankranti = normalizeDate(sankrantiDate);
    
    // If dates don't match, not a Sankranti date
    if (normalizedGregorian.getTime() !== normalizedSankranti.getTime()) {
        return false;
    }
    
    // Check override data for previous month
    const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
    const prevBengaliYear = monthIndex === 0 ? bengaliYear - 1 : bengaliYear;
    
    if (YEAR_MONTH_OVERRIDES[prevBengaliYear]?.[prevMonthIndex]) {
        const prevMonthOverride = YEAR_MONTH_OVERRIDES[prevBengaliYear][prevMonthIndex];
        const [y, m, d] = prevMonthOverride.lastDay.split('-').map(Number);
        const prevMonthLastDay = normalizeDate(new Date(y, m - 1, d));
        
        // If previous month ends before Sankranti date, then Sankranti date is Day 1 of new month
        // Otherwise, Sankranti date is still the previous month
        return prevMonthLastDay.getTime() < normalizedSankranti.getTime();
    }
    
    // If no override data, assume Sankranti date is Day 1 (early Sankranti)
    return true;
}

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

// Parse date string "YYYY-MM-DD" to Date object (local midnight)
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
    // However, according to bengalicalendar.com, if Sankranti occurs early, the Sankranti date is Day 1 of the new year.
    // Check if date equals current year's Boishakh Sankranti - if so, check if it's Day 1 of new year
    if (currentYearBoishakh) {
      const normalizeDate = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
      };
      const normalizedGregorian = normalizeDate(gregorianDate);
      const normalizedCurrentBoishakh = normalizeDate(currentYearBoishakh);
      
      if (normalizedGregorian.getTime() === normalizedCurrentBoishakh.getTime()) {
        // Date equals current year's Boishakh Sankranti - check if it's Day 1 of new year
        const currentBengaliYear = year - 593;
        if (isSankrantiDateDayOne(gregorianDate, currentYearBoishakh, 0, currentBengaliYear)) {
          // Sankranti date is Day 1 of new year
          bengaliYear = currentBengaliYear;
          yearData = monthStarts[yearStr];
        } else {
          // Sankranti date is still previous year
          bengaliYear = year - 1 - 593;
          yearData = monthStarts[prevYearStr];
        }
      } else if (gregorianDate > currentYearBoishakh) {
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
    
    const normalizeDate = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };
    const normalizedGregorian = normalizeDate(gregorianDate);
    
    for (let i = 0; i < 12; i++) {
      const monthKey = String(i);
      if (!yearData[monthKey]) continue;
      
      const thisMonthStart = parseDate(yearData[monthKey]);
      const normalizedThisStart = normalizeDate(thisMonthStart);
      
      if (i < 11) {
        const nextMonthKey = String(i + 1);
        if (yearData[nextMonthKey]) {
          nextMonthStart = parseDate(yearData[nextMonthKey]);
          const normalizedNextStart = normalizeDate(nextMonthStart);
          
          // First check: does date equal next month's Sankranti?
          // If so, check if it's Day 1 of next month or last day of current month
          if (normalizedGregorian.getTime() === normalizedNextStart.getTime()) {
            if (isSankrantiDateDayOne(gregorianDate, nextMonthStart, i + 1, bengaliYear)) {
              // Sankranti date is Day 1 of next month
              bengaliMonth = i + 1;
              monthStart = nextMonthStart;
              // Get next month's next month start
              if (i + 1 < 11) {
                const nextNextMonthKey = String(i + 2);
                if (yearData[nextNextMonthKey]) {
                  nextMonthStart = parseDate(yearData[nextNextMonthKey]);
                }
              } else {
                // Next month is Choitro, so next-next month is next year's Boishakh
                if (monthStarts[String(year + 1)] && monthStarts[String(year + 1)]['0']) {
                  nextMonthStart = parseDate(monthStarts[String(year + 1)]['0']);
                }
              }
              break;
            }
            // Otherwise, it's last day of current month (e.g. May 15 = 31 Boishakh)
            bengaliMonth = i;
            monthStart = thisMonthStart;
            break;
          }
          
          // Second check: does date equal this month's Sankranti?
          if (normalizedGregorian.getTime() === normalizedThisStart.getTime()) {
            if (isSankrantiDateDayOne(gregorianDate, thisMonthStart, i, bengaliYear)) {
              // Sankranti date is Day 1 of this month
              bengaliMonth = i;
              monthStart = thisMonthStart;
              break;
            }
            // Otherwise, it belongs to previous month - continue searching
            continue;
          }
          
          // Regular check: date is strictly between Sankranti dates
          if (gregorianDate > thisMonthStart && gregorianDate < nextMonthStart) {
            bengaliMonth = i;
            monthStart = thisMonthStart;
            break;
          }
        }
      } else {
        // Last month (Choitro) - also check if date equals next year's Boishakh Sankranti
        const nextYearBoishakhStr = monthStarts[String(year + 1)]?.['0'];
        if (nextYearBoishakhStr) {
          const nextYearBoishakh = parseDate(nextYearBoishakhStr);
          const normalizedNextYearBoishakh = normalizeDate(nextYearBoishakh);
          
          if (normalizedGregorian.getTime() === normalizedNextYearBoishakh.getTime()) {
            // Date equals next year's Boishakh Sankranti - check if it's Day 1
            const nextBengaliYear = (year + 1) - 593;
            if (isSankrantiDateDayOne(gregorianDate, nextYearBoishakh, 0, nextBengaliYear)) {
              // Sankranti date is Day 1 of next year's Boishakh
              bengaliYear = nextBengaliYear;
              bengaliMonth = 0;
              monthStart = nextYearBoishakh;
              // Get next month (Joishtho) start
              const nextYearData = monthStarts[String(year + 1)];
              if (nextYearData && nextYearData['1']) {
                nextMonthStart = parseDate(nextYearData['1']);
              }
              break;
            }
            // Otherwise, it belongs to Choitro - fall through
          }
        }
        
        // Check if date equals Choitro's Sankranti
        if (normalizedGregorian.getTime() === normalizedThisStart.getTime()) {
          if (isSankrantiDateDayOne(gregorianDate, thisMonthStart, i, bengaliYear)) {
            bengaliMonth = i;
            monthStart = thisMonthStart;
            // Next month start would be next year's Boishakh
            if (nextYearBoishakhStr) {
              nextMonthStart = parseDate(nextYearBoishakhStr);
            }
            break;
          }
        } else if (gregorianDate > thisMonthStart) {
          bengaliMonth = i;
          monthStart = thisMonthStart;
          // Next month start would be next year's Boishakh
          if (nextYearBoishakhStr) {
            nextMonthStart = parseDate(nextYearBoishakhStr);
          }
          break;
        }
      }
    }
    
    if (monthStart === null) {
      return gregorianToBengaliHeuristic(year, month, day);
    }
    
    // Calculate day within the Bengali month
    // Use firstDay from Bisuddha Siddhanta (matches bengalicalendar.com)
    let firstDayOfMonth;
    let maxDay;
    if (nextMonthStart) {
      const normalizedNextStart = normalizeDate(nextMonthStart);
      const normalizedMonthStartNorm = normalizeDate(monthStart);
      const { firstDay, monthLength } = calculateMonthLengthBisuddhaSiddhanta(
        normalizedMonthStartNorm,
        normalizedNextStart,
        bengaliMonth,
        bengaliYear
      );
      firstDayOfMonth = firstDay;
      maxDay = monthLength;
    } else {
      // Fallback when next month boundary unknown: firstDay = Sankranti + 1
      firstDayOfMonth = new Date(monthStart);
      firstDayOfMonth.setDate(firstDayOfMonth.getDate() + 1);
      // Fallback: use standard month lengths (some months can have 32 days)
      const monthLengths = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30];
      const isLeapYear = (bengaliYear % 4 === 0 && bengaliYear % 100 !== 0) || (bengaliYear % 400 === 0);
      // Choitro (month 11) can have 31 or 32 days in leap years
      if (isLeapYear) monthLengths[11] = 32; // Allow 32 days for Choitro in leap years
      maxDay = monthLengths[bengaliMonth];
    }
    
    const normalizedFirstDay = normalizeDate(firstDayOfMonth);
    const daysSinceMonthStart = Math.floor((normalizedGregorian - normalizedFirstDay) / (1000 * 60 * 60 * 24));
    const bengaliDay = daysSinceMonthStart + 1;
    
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

/**
 * Get festivals for a specific Bengali date.
 * First checks year-specific festivals from JSON, then falls back to static list.
 * 
 * @param {number} bengaliMonth - Bengali month index (0-11)
 * @param {number} bengaliDay - Bengali day (1-31)
 * @param {number} bengaliYear - Bengali year (optional, for year-specific festivals)
 * @param {object} festivalsData - Year-specific festivals data from JSON (optional)
 * @returns {string[]} Array of festival names
 */
export function getFestivals(bengaliMonth, bengaliDay, bengaliYear = null, festivalsData = null) {
  const festivals = [];
  
  // Check year-specific festivals from JSON data (if available)
  if (bengaliYear && festivalsData && typeof festivalsData === 'object') {
    const yearKey = String(bengaliYear);
    const yearData = festivalsData[yearKey];
    if (yearData && typeof yearData === 'object') {
      const monthKey = String(bengaliMonth);
      const dayKey = String(bengaliDay);
      
      if (monthKey !== '_holidayTypes' && yearData[monthKey] && typeof yearData[monthKey] === 'object' && yearData[monthKey][dayKey]) {
        const dayFestivals = yearData[monthKey][dayKey];
        if (Array.isArray(dayFestivals)) {
          festivals.push(...dayFestivals);
        }
      }
    }
  }
  
  // Fall back to static list for festivals that don't vary by year
  const staticFestivals = BENGALI_FESTIVALS
    .filter(([m, d]) => m === bengaliMonth && d === bengaliDay)
    .map(([, , name]) => name);
  
  festivals.push(...staticFestivals);
  
  return festivals;
}

/**
 * Get holiday type for a Bengali date (public/sectional/state).
 * @returns {string|null} 'public'|'sectional'|'state'|null
 */
export function getHolidayType(bengaliMonth, bengaliDay, bengaliYear, festivalsData) {
  if (!bengaliYear || !festivalsData) return null;
  const yearData = festivalsData[String(bengaliYear)];
  if (!yearData?._holidayTypes) return null;
  const key = `${bengaliMonth}-${bengaliDay}`;
  return yearData._holidayTypes[key] || null;
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


