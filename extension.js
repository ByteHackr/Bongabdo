/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Bengali from './lib/bengaliCalendar.js';
import { buildMonthMatrix } from './lib/monthMatrix.js';

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
            // Calendar popup state
            this._calendarMonthOffset = 0;
            this._lastBengaliDate = null;
            this._lastUseBengaliNumerals = true;
            this._menuOpenSignalId = 0;

            this._createIndicator();
            if (!this._indicator) {
                throw new Error('Failed to create indicator');
            }

            this._addToPanel();
            this._updateDisplay();

            // Reset calendar navigation when opening the menu
            if (this._indicator?.menu) {
                this._menuOpenSignalId = this._indicator.menu.connect('open-state-changed', (_menu, isOpen) => {
                    if (!isOpen)
                        return;
                    this._calendarMonthOffset = 0;
                    if (this._lastBengaliDate)
                        this._buildMonthCalendar(this._lastBengaliDate, this._lastUseBengaliNumerals);
                });
            }

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
            // Visually center the label inside the top bar.
            // (Without this, some fonts can look "stuck" to the top due to baseline metrics.)
            this._panelLabel.y_align = Clutter.ActorAlign.CENTER;
            this._panelLabel.y_expand = true;

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
            // Ensure the label can take full row width so CSS `text-align: center` works.
            this._bengaliDateItem.label.x_expand = true;
            // Center align - CSS handles text-align: center
            // x_align is set via CSS or can be set programmatically if needed
            menu.addMenuItem(this._bengaliDateItem);

            // Gregorian date item
            this._gregorianDateItem = new PopupMenu.PopupMenuItem('', {
                reactive: false,
                can_focus: false,
            });
            this._gregorianDateItem.label.add_style_class_name('gregorian-date-popup');
            this._gregorianDateItem.label.x_expand = true;
            // Center align - CSS handles text-align: center
            this._gregorianDateItem.visible = false;
            menu.addMenuItem(this._gregorianDateItem);

            // Festivals section
            this._festivalsItem = new PopupMenu.PopupMenuItem('', {
                reactive: false,
                can_focus: false,
            });
            this._festivalsItem.label.add_style_class_name('festivals-popup');
            this._festivalsItem.label.x_expand = true;
            // Center align - CSS handles text-align: center
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
            // Register in status area once; then we manually move the indicator container
            // between panel boxes for reliable positioning across Shell versions.
            Main.panel.addToStatusArea(this.uuid, this._indicator, 0, 'right');
            this._repositionIndicator();
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
            const positionSetting = this._settings?.get_string('position') || 'right';

            // `addToStatusArea()` inserts the *container* into the panel boxes.
            const container = this._indicator.container ?? this._indicator;
            const parent = container?.get_parent?.();
            if (parent) {
                parent.remove_child(container);
            }

            let targetBox = Main.panel?._rightBox;
            if (positionSetting === 'left')
                targetBox = Main.panel?._leftBox;
            else if (positionSetting === 'center')
                targetBox = Main.panel?._centerBox;

            if (!targetBox?.insert_child_at_index) {
                // Fallback to original API if private boxes are unavailable.
                Main.panel.addToStatusArea(this.uuid, this._indicator, 0, positionSetting);
                return;
            }

            // Put it at the start of that box (left-most within that box).
            targetBox.insert_child_at_index(container, 0);
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

        this._lastBengaliDate = bengaliDate;
        this._lastUseBengaliNumerals = !!useBengaliNumerals;

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

            const view = this._computeMonthView(bengaliDate);
            if (!view) {
                this._calendarMenuItem.visible = false;
                return;
            }

            const box = this._renderMonthView(view, useBengaliNumerals);
            this._calendarBox = box;
            this._updateCalendarMenuItem(box);
        } catch (e) {
            logError(e, 'Error building month calendar');
            if (this._calendarMenuItem) {
                this._calendarMenuItem.visible = false;
            }
        }
    }

    _computeMonthView(bengaliDate) {
        const offset = Number(this._calendarMonthOffset || 0);
        const baseMonth = bengaliDate.month;
        const baseYear = bengaliDate.year || 0;

        let month = baseMonth + offset;
        let year = baseYear;
        while (month < 0) {
            month += 12;
            year -= 1;
        }
        while (month > 11) {
            month -= 12;
            year += 1;
        }

        const location = this._settings?.get_string('location') || 'west-bengal';
        const monthName = Bengali.BENGALI_MONTHS?.[month] || bengaliDate.monthName || '';
        const todayDay = offset === 0 ? bengaliDate.day : 0;

        if (location === 'bangladesh') {
            const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
            const monthLengths = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30];
            if (isLeapYear)
                monthLengths[11] = 32;

            const daysInMonth = monthLengths[month] || 30;
            const pohelaBoishakhGregorianYear = year + 593;
            const pohelaBoishakh = new Date(pohelaBoishakhGregorianYear, 3, 14);

            let cumulativeDays = 0;
            for (let i = 0; i < month; i++)
                cumulativeDays += monthLengths[i];

            const monthStart = new Date(pohelaBoishakh);
            monthStart.setDate(monthStart.getDate() + cumulativeDays);
            const firstDayOfWeek = monthStart.getDay();

            const prevMonthIndex = (month + 11) % 12;
            const prevMonthYear = month === 0 ? year - 1 : year;
            const prevLeap = (prevMonthYear % 4 === 0 && prevMonthYear % 100 !== 0) || (prevMonthYear % 400 === 0);
            const prevMonthLengths = [...monthLengths];
            if (prevLeap)
                prevMonthLengths[11] = 32;
            const prevMonthDays = prevMonthLengths[prevMonthIndex] || 30;

            return { month, year, monthName, daysInMonth, firstDayOfWeek, prevMonthDays, todayDay };
        }

        // West Bengal/India mapping-based view (best-effort)
        const anchor = new Date();
        try {
            anchor.setMonth(anchor.getMonth() + offset);
        } catch (e) {
            // ignore
        }

        const anchorYear = anchor.getFullYear();
        const tryYears = [String(anchorYear), String(anchorYear - 1), String(anchorYear + 1)];
        const monthKey = String(month);
        const nextMonthKey = String((month + 1) % 12);
        const prevMonthKey = String((month + 11) % 12);

        let yearData = null;
        let yearKeyUsed = null;
        for (const y of tryYears) {
            if (this._monthStarts?.[y]?.[monthKey]) {
                yearData = this._monthStarts[y];
                yearKeyUsed = y;
                break;
            }
        }

        if (!yearData) {
            const firstDayOfWeek = (new Date(anchor.getFullYear(), anchor.getMonth(), 1)).getDay();
            return { month, year, monthName, daysInMonth: 30, firstDayOfWeek, prevMonthDays: 30, todayDay };
        }

        const parseDate = (str) => {
            const parts = String(str).split('-');
            const [y, m, d] = parts.map(Number);
            return new Date(y, m - 1, d);
        };

        const monthStartStr = yearData[monthKey];
        let nextMonthStartStr = yearData[nextMonthKey];

        if (month === 11) {
            const nextYearKey = String(Number(yearKeyUsed) + 1);
            if (this._monthStarts?.[nextYearKey]?.['0'])
                nextMonthStartStr = this._monthStarts[nextYearKey]['0'];
        }

        if (!monthStartStr || !nextMonthStartStr)
            return { month, year, monthName, daysInMonth: 30, firstDayOfWeek: 0, prevMonthDays: 30, todayDay };

        const monthStart = parseDate(monthStartStr);
        const nextMonthStart = parseDate(nextMonthStartStr);
        const daysInMonthRaw = Math.floor((nextMonthStart - monthStart) / (1000 * 60 * 60 * 24));
        const daysInMonth = Math.max(1, Math.min(daysInMonthRaw || 30, 32));

        const day1Date = new Date(monthStart);
        day1Date.setDate(day1Date.getDate() + 1);
        const firstDayOfWeek = day1Date.getDay();

        let prevMonthDays = 30;
        try {
            let prevMonthStartStr = yearData[prevMonthKey];
            if (month === 0) {
                const prevYearKey = String(Number(yearKeyUsed) - 1);
                if (this._monthStarts?.[prevYearKey]?.['11'])
                    prevMonthStartStr = this._monthStarts[prevYearKey]['11'];
            }
            if (prevMonthStartStr) {
                const prevMonthStart = parseDate(prevMonthStartStr);
                const prevDaysRaw = Math.floor((monthStart - prevMonthStart) / (1000 * 60 * 60 * 24));
                prevMonthDays = Math.max(1, Math.min(prevDaysRaw || 30, 32));
            }
        } catch (e) {
            // ignore
        }

        return { month, year, monthName, daysInMonth, firstDayOfWeek, prevMonthDays, todayDay };
    }

    _renderMonthView(view, useBengaliNumerals) {
        const box = new St.BoxLayout({
            vertical: true,
            style_class: 'bongabdo-calendar',
        });

        const headerRow = new St.BoxLayout({
            vertical: false,
            style_class: 'bongabdo-calendar-header-row',
        });

        const mkNavButton = (iconName, onClick) => {
            const btn = new St.Button({
                reactive: true,
                can_focus: true,
                track_hover: true,
                style_class: 'bongabdo-calendar-nav-button',
                child: new St.Icon({
                    icon_name: iconName,
                    style_class: 'popup-menu-icon',
                }),
            });
            btn.connect('clicked', () => {
                try {
                    onClick();
                } catch (e) {
                    logError(e, 'Error handling calendar navigation');
                }
            });
            return btn;
        };

        headerRow.add_child(mkNavButton('go-previous-symbolic', () => {
            this._calendarMonthOffset = Number(this._calendarMonthOffset || 0) - 1;
            if (this._lastBengaliDate)
                this._buildMonthCalendar(this._lastBengaliDate, this._lastUseBengaliNumerals);
        }));

        const headerLabel = new St.Label({
            text: `${view.monthName} ${Bengali.formatNumber(view.year, useBengaliNumerals)}`,
            style_class: 'bongabdo-calendar-header-label',
        });
        headerLabel.x_expand = true;
        headerRow.add_child(headerLabel);

        headerRow.add_child(mkNavButton('go-next-symbolic', () => {
            this._calendarMonthOffset = Number(this._calendarMonthOffset || 0) + 1;
            if (this._lastBengaliDate)
                this._buildMonthCalendar(this._lastBengaliDate, this._lastUseBengaliNumerals);
        }));

        box.add_child(headerRow);

        const dayNamesRow = new St.BoxLayout({
            vertical: false,
            style_class: 'bongabdo-calendar-day-names-row',
        });
        const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        dayNames.forEach(d => {
            dayNamesRow.add_child(new St.Label({
                text: d,
                style_class: 'bongabdo-calendar-day-name',
            }));
        });
        box.add_child(dayNamesRow);

        const cells = buildMonthMatrix({
            daysInMonth: view.daysInMonth,
            firstDayOfWeek: view.firstDayOfWeek,
            prevMonthDays: view.prevMonthDays,
        });

        const weeksBox = new St.BoxLayout({
            vertical: true,
            style_class: 'bongabdo-calendar-weeks',
        });

        for (let r = 0; r < 6; r++) {
            const row = new St.BoxLayout({
                vertical: false,
                style_class: 'bongabdo-calendar-week-row',
            });
            for (let c = 0; c < 7; c++) {
                const cell = cells[r * 7 + c];
                const inMonth = !!cell.inMonth;
                const dayNum = cell.day || 0;
                const isToday = inMonth && view.todayDay && (dayNum === view.todayDay) && (Number(this._calendarMonthOffset || 0) === 0);

                const text = dayNum ? Bengali.formatNumber(dayNum, useBengaliNumerals) : '';
                const style = [
                    'bongabdo-calendar-day',
                    inMonth ? '' : 'other-month',
                    isToday ? 'today' : '',
                ].filter(Boolean).join(' ');

                row.add_child(new St.Label({ text, style_class: style }));
            }
            weeksBox.add_child(row);
        }

        box.add_child(weeksBox);
        return box;
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

        if (this._menuOpenSignalId && this._indicator?.menu) {
            try {
                this._indicator.menu.disconnect(this._menuOpenSignalId);
            } catch (e) {
                // ignore
            }
            this._menuOpenSignalId = 0;
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
        this._calendarMonthOffset = 0;
        this._lastBengaliDate = null;
        this._lastUseBengaliNumerals = true;

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
