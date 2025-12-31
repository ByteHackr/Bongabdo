/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Bengali from './lib/bengaliCalendar.js';

/**
 * Bengali Calendar Extension for GNOME Shell
 * 
 * Displays Bengali calendar dates in the top panel with a popup menu showing
 * full date information, festivals, and a month calendar view.
 * 
 * @class BengaliCalendarExtension
 * @extends Extension
 */
export default class BengaliCalendarExtension extends Extension {
    /**
     * Initialize and enable the extension
     */
    enable() {
        try {
            this._settings = this.getSettings();
            if (!this._settings) {
                throw new Error('Failed to get settings');
            }
            
            // Load Bengali month start dates mapping based on location
            const location = this._settings.get_string('location');
            this._monthStarts = this._loadMonthStarts(location);

            this._createIndicator();
            if (!this._indicator) {
                throw new Error('Failed to create indicator');
            }

            this._addToPanel();
            this._updateDisplay();

            // Set up periodic update (every minute)
            this._updateIntervalId = GLib.timeout_add_seconds(
                GLib.PRIORITY_DEFAULT,
                60,
                () => {
                    try {
                        this._updateDisplay();
                    } catch (e) {
                        logError(e, 'Error in update interval');
                    }
                    return true;
                }
            );

            // Connect settings change signals
            this._settingsConnections = [
                this._settings.connect('changed::display-format', () => {
                    try {
                        this._updateDisplay();
                    } catch (e) {
                        logError(e, 'Error updating display format');
                    }
                }),
                this._settings.connect('changed::show-gregorian', () => {
                    try {
                        this._updateDisplay();
                    } catch (e) {
                        logError(e, 'Error updating Gregorian display');
                    }
                }),
                this._settings.connect('changed::show-festivals', () => {
                    try {
                        this._updateDisplay();
                    } catch (e) {
                        logError(e, 'Error updating festivals display');
                    }
                }),
                this._settings.connect('changed::use-bengali-numerals', () => {
                    try {
                        this._updateDisplay();
                    } catch (e) {
                        logError(e, 'Error updating numerals');
                    }
                }),
                this._settings.connect('changed::show-month-calendar', () => {
                    try {
                        this._updateDisplay();
                    } catch (e) {
                        logError(e, 'Error updating calendar');
                    }
                }),
                this._settings.connect('changed::location', () => {
                    try {
                        const location = this._settings.get_string('location');
                        this._monthStarts = this._loadMonthStarts(location);
                        this._updateDisplay();
                    } catch (e) {
                        logError(e, 'Error updating location');
                    }
                }),
                this._settings.connect('changed::font-size', () => {
                    try {
                        if (this._panelLabel) {
                            const fontSize = this._settings.get_int('font-size');
                            this._panelLabel.style = `font-size: ${fontSize}px;`;
                        }
                    } catch (e) {
                        logError(e, 'Error updating font size');
                    }
                }),
                this._settings.connect('changed::position', () => {
                    try {
                        this._repositionIndicator();
                    } catch (e) {
                        logError(e, 'Error repositioning indicator');
                    }
                }),
            ];
        } catch (e) {
            logError(e, 'Error enabling extension');
            throw e;
        }
    }

    /**
     * Create the panel indicator and popup menu
     * @private
     */
    _createIndicator() {
        try {
            this._indicator = new PanelMenu.Button(0.0, _('Bongabdo'), false);

            this._panelLabel = new St.Label({
                text: '',
                style_class: 'bengali-calendar-label',
            });

            const fontSize = this._settings?.get_int('font-size') || 14;
            this._panelLabel.style = `font-size: ${fontSize}px;`;

            this._indicator.add_child(this._panelLabel);

            // Popup menu structure
            const menu = this._indicator.menu;
            if (!menu) {
                throw new Error('Failed to get menu from indicator');
            }

            // Bengali date item
            this._bengaliDateItem = new PopupMenu.PopupMenuItem('', {
                reactive: false,
                can_focus: false,
            });
            this._bengaliDateItem.label.add_style_class_name('bengali-date-popup');
            menu.addMenuItem(this._bengaliDateItem);

            // Gregorian date item
            this._gregorianDateItem = new PopupMenu.PopupMenuItem('', {
                reactive: false,
                can_focus: false,
            });
            this._gregorianDateItem.label.add_style_class_name('gregorian-date-popup');
            this._gregorianDateItem.visible = false;
            menu.addMenuItem(this._gregorianDateItem);

            // Festivals section
            this._festivalsItem = new PopupMenu.PopupMenuItem('', {
                reactive: false,
                can_focus: false,
            });
            this._festivalsItem.label.add_style_class_name('festivals-popup');
            this._festivalsItem.visible = false;
            menu.addMenuItem(this._festivalsItem);

            // Calendar section
            this._calendarMenuItem = new PopupMenu.PopupMenuItem('', {
                reactive: false,
                can_focus: false,
            });
            this._calendarBox = null;
            menu.addMenuItem(this._calendarMenuItem);
        } catch (e) {
            logError(e, 'Error creating indicator');
            throw e;
        }
    }

    /**
     * Add indicator to the panel
     * @private
     */
    _addToPanel() {
        if (!this._indicator) {
            log('Bongabdo: Cannot add indicator to panel - indicator not created');
            return;
        }

        try {
            const positionSetting = this._settings?.get_string('position') || 'right';
            let panelBox = 'right';
            if (positionSetting === 'left') {
                panelBox = 'left';
            } else if (positionSetting === 'center') {
                panelBox = 'center';
            }
            
            Main.panel.addToStatusArea(this.uuid, this._indicator, 0, panelBox);
        } catch (e) {
            logError(e, 'Error adding indicator to panel');
        }
    }

    /**
     * Reposition indicator when position setting changes
     * @private
     */
    _repositionIndicator() {
        if (!this._indicator) {
            return;
        }

        try {
            const parent = this._indicator.get_parent();
            if (parent) {
                parent.remove_child(this._indicator);
            }
            this._addToPanel();
        } catch (e) {
            logError(e, 'Error repositioning indicator');
        }
    }

    /**
     * Load Bengali month start dates mapping from JSON file
     * 
     * @param {string} location - Location setting ('west-bengal', 'bangladesh', 'india')
     * @returns {Object|null} Month starts mapping object or null if not available
     * @private
     */
    _loadMonthStarts(location = 'west-bengal') {
        // Bangladesh uses fixed calendar (April 14 = Pohela Boishakh always)
        if (location === 'bangladesh') {
            return null;
        }
        
        // West Bengal and India use Surya Siddhanta (variable Sankranti dates)
        if (!this.dir) {
            log('Bongabdo: Extension directory not available');
            return null;
        }

        try {
            const libDir = this.dir.get_child('lib');
            if (!libDir) {
                log('Bongabdo: lib directory not found');
                return null;
            }

            const jsonFile = libDir.get_child('bengaliMonthStarts.json');
            if (!jsonFile) {
                log('Bongabdo: JSON file path not found');
                return null;
            }

            if (!jsonFile.query_exists(null)) {
                log('Bongabdo: Month starts JSON file does not exist, using heuristic');
                return null;
            }

            const [ok, contents] = jsonFile.load_contents(null);
            if (!ok || !contents) {
                log('Bongabdo: Failed to read month starts JSON file');
                return null;
            }

            const decoder = new TextDecoder('utf-8');
            const jsonText = decoder.decode(contents);
            if (!jsonText || jsonText.length === 0) {
                log('Bongabdo: Month starts JSON file is empty');
                return null;
            }

            const parsed = JSON.parse(jsonText);
            if (!parsed || typeof parsed !== 'object') {
                log('Bongabdo: Invalid JSON structure in month starts file');
                return null;
            }

            return parsed;
        } catch (e) {
            if (e instanceof SyntaxError) {
                log(`Bongabdo: JSON parse error in month starts file: ${e.message}`);
            } else {
                logError(e, 'Error loading month starts mapping');
            }
            return null;
        }
    }

    /**
     * Build and display the month calendar grid
     * 
     * @param {Object} bengaliDate - Bengali date object with month, day, year, monthName
     * @param {boolean} useBengaliNumerals - Whether to use Bengali numerals
     * @private
     */
    _buildMonthCalendar(bengaliDate, useBengaliNumerals) {
        if (!bengaliDate || typeof bengaliDate.month !== 'number' || typeof bengaliDate.day !== 'number') {
            log('Bongabdo: Invalid Bengali date provided to calendar builder');
            return;
        }

        // Remove old calendar if exists
        if (this._calendarBox) {
            try {
                this._calendarBox.destroy();
            } catch (e) {
                logError(e, 'Error destroying old calendar');
            }
            this._calendarBox = null;
        }

        const showCalendar = this._settings?.get_boolean('show-month-calendar') ?? true;
        if (!showCalendar || !this._calendarMenuItem) {
            if (this._calendarMenuItem) {
                this._calendarMenuItem.visible = false;
            }
            return;
        }

        try {
            this._calendarMenuItem.visible = true;

            // Create calendar container
            const box = new St.BoxLayout({
                vertical: true,
                style_class: 'bengali-calendar-grid'
            });

            // Month header
            const monthName = bengaliDate.monthName || '';
            const bengaliYear = bengaliDate.year || 0;
            const header = new St.Label({
                text: `${monthName} ${Bengali.formatNumber(bengaliYear, useBengaliNumerals)}`,
                style_class: 'bengali-calendar-header'
            });
            box.add_child(header);

            // Day names row
            const dayNamesRow = new St.BoxLayout({
                vertical: false,
                style_class: 'bengali-calendar-day-names-row'
            });
            const dayNames = ['র', 'সো', 'ম', 'বু', 'বৃ', 'শু', 'শ'];
            dayNames.forEach(day => {
                const label = new St.Label({
                    text: day,
                    style_class: 'bengali-calendar-day-name'
                });
                dayNamesRow.add_child(label);
            });
            box.add_child(dayNamesRow);

            // Get current month's dates
            const now = new Date();
            const year = now.getFullYear();
            const yearStr = String(year);
            const prevYearStr = String(year - 1);
            
            let yearData = null;
            if (this._monthStarts?.[yearStr]?.[String(bengaliDate.month)]) {
                yearData = this._monthStarts[yearStr];
            } else if (this._monthStarts?.[prevYearStr]?.[String(bengaliDate.month)]) {
                yearData = this._monthStarts[prevYearStr];
            }
            
            // Bangladesh fixed calendar calculation
            if (!yearData) {
                this._buildFixedCalendar(box, bengaliDate, year, useBengaliNumerals);
                return;
            }

            // West Bengal/India variable calendar (JSON mapping)
            this._buildVariableCalendar(box, bengaliDate, yearData, year, useBengaliNumerals);
        } catch (e) {
            logError(e, 'Error building month calendar');
            if (this._calendarMenuItem) {
                this._calendarMenuItem.visible = false;
            }
        }
    }

    /**
     * Build calendar for Bangladesh fixed calendar
     * @private
     */
    _buildFixedCalendar(box, bengaliDate, year, useBengaliNumerals) {
        try {
            const pohelaBoishakh = new Date(year, 3, 14);
            const monthLengths = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30];
            const bengaliYear = year - 593;
            const isLeapYear = (bengaliYear % 4 === 0 && bengaliYear % 100 !== 0) || (bengaliYear % 400 === 0);
            if (isLeapYear) {
                monthLengths[11] = 32;
            }
            
            let cumulativeDays = 0;
            for (let i = 0; i < bengaliDate.month; i++) {
                cumulativeDays += monthLengths[i];
            }
            
            const monthStart = new Date(pohelaBoishakh);
            monthStart.setDate(monthStart.getDate() + cumulativeDays);
            
            const daysInMonth = monthLengths[bengaliDate.month] || 30;
            const firstDayDate = new Date(monthStart);
            const firstDayOfWeek = firstDayDate.getDay();
            
            const grid = this._buildCalendarGrid(daysInMonth, firstDayOfWeek, bengaliDate.day, useBengaliNumerals);
            box.add_child(grid);
            this._calendarBox = box;
            
            this._updateCalendarMenuItem(box);
        } catch (e) {
            logError(e, 'Error building fixed calendar');
            throw e;
        }
    }

    /**
     * Build calendar for West Bengal/India variable calendar
     * @private
     */
    _buildVariableCalendar(box, bengaliDate, yearData, year, useBengaliNumerals) {
        try {
            const monthKey = String(bengaliDate.month);
            const nextMonthKey = String((bengaliDate.month + 1) % 12);
            const nextYearKey = bengaliDate.month === 11 ? String(year + 1) : String(year);
            
            const monthStartStr = yearData[monthKey];
            let nextMonthStartStr = yearData[nextMonthKey];
            
            if (bengaliDate.month === 11 && this._monthStarts?.[nextYearKey]?.['0']) {
                nextMonthStartStr = this._monthStarts[nextYearKey]['0'];
            }

            if (!monthStartStr || !nextMonthStartStr) {
                if (this._calendarMenuItem) {
                    this._calendarMenuItem.visible = false;
                }
                return;
            }

            const parseDate = (str) => {
                if (!str || typeof str !== 'string') {
                    throw new Error(`Invalid date string: ${str}`);
                }
                const parts = str.split('-');
                if (parts.length !== 3) {
                    throw new Error(`Invalid date format: ${str}`);
                }
                const [y, m, d] = parts.map(Number);
                if (isNaN(y) || isNaN(m) || isNaN(d)) {
                    throw new Error(`Invalid date numbers: ${str}`);
                }
                return new Date(y, m - 1, d);
            };

            const monthStart = parseDate(monthStartStr);
            const nextMonthStart = parseDate(nextMonthStartStr);
            const daysInMonth = Math.floor((nextMonthStart - monthStart) / (1000 * 60 * 60 * 24));
            
            if (daysInMonth < 1 || daysInMonth > 32) {
                log(`Bongabdo: Invalid days in month: ${daysInMonth}`);
                if (this._calendarMenuItem) {
                    this._calendarMenuItem.visible = false;
                }
                return;
            }

            const firstDayDate = new Date(monthStart);
            firstDayDate.setDate(firstDayDate.getDate() + 1);
            const firstDayOfWeek = firstDayDate.getDay();

            const grid = this._buildCalendarGrid(daysInMonth, firstDayOfWeek, bengaliDate.day, useBengaliNumerals);
            box.add_child(grid);
            this._calendarBox = box;
            
            this._updateCalendarMenuItem(box);
        } catch (e) {
            logError(e, 'Error building variable calendar');
            if (this._calendarMenuItem) {
                this._calendarMenuItem.visible = false;
            }
        }
    }

    /**
     * Build the calendar grid with days
     * 
     * @param {number} daysInMonth - Number of days in the month
     * @param {number} firstDayOfWeek - Day of week for first day (0=Sunday)
     * @param {number} currentDay - Current day of the month
     * @param {boolean} useBengaliNumerals - Whether to use Bengali numerals
     * @returns {St.BoxLayout} Calendar grid widget
     * @private
     */
    _buildCalendarGrid(daysInMonth, firstDayOfWeek, currentDay, useBengaliNumerals) {
        if (daysInMonth < 1 || daysInMonth > 32) {
            log(`Bongabdo: Invalid daysInMonth: ${daysInMonth}`);
            daysInMonth = 30; // Fallback
        }

        if (firstDayOfWeek < 0 || firstDayOfWeek > 6) {
            log(`Bongabdo: Invalid firstDayOfWeek: ${firstDayOfWeek}`);
            firstDayOfWeek = 0; // Fallback
        }

        const grid = new St.BoxLayout({ 
            vertical: true,
            style_class: 'bengali-calendar-weeks'
        });
        
        let day = 1;
        let weekRow = new St.BoxLayout({
            vertical: false,
            style_class: 'bengali-calendar-week-row'
        });
        
        // Empty cells for days before month starts
        for (let i = 0; i < firstDayOfWeek; i++) {
            const empty = new St.Label({ text: '', style_class: 'bengali-calendar-day empty' });
            weekRow.add_child(empty);
        }

        // Add days
        while (day <= daysInMonth) {
            if (weekRow.get_children().length === 7) {
                grid.add_child(weekRow);
                weekRow = new St.BoxLayout({
                    vertical: false,
                    style_class: 'bengali-calendar-week-row'
                });
            }

            const dayNum = Bengali.formatNumber(day, useBengaliNumerals);
            const isToday = (day === currentDay);
            const dayLabel = new St.Label({
                text: dayNum,
                style_class: isToday ? 'bengali-calendar-day today' : 'bengali-calendar-day'
            });
            weekRow.add_child(dayLabel);
            day++;
        }

        // Fill remaining week
        while (weekRow.get_children().length < 7) {
            const empty = new St.Label({ text: '', style_class: 'bengali-calendar-day empty' });
            weekRow.add_child(empty);
        }
        if (weekRow.get_children().length > 0) {
            grid.add_child(weekRow);
        }

        return grid;
    }

    /**
     * Update the calendar menu item with new calendar box
     * @private
     */
    _updateCalendarMenuItem(box) {
        if (!this._calendarMenuItem || !box) {
            return;
        }

        try {
            // Clear existing content
            const children = this._calendarMenuItem.get_children();
            if (children) {
                children.forEach(child => {
                    if (child && child !== this._calendarMenuItem.label) {
                        try {
                            this._calendarMenuItem.remove_child(child);
                        } catch (e) {
                            // Ignore errors when removing children
                        }
                    }
                });
            }
            
            if (this._calendarMenuItem.label) {
                this._calendarMenuItem.label.visible = false;
            }
            this._calendarMenuItem.add_child(box);
        } catch (e) {
            logError(e, 'Error updating calendar menu item');
        }
    }

    /**
     * Update the display with current date information
     * @private
     */
    _updateDisplay() {
        if (!this._settings || !this._panelLabel) {
            return;
        }

        try {
            const now = new Date();
            if (isNaN(now.getTime())) {
                log('Bongabdo: Invalid current date');
                return;
            }

            const bengaliDate = Bengali.gregorianToBengali(
                now.getFullYear(),
                now.getMonth() + 1,
                now.getDate(),
                this._monthStarts
            );

            if (!bengaliDate || typeof bengaliDate.month !== 'number') {
                log('Bongabdo: Invalid Bengali date returned');
                return;
            }

            const dayName = Bengali.BENGALI_DAYS[now.getDay()] || '';
            const displayFormat = this._settings.get_string('display-format') || 'full';
            const useBengaliNumerals = this._settings.get_boolean('use-bengali-numerals') ?? true;

            const panelText = Bengali.formatBengaliDate(
                bengaliDate,
                dayName,
                displayFormat,
                useBengaliNumerals
            );
            this._panelLabel.set_text(panelText || '');

            // Update Bengali date display
            if (this._bengaliDateItem?.label) {
                const fullDate = Bengali.formatBengaliDate(bengaliDate, dayName, 'full', useBengaliNumerals);
                this._bengaliDateItem.label.set_text(fullDate || '');
            }

            // Update Gregorian date
            const showGregorian = this._settings.get_boolean('show-gregorian') ?? false;
            if (this._gregorianDateItem) {
                this._gregorianDateItem.visible = showGregorian;
                if (showGregorian && this._gregorianDateItem.label) {
                    try {
                        const gregorianDateStr = now.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        });
                        this._gregorianDateItem.label.set_text(gregorianDateStr || '');
                    } catch (e) {
                        logError(e, 'Error formatting Gregorian date');
                    }
                }
            }

            // Update festivals
            const showFestivals = this._settings.get_boolean('show-festivals') ?? true;
            if (this._festivalsItem) {
                const festivals = showFestivals ? Bengali.getFestivals(bengaliDate.month, bengaliDate.day) : [];
                if (showFestivals && festivals.length > 0 && this._festivalsItem.label) {
                    this._festivalsItem.label.set_text(festivals.join(', '));
                    this._festivalsItem.visible = true;
                } else {
                    this._festivalsItem.visible = false;
                }
            }

            // Update month calendar
            this._buildMonthCalendar(bengaliDate, useBengaliNumerals);
        } catch (e) {
            logError(e, 'Error updating display');
        }
    }

    /**
     * Clean up and disable the extension
     */
    disable() {
        // Disconnect all settings signals
        if (this._settingsConnections && this._settings) {
            try {
                this._settingsConnections.forEach(id => {
                    try {
                        this._settings.disconnect(id);
                    } catch (e) {
                        // Ignore errors when disconnecting
                    }
                });
            } catch (e) {
                logError(e, 'Error disconnecting settings');
            }
            this._settingsConnections = null;
        }

        // Remove update interval
        if (this._updateIntervalId) {
            try {
                GLib.source_remove(this._updateIntervalId);
            } catch (e) {
                logError(e, 'Error removing update interval');
            }
            this._updateIntervalId = null;
        }

        // Destroy calendar box
        if (this._calendarBox) {
            try {
                this._calendarBox.destroy();
            } catch (e) {
                logError(e, 'Error destroying calendar box');
            }
            this._calendarBox = null;
        }

        // Destroy indicator
        if (this._indicator) {
            try {
                this._indicator.destroy();
            } catch (e) {
                logError(e, 'Error destroying indicator');
            }
            this._indicator = null;
        }

        // Clear all references
        this._panelLabel = null;
        this._bengaliDateItem = null;
        this._gregorianDateItem = null;
        this._festivalsItem = null;
        this._calendarMenuItem = null;
        this._settings = null;
        this._monthStarts = null;
    }
}

/**
 * Log error with context
 * @param {Error} error - Error object
 * @param {string} context - Context description
 */
function logError(error, context) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    log(`Bongabdo [${context}]: ${message}${stack ? '\n' + stack : ''}`);
}
