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
        
        // Load Bengali month start dates mapping (West Bengal Surya Siddhanta)
        this._monthStarts = this._loadMonthStarts();

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

        // Popup menu items
        const menu = this._indicator.menu;

        this._bengaliDateItem = new PopupMenu.PopupMenuItem('', {
            reactive: false,
            can_focus: false,
        });
        this._bengaliDateItem.label.add_style_class_name('bengali-date-popup');
        menu.addMenuItem(this._bengaliDateItem);

        this._gregorianDateItem = new PopupMenu.PopupMenuItem('', {
            reactive: false,
            can_focus: false,
        });
        this._gregorianDateItem.label.add_style_class_name('gregorian-date-popup');
        this._gregorianDateItem.visible = false;
        menu.addMenuItem(this._gregorianDateItem);

        this._festivalsItem = new PopupMenu.PopupMenuItem('', {
            reactive: false,
            can_focus: false,
        });
        this._festivalsItem.label.add_style_class_name('festivals-popup');
        this._festivalsItem.visible = false;
        menu.addMenuItem(this._festivalsItem);

        // Month calendar section
        this._calendarSection = new PopupMenu.PopupMenuSection();
        this._calendarBox = null;
        menu.addMenuItem(new PopupMenu.PopupBaseMenuItem({
            child: this._calendarSection,
            reactive: false
        }));
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

    _loadMonthStarts() {
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
            this._calendarSection.visible = false;
            return;
        }

        this._calendarSection.visible = true;

        // Create calendar grid
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
        const dayNamesRow = new St.BoxLayout();
        const dayNames = ['র', 'সো', 'ম', 'বু', 'বৃ', 'শু', 'শ'];
        dayNames.forEach(day => {
            const label = new St.Label({
                text: day,
                style_class: 'bengali-calendar-day-name'
            });
            dayNamesRow.add_child(label);
        });
        box.add_child(dayNamesRow);

        // Get current month's dates from JSON mapping
        const now = new Date();
        const year = now.getFullYear();
        const yearStr = String(year);
        const prevYearStr = String(year - 1);
        
        // Determine which year's data to use
        let yearData = null;
        if (this._monthStarts?.[yearStr] && this._monthStarts[yearStr][String(bengaliDate.month)]) {
            yearData = this._monthStarts[yearStr];
        } else if (this._monthStarts?.[prevYearStr] && this._monthStarts[prevYearStr][String(bengaliDate.month)]) {
            yearData = this._monthStarts[prevYearStr];
        }
        
        if (!yearData) {
            this._calendarSection.visible = false;
            return;
        }

        const monthKey = String(bengaliDate.month);
        const nextMonthKey = String((bengaliDate.month + 1) % 12);
        const nextYearKey = bengaliDate.month === 11 ? String(year + 1) : yearStr;
        
        const monthStartStr = yearData[monthKey];
        let nextMonthStartStr = yearData[nextMonthKey];
        
        // If last month, get next year's Boishakh
        if (bengaliDate.month === 11 && this._monthStarts?.[nextYearKey]?.['0']) {
            nextMonthStartStr = this._monthStarts[nextYearKey]['0'];
        }

        if (!monthStartStr || !nextMonthStartStr) {
            this._calendarSection.visible = false;
            return;
        }

        const parseDate = (str) => {
            const [y, m, d] = str.split('-').map(Number);
            return new Date(y, m - 1, d);
        };

        const monthStart = parseDate(monthStartStr);
        const nextMonthStart = parseDate(nextMonthStartStr);
        
        // Calculate days in month (Sankranti date is excluded, so +1 day)
        const daysInMonth = Math.floor((nextMonthStart - monthStart) / (1000 * 60 * 60 * 24));

        // Find first day of week for the day AFTER Sankranti (first day of Bengali month)
        // Sankranti date is excluded, so first day is monthStart + 1 day
        const firstDayDate = new Date(monthStart);
        firstDayDate.setDate(firstDayDate.getDate() + 1);
        const firstDayOfWeek = firstDayDate.getDay();

        // Create calendar grid
        const grid = new St.BoxLayout({ vertical: true });
        
        let currentDay = 1;
        let weekRow = new St.BoxLayout();
        
        // Empty cells for days before month starts
        for (let i = 0; i < firstDayOfWeek; i++) {
            const empty = new St.Label({ text: '', style_class: 'bengali-calendar-day' });
            weekRow.add_child(empty);
        }

        // Add days
        while (currentDay <= daysInMonth) {
            if (weekRow.get_children().length === 7) {
                grid.add_child(weekRow);
                weekRow = new St.BoxLayout();
            }

            const dayNum = Bengali.formatNumber(currentDay, useBengaliNumerals);
            const isToday = (currentDay === bengaliDate.day);
            const dayLabel = new St.Label({
                text: dayNum,
                style_class: isToday ? 'bengali-calendar-day today' : 'bengali-calendar-day'
            });
            weekRow.add_child(dayLabel);
            currentDay++;
        }

        // Fill remaining week
        while (weekRow.get_children().length < 7) {
            const empty = new St.Label({ text: '', style_class: 'bengali-calendar-day' });
            weekRow.add_child(empty);
        }
        if (weekRow.get_children().length > 0) {
            grid.add_child(weekRow);
        }

        box.add_child(grid);
        this._calendarBox = box;
        this._calendarSection.add_child(box);
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

        const fullDate = Bengali.formatBengaliDate(bengaliDate, dayName, 'full', useBengaliNumerals);
        this._bengaliDateItem.label.set_text(`📅 ${fullDate}`);

        const showGregorian = this._settings.get_boolean('show-gregorian');
        this._gregorianDateItem.visible = showGregorian;
        if (showGregorian) {
            const gregorianDateStr = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            this._gregorianDateItem.label.set_text(`🌍 ${gregorianDateStr}`);
        } else {
            this._gregorianDateItem.label.set_text('');
        }

        const showFestivals = this._settings.get_boolean('show-festivals');
        const festivals = showFestivals ? Bengali.getFestivals(bengaliDate.month, bengaliDate.day) : [];
        if (showFestivals && festivals.length > 0) {
            this._festivalsItem.label.set_text(`🎉 ${festivals.join(', ')}`);
            this._festivalsItem.visible = true;
        } else {
            this._festivalsItem.label.set_text('');
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
        this._calendarSection = null;
        this._settings = null;
    }
}
