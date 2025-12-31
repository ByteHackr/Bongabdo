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

export default class BengaliCalendarExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        
        // Load Bengali month start dates mapping based on location
        const location = this._settings.get_string('location');
        this._monthStarts = this._loadMonthStarts(location);

        this._createIndicator();
        this._addToPanel();
        this._updateDisplay();

        this._updateIntervalId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            60,
            () => {
                this._updateDisplay();
                return true;
            }
        );

        this._settingsConnections = [
            this._settings.connect('changed::display-format', () => this._updateDisplay()),
            this._settings.connect('changed::show-gregorian', () => this._updateDisplay()),
            this._settings.connect('changed::show-festivals', () => this._updateDisplay()),
            this._settings.connect('changed::use-bengali-numerals', () => this._updateDisplay()),
            this._settings.connect('changed::show-month-calendar', () => this._updateDisplay()),
            this._settings.connect('changed::location', () => {
                const location = this._settings.get_string('location');
                this._monthStarts = this._loadMonthStarts(location);
                this._updateDisplay();
            }),
            this._settings.connect('changed::font-size', () => {
                const fontSize = this._settings.get_int('font-size');
                this._panelLabel.style = `font-size: ${fontSize}px;`;
            }),
            this._settings.connect('changed::position', () => {
                this._repositionIndicator();
            }),
        ];
    }

    _createIndicator() {
        this._indicator = new PanelMenu.Button(0.0, _('Bongabdo'), false);

        this._panelLabel = new St.Label({
            text: '',
            style_class: 'bengali-calendar-label',
        });

        const fontSize = this._settings.get_int('font-size');
        this._panelLabel.style = `font-size: ${fontSize}px;`;

        this._indicator.add_child(this._panelLabel);

        // Popup menu structure
        const menu = this._indicator.menu;

        // Date section
        const dateSection = new PopupMenu.PopupMenuSection();
        menu.addMenuItem(new PopupMenu.PopupBaseMenuItem({
            child: dateSection,
            reactive: false
        }));

        this._bengaliDateItem = new PopupMenu.PopupMenuItem('', {
            reactive: false,
            can_focus: false,
        });
        this._bengaliDateItem.label.add_style_class_name('bengali-date-popup');
        dateSection.addMenuItem(this._bengaliDateItem);

        this._gregorianDateItem = new PopupMenu.PopupMenuItem('', {
            reactive: false,
            can_focus: false,
        });
        this._gregorianDateItem.label.add_style_class_name('gregorian-date-popup');
        this._gregorianDateItem.visible = false;
        dateSection.addMenuItem(this._gregorianDateItem);

        // Festivals section (with separator)
        this._festivalsItem = new PopupMenu.PopupMenuItem('', {
            reactive: false,
            can_focus: false,
        });
        this._festivalsItem.label.add_style_class_name('festivals-popup');
        this._festivalsItem.visible = false;
        menu.addMenuItem(this._festivalsItem);

        // Calendar section (with separator)
        this._calendarMenuItem = new PopupMenu.PopupMenuItem('', {
            reactive: false,
            can_focus: false,
        });
        this._calendarBox = null;
        menu.addMenuItem(this._calendarMenuItem);
    }

    _addToPanel() {
        const positionSetting = this._settings.get_string('position');
        let panelBox = 'right';
        if (positionSetting === 'left') {
            panelBox = 'left';
        } else if (positionSetting === 'center') {
            panelBox = 'center';
        }
        
        Main.panel.addToStatusArea(this.uuid, this._indicator, 0, panelBox);
    }

    _repositionIndicator() {
        if (this._indicator && this._indicator.get_parent()) {
            this._indicator.get_parent().remove_child(this._indicator);
        }
        this._addToPanel();
    }

    _loadMonthStarts(location = 'west-bengal') {
        // Bangladesh uses fixed calendar (April 14 = Pohela Boishakh always)
        if (location === 'bangladesh') {
            return null;
        }
        
        // West Bengal and India use Surya Siddhanta (variable Sankranti dates)
        try {
            const jsonFile = this.dir.get_child('lib').get_child('bengaliMonthStarts.json');
            if (jsonFile.query_exists(null)) {
                const [ok, contents] = jsonFile.load_contents(null);
                if (ok) {
                    const decoder = new TextDecoder();
                    const jsonText = decoder.decode(contents);
                    return JSON.parse(jsonText);
                }
            }
        } catch (e) {
            log(`Bongabdo: Failed to load month starts mapping: ${e.message}`);
        }
        
        return null;
    }

    _buildMonthCalendar(bengaliDate, useBengaliNumerals) {
        // Remove old calendar if exists
        if (this._calendarBox) {
            this._calendarBox.destroy();
            this._calendarBox = null;
        }

        const showCalendar = this._settings.get_boolean('show-month-calendar');
        if (!showCalendar) {
            this._calendarMenuItem.visible = false;
            return;
        }

        this._calendarMenuItem.visible = true;

        // Create calendar container
        const box = new St.BoxLayout({
            vertical: true,
            style_class: 'bengali-calendar-grid'
        });

        // Month header
        const header = new St.Label({
            text: `${bengaliDate.monthName} ${Bengali.formatNumber(bengaliDate.year, useBengaliNumerals)}`,
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
        if (this._monthStarts?.[yearStr] && this._monthStarts[yearStr][String(bengaliDate.month)]) {
            yearData = this._monthStarts[yearStr];
        } else if (this._monthStarts?.[prevYearStr] && this._monthStarts[prevYearStr][String(bengaliDate.month)]) {
            yearData = this._monthStarts[prevYearStr];
        }
        
        // Bangladesh fixed calendar calculation
        if (!yearData) {
            const pohelaBoishakh = new Date(year, 3, 14);
            const monthLengths = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30];
            const bengaliYear = year - 593;
            const isLeapYear = (bengaliYear % 4 === 0 && bengaliYear % 100 !== 0) || (bengaliYear % 400 === 0);
            if (isLeapYear) monthLengths[11] = 32;
            
            let cumulativeDays = 0;
            for (let i = 0; i < bengaliDate.month; i++) {
                cumulativeDays += monthLengths[i];
            }
            
            const monthStart = new Date(pohelaBoishakh);
            monthStart.setDate(monthStart.getDate() + cumulativeDays);
            
            const daysInMonth = monthLengths[bengaliDate.month];
            const firstDayDate = new Date(monthStart);
            const firstDayOfWeek = firstDayDate.getDay();
            
            const grid = this._buildCalendarGrid(daysInMonth, firstDayOfWeek, bengaliDate.day, useBengaliNumerals);
            box.add_child(grid);
            this._calendarBox = box;
            
            this._updateCalendarMenuItem(box);
            return;
        }

        // West Bengal/India variable calendar (JSON mapping)
        const monthKey = String(bengaliDate.month);
        const nextMonthKey = String((bengaliDate.month + 1) % 12);
        const nextYearKey = bengaliDate.month === 11 ? String(year + 1) : yearStr;
        
        const monthStartStr = yearData[monthKey];
        let nextMonthStartStr = yearData[nextMonthKey];
        
        if (bengaliDate.month === 11 && this._monthStarts?.[nextYearKey]?.['0']) {
            nextMonthStartStr = this._monthStarts[nextYearKey]['0'];
        }

        if (!monthStartStr || !nextMonthStartStr) {
            this._calendarMenuItem.visible = false;
            return;
        }

        const parseDate = (str) => {
            const [y, m, d] = str.split('-').map(Number);
            return new Date(y, m - 1, d);
        };

        const monthStart = parseDate(monthStartStr);
        const nextMonthStart = parseDate(nextMonthStartStr);
        const daysInMonth = Math.floor((nextMonthStart - monthStart) / (1000 * 60 * 60 * 24));
        const firstDayDate = new Date(monthStart);
        firstDayDate.setDate(firstDayDate.getDate() + 1);
        const firstDayOfWeek = firstDayDate.getDay();

        const grid = this._buildCalendarGrid(daysInMonth, firstDayOfWeek, bengaliDate.day, useBengaliNumerals);
        box.add_child(grid);
        this._calendarBox = box;
        
        this._updateCalendarMenuItem(box);
    }

    _buildCalendarGrid(daysInMonth, firstDayOfWeek, currentDay, useBengaliNumerals) {
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

    _updateCalendarMenuItem(box) {
        // Clear existing content and add calendar
        const children = this._calendarMenuItem.get_children();
        children.forEach(child => {
            if (child !== this._calendarMenuItem.label) {
                this._calendarMenuItem.remove_child(child);
            }
        });
        this._calendarMenuItem.label.visible = false;
        this._calendarMenuItem.add_child(box);
    }

    _updateDisplay() {
        const now = new Date();
        const bengaliDate = Bengali.gregorianToBengali(
            now.getFullYear(),
            now.getMonth() + 1,
            now.getDate(),
            this._monthStarts
        );

        const dayName = Bengali.BENGALI_DAYS[now.getDay()];
        const displayFormat = this._settings.get_string('display-format');
        const useBengaliNumerals = this._settings.get_boolean('use-bengali-numerals');

        const panelText = Bengali.formatBengaliDate(
            bengaliDate,
            dayName,
            displayFormat,
            useBengaliNumerals
        );
        this._panelLabel.set_text(panelText);

        // Update Bengali date display
        const fullDate = Bengali.formatBengaliDate(bengaliDate, dayName, 'full', useBengaliNumerals);
        this._bengaliDateItem.label.set_text(fullDate);

        // Update Gregorian date
        const showGregorian = this._settings.get_boolean('show-gregorian');
        this._gregorianDateItem.visible = showGregorian;
        if (showGregorian) {
            const gregorianDateStr = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            this._gregorianDateItem.label.set_text(gregorianDateStr);
        }

        // Update festivals
        const showFestivals = this._settings.get_boolean('show-festivals');
        const festivals = showFestivals ? Bengali.getFestivals(bengaliDate.month, bengaliDate.day) : [];
        if (showFestivals && festivals.length > 0) {
            this._festivalsItem.label.set_text(festivals.join(', '));
            this._festivalsItem.visible = true;
        } else {
            this._festivalsItem.visible = false;
        }

        // Update month calendar
        this._buildMonthCalendar(bengaliDate, useBengaliNumerals);
    }

    disable() {
        if (this._settingsConnections) {
            this._settingsConnections.forEach(id => this._settings.disconnect(id));
            this._settingsConnections = null;
        }

        if (this._updateIntervalId) {
            GLib.source_remove(this._updateIntervalId);
            this._updateIntervalId = null;
        }

        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        this._panelLabel = null;
        this._bengaliDateItem = null;
        this._gregorianDateItem = null;
        this._festivalsItem = null;
        this._calendarBox = null;
        this._calendarMenuItem = null;
        this._settings = null;
    }
}
