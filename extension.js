/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* exported init */

const { St, Clutter, GLib, Gio } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

// Extension imports
const ExtensionUtils = imports.misc.extensionUtils;

// Bengali month names
const BENGALI_MONTHS = [
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

// Bengali day names
const BENGALI_DAYS = [
    'রবিবার',    // Sunday
    'সোমবার',    // Monday
    'মঙ্গলবার',  // Tuesday
    'বুধবার',    // Wednesday
    'বৃহস্পতিবার', // Thursday
    'শুক্রবার',   // Friday
    'শনিবার'     // Saturday
];

// Bengali numerals (0-9)
const BENGALI_NUMERALS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

// Bengali festivals and holidays (month, day, name)
const BENGALI_FESTIVALS = [
    [0, 1, 'পহেলা বৈশাখ'],           // Pohela Boishakh
    [0, 15, 'রবীন্দ্রনাথ ঠাকুরের জন্মদিন'], // Rabindranath Tagore's Birthday
    [0, 25, 'কাজী নজরুল ইসলামের জন্মদিন'], // Kazi Nazrul Islam's Birthday
    [1, 15, 'বিশ্ব পরিবেশ দিবস'],
    [2, 1, 'আষাঢ়ের প্রথম দিন'],
    [3, 15, 'শ্রাবণ সংক্রান্তি'],
    [4, 1, 'ভাদ্রের প্রথম দিন'],
    [5, 1, 'আশ্বিনের প্রথম দিন'],
    [5, 15, 'দুর্গা পূজা শুরু'],      // Durga Puja begins
    [5, 20, 'দুর্গা পূজা'],           // Durga Puja
    [6, 1, 'কার্তিকের প্রথম দিন'],
    [6, 15, 'কালী পূজা'],             // Kali Puja
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
    [11, 30, 'চৈত্র সংক্রান্তি'],     // Last day of Bengali year
];

// Convert number to Bengali numerals
function toBengaliNumerals(num) {
    return num.toString().split('').map(digit => BENGALI_NUMERALS[parseInt(digit)]).join('');
}

// Format number based on settings
function formatNumber(num, useBengaliNumerals) {
    return useBengaliNumerals ? toBengaliNumerals(num) : num.toString();
}

// More accurate Bengali New Year calculation
function getBengaliNewYearDate(gregorianYear) {
    // Bengali New Year (Pohela Boishakh) typically falls on April 14 or 15
    // It's based on the solar calendar. We'll use April 14 as standard,
    // but check for April 15 in certain years (when solar new year is later)
    
    // A more accurate calculation would use actual solar position,
    // but for most practical purposes, April 14 works, with April 15
    // occurring occasionally (roughly every 4-5 years)
    
    const april14 = new Date(gregorianYear, 3, 14);
    const april15 = new Date(gregorianYear, 3, 15);
    
    // Simple heuristic: April 15 occurs when the year mod 4 is 2 or 3
    // This is a simplification - actual calculation requires solar position
    if ((gregorianYear % 4 === 2 || gregorianYear % 4 === 3) && 
        gregorianYear > 2000 && gregorianYear < 2100) {
        // Some years use April 15, but this needs refinement
        return april14; // Default to April 14 for now
    }
    
    return april14;
}

// Convert Gregorian date to Bengali date
function gregorianToBengali(year, month, day) {
    const gregorianDate = new Date(year, month - 1, day);
    
    // Find the Bengali New Year for the current Gregorian year
    const currentYearNewYear = getBengaliNewYearDate(year);
    const prevYearNewYear = getBengaliNewYearDate(year - 1);
    
    let bengaliYear;
    let yearStart;
    
    // Determine which Bengali year this date belongs to
    if (gregorianDate >= currentYearNewYear) {
        // Date is in the Bengali year that started this Gregorian year
        bengaliYear = year - 593; // Approximate: Bengali year = Gregorian year - 593
        yearStart = currentYearNewYear;
    } else {
        // Date is in the Bengali year that started last Gregorian year
        bengaliYear = year - 1 - 593;
        yearStart = prevYearNewYear;
    }
    
    // Calculate days since Bengali New Year
    const daysSinceNewYear = Math.floor((gregorianDate - yearStart) / (1000 * 60 * 60 * 24));
    
    // Bengali month lengths
    const monthLengths = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30];
    
    // Check if Bengali year is a leap year (Choitro has 31 days)
    const isLeapYear = (bengaliYear % 4 === 0 && bengaliYear % 100 !== 0) || 
                       (bengaliYear % 400 === 0);
    
    if (isLeapYear) {
        monthLengths[11] = 31; // Choitro has 31 days in leap year
    }
    
    // Find which month and day
    let bengaliMonth = 0;
    let bengaliDay = daysSinceNewYear + 1;
    
    for (let i = 0; i < monthLengths.length; i++) {
        if (bengaliDay <= monthLengths[i]) {
            bengaliMonth = i;
            break;
        }
        bengaliDay -= monthLengths[i];
    }
    
    // Ensure valid day
    if (bengaliDay < 1) {
        bengaliDay = 1;
    }
    if (bengaliDay > monthLengths[bengaliMonth]) {
        bengaliDay = monthLengths[bengaliMonth];
    }
    
    return {
        year: bengaliYear,
        month: bengaliMonth,
        day: bengaliDay,
        monthName: BENGALI_MONTHS[bengaliMonth]
    };
}

// Get festivals for a given Bengali date
function getFestivals(bengaliMonth, bengaliDay) {
    return BENGALI_FESTIVALS.filter(festival => 
        festival[0] === bengaliMonth && festival[1] === bengaliDay
    ).map(festival => festival[2]);
}

// Format date based on display format setting
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

let bengaliCalendarIndicator;
let settings;

function init() {
    // Initialize settings
    settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.bengali-calendar');
}

function enable() {
    // Create indicator
    const position = settings.get_string('position') === 'left' ? 0.0 : 1.0;
    bengaliCalendarIndicator = new PanelMenu.Button(position, 'Bengali Calendar', false);
    
    // Create label for Bengali date
    const label = new St.Label({
        text: '',
        style_class: 'bengali-calendar-label'
    });
    
    // Apply font size from settings
    const fontSize = settings.get_int('font-size');
    label.style = `font-size: ${fontSize}pt;`;
    
    bengaliCalendarIndicator.add_child(label);
    
    // Create popup menu
    const menu = bengaliCalendarIndicator.menu;
    
    // Bengali date section
    const bengaliDateSection = new PopupMenu.PopupMenuSection();
    const bengaliDateLabel = new St.Label({
        text: '',
        style_class: 'bengali-date-popup'
    });
    bengaliDateSection.addActor(bengaliDateLabel);
    menu.addMenuItem(new PopupMenu.PopupBaseMenuItem({ activate: false }));
    menu.addMenuItem(new PopupMenu.PopupBaseMenuItem({ 
        child: bengaliDateSection,
        reactive: false 
    }));
    
    // Gregorian date section (if enabled)
    const gregorianDateLabel = new St.Label({
        text: '',
        style_class: 'gregorian-date-popup'
    });
    const gregorianDateSection = new PopupMenu.PopupMenuSection();
    gregorianDateSection.addActor(gregorianDateLabel);
    
    // Festivals section
    const festivalsLabel = new St.Label({
        text: '',
        style_class: 'festivals-popup'
    });
    const festivalsSection = new PopupMenu.PopupMenuSection();
    festivalsSection.addActor(festivalsLabel);
    
    // Update function
    function updateDisplay() {
        const now = new Date();
        const bengaliDate = gregorianToBengali(
            now.getFullYear(),
            now.getMonth() + 1,
            now.getDate()
        );
        
        const dayName = BENGALI_DAYS[now.getDay()];
        const displayFormat = settings.get_string('display-format');
        const useBengaliNumerals = settings.get_boolean('use-bengali-numerals');
        
        // Update panel label
        const panelText = formatBengaliDate(bengaliDate, dayName, displayFormat, useBengaliNumerals);
        label.set_text(panelText);
        
        // Update popup menu
        const fullDate = formatBengaliDate(bengaliDate, dayName, 'full', useBengaliNumerals);
        bengaliDateLabel.set_text(`📅 ${fullDate}`);
        
        // Update Gregorian date if enabled
        if (settings.get_boolean('show-gregorian')) {
            const gregorianDateStr = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            gregorianDateLabel.set_text(`🌍 ${gregorianDateStr}`);
            if (!menu._gregorianAdded) {
                menu.addMenuItem(new PopupMenu.PopupBaseMenuItem({ 
                    child: gregorianDateSection,
                    reactive: false 
                }));
                menu._gregorianAdded = true;
            }
            gregorianDateSection.visible = true;
        } else {
            if (menu._gregorianAdded) {
                gregorianDateSection.visible = false;
            }
        }
        
        // Update festivals if enabled
        if (settings.get_boolean('show-festivals')) {
            const festivals = getFestivals(bengaliDate.month, bengaliDate.day);
            if (festivals.length > 0) {
                festivalsLabel.set_text(`🎉 ${festivals.join(', ')}`);
                if (!menu._festivalsAdded) {
                    menu.addMenuItem(new PopupMenu.PopupBaseMenuItem({ 
                        child: festivalsSection,
                        reactive: false 
                    }));
                    menu._festivalsAdded = true;
                }
                festivalsSection.visible = true;
            } else {
                if (menu._festivalsAdded) {
                    festivalsSection.visible = false;
                }
            }
        } else {
            if (menu._festivalsAdded) {
                festivalsSection.visible = false;
            }
        }
    }
    
    // Update immediately
    updateDisplay();
    
    // Update every minute
    const updateInterval = GLib.timeout_add_seconds(
        GLib.PRIORITY_DEFAULT,
        60,
        () => {
            updateDisplay();
            return true;
        }
    );
    
    // Store interval ID for cleanup
    bengaliCalendarIndicator._updateInterval = updateInterval;
    
    // Connect settings changes
    bengaliCalendarIndicator._settingsConnections = [
        settings.connect('changed::display-format', updateDisplay),
        settings.connect('changed::show-gregorian', updateDisplay),
        settings.connect('changed::show-festivals', updateDisplay),
        settings.connect('changed::use-bengali-numerals', updateDisplay),
        settings.connect('changed::font-size', () => {
            const fontSize = settings.get_int('font-size');
            label.style = `font-size: ${fontSize}pt;`;
        }),
        settings.connect('changed::position', () => {
            // Note: Position change requires extension reload
            updateDisplay();
        })
    ];
    
    // Add to panel
    Main.panel.addToStatusArea('bengali-calendar', bengaliCalendarIndicator);
}

function disable() {
    if (bengaliCalendarIndicator) {
        // Disconnect settings signals
        if (bengaliCalendarIndicator._settingsConnections) {
            bengaliCalendarIndicator._settingsConnections.forEach(conn => {
                settings.disconnect(conn);
            });
        }
        
        // Remove timeout if exists
        if (bengaliCalendarIndicator._updateInterval) {
            GLib.source_remove(bengaliCalendarIndicator._updateInterval);
        }
        
        bengaliCalendarIndicator.destroy();
        bengaliCalendarIndicator = null;
    }
}
