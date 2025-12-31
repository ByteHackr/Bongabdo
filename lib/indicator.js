import St from 'gi://St';
import Clutter from 'gi://Clutter';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Bengali from './bengaliCalendar.js';
import { buildMonthMatrix } from './monthMatrix.js';
import { debug } from './logger.js';

export class BongabdoIndicator {
    constructor({ uuid, settings, monthStarts }) {
        this._uuid = uuid;
        this._settings = settings;
        this._monthStarts = monthStarts;

        this._button = null;
        this._panelLabel = null;
        this._bengaliDateItem = null;
        this._gregorianDateItem = null;
        this._festivalsItem = null;
        this._calendarMenuItem = null;
        this._calendarBox = null;

        this._calendarMonthOffset = 0;
        this._lastBengaliDate = null;
        this._lastUseBengaliNumerals = true;
    }

    create() {
        this._button = new PanelMenu.Button(0.0, 'Bongabdo', false);

        this._panelLabel = new St.Label({
            text: '',
            style_class: 'bengali-calendar-label',
        });
        this._panelLabel.y_align = Clutter.ActorAlign.CENTER;
        this._panelLabel.y_expand = true;

        this._button.add_child(this._panelLabel);

        const menu = this._button.menu;

        this._bengaliDateItem = new PopupMenu.PopupMenuItem('', { reactive: false, can_focus: false });
        this._bengaliDateItem.label.add_style_class_name('bengali-date-popup');
        this._bengaliDateItem.label.x_expand = true;
        menu.addMenuItem(this._bengaliDateItem);

        this._gregorianDateItem = new PopupMenu.PopupMenuItem('', { reactive: false, can_focus: false });
        this._gregorianDateItem.label.add_style_class_name('gregorian-date-popup');
        this._gregorianDateItem.label.x_expand = true;
        this._gregorianDateItem.visible = false;
        menu.addMenuItem(this._gregorianDateItem);

        this._festivalsItem = new PopupMenu.PopupMenuItem('', { reactive: false, can_focus: false });
        this._festivalsItem.label.add_style_class_name('festivals-popup');
        this._festivalsItem.label.x_expand = true;
        this._festivalsItem.visible = false;
        menu.addMenuItem(this._festivalsItem);

        this._calendarMenuItem = new PopupMenu.PopupMenuItem('', { reactive: false, can_focus: false });
        this._calendarMenuItem.add_style_class_name('bongabdo-calendar-menuitem');
        menu.addMenuItem(this._calendarMenuItem);

        // Reset calendar navigation when opening the menu.
        this._button.menu.connectObject('open-state-changed', (_menu, isOpen) => {
            if (!isOpen)
                return;
            this._calendarMonthOffset = 0;
            if (this._lastBengaliDate)
                this._buildMonthCalendar(this._lastBengaliDate, this._lastUseBengaliNumerals);
        }, this);

        // Apply initial font-size.
        this.setFontSize(this._settings.get_int('font-size') || 14);
    }

    addToPanel(position) {
        Main.panel.addToStatusArea(this._uuid, this._button, 0, 'right');
        this.setPosition(position);
    }

    setMonthStarts(monthStarts) {
        this._monthStarts = monthStarts;
    }

    setFontSize(fontSize) {
        if (!this._panelLabel)
            return;
        const size = Number(fontSize) || 14;
        this._panelLabel.style = `font-size: ${size}px;`;
    }

    setPosition(positionSetting) {
        if (!this._button)
            return;

        const container = this._button.container ?? this._button;
        const parent = container?.get_parent?.();
        if (parent)
            parent.remove_child(container);

        let targetBox = Main.panel?._rightBox;
        if (positionSetting === 'left')
            targetBox = Main.panel?._leftBox;
        else if (positionSetting === 'center')
            targetBox = Main.panel?._centerBox;

        if (!targetBox?.insert_child_at_index) {
            Main.panel.addToStatusArea(this._uuid, this._button, 0, positionSetting);
            return;
        }

        targetBox.insert_child_at_index(container, 0);
    }

    update(now = new Date()) {
        if (!this._settings || !this._panelLabel)
            return;

        if (!(now instanceof Date) || isNaN(now.getTime()))
            return;

        // Use a "safe" local date at noon for weekday calculations to avoid any edge
        // cases around midnight/DST transitions. Weekday must match system calendar.
        // Always construct from local date components to ensure we're using system timezone.
        const y = now.getFullYear();
        const m0 = now.getMonth();
        const d0 = now.getDate();
        const safeLocalDate = new Date(y, m0, d0, 12, 0, 0);
        const dayIndex = safeLocalDate.getDay();

        debug(`update: now=${now.toISOString()}, local=${y}-${m0 + 1}-${d0}, dayIndex=${dayIndex}, dayName=${Bengali.BENGALI_DAYS[dayIndex]}`);

        const bengaliDate = Bengali.gregorianToBengali(
            y,
            m0 + 1,
            d0,
            this._monthStarts
        );
        if (!bengaliDate || typeof bengaliDate.month !== 'number')
            return;

        const dayName = Bengali.BENGALI_DAYS[dayIndex] || '';
        const displayFormat = this._settings.get_string('display-format') || 'full';
        const useBengaliNumerals = this._settings.get_boolean('use-bengali-numerals') ?? true;

        this._lastBengaliDate = bengaliDate;
        this._lastUseBengaliNumerals = !!useBengaliNumerals;

        const panelText = Bengali.formatBengaliDate(bengaliDate, dayName, displayFormat, useBengaliNumerals);
        this._panelLabel.set_text(panelText || '');

        if (this._bengaliDateItem?.label) {
            const fullDate = Bengali.formatBengaliDate(bengaliDate, dayName, 'full', useBengaliNumerals);
            this._bengaliDateItem.label.set_text(fullDate || '');
        }

        const showGregorian = this._settings.get_boolean('show-gregorian') ?? false;
        if (this._gregorianDateItem) {
            this._gregorianDateItem.visible = showGregorian;
            if (showGregorian && this._gregorianDateItem.label) {
                const gregorianDateStr = now.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
                this._gregorianDateItem.label.set_text(gregorianDateStr || '');
            }
        }

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

        this._buildMonthCalendar(bengaliDate, useBengaliNumerals);
    }

    destroy() {
        if (this._button)
            this._button.disconnectObject(this);

        if (this._calendarBox) {
            this._calendarBox.destroy();
            this._calendarBox = null;
        }

        if (this._button) {
            this._button.destroy();
            this._button = null;
        }

        this._panelLabel = null;
        this._bengaliDateItem = null;
        this._gregorianDateItem = null;
        this._festivalsItem = null;
        this._calendarMenuItem = null;
    }

    _buildMonthCalendar(bengaliDate, useBengaliNumerals) {
        const showCalendar = this._settings?.get_boolean('show-month-calendar') ?? true;
        if (!showCalendar || !this._calendarMenuItem) {
            if (this._calendarMenuItem)
                this._calendarMenuItem.visible = false;
            return;
        }

        if (!bengaliDate || typeof bengaliDate.month !== 'number' || typeof bengaliDate.day !== 'number') {
            this._calendarMenuItem.visible = false;
            return;
        }

        if (this._calendarBox) {
            this._calendarBox.destroy();
            this._calendarBox = null;
        }

        const view = this._computeMonthView(bengaliDate);
        if (!view) {
            this._calendarMenuItem.visible = false;
            return;
        }

        const box = this._renderMonthView(view, useBengaliNumerals);
        this._calendarBox = box;
        this._calendarMenuItem.visible = true;
        this._updateCalendarMenuItem(box);
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

        // West Bengal/India mapping-based view (best-effort).
        const anchor = new Date();
        anchor.setMonth(anchor.getMonth() + offset);

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
            btn.connectObject('clicked', onClick, this);
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

    _updateCalendarMenuItem(box) {
        if (!this._calendarMenuItem || !box)
            return;

        // Clear existing content.
        const children = this._calendarMenuItem.get_children();
        if (children) {
            children.forEach(child => {
                if (child && child !== this._calendarMenuItem.label)
                    this._calendarMenuItem.remove_child(child);
            });
        }

        if (this._calendarMenuItem.label)
            this._calendarMenuItem.label.visible = false;

        const wrapper = new St.BoxLayout({
            x_expand: true,
            x_align: Clutter.ActorAlign.CENTER,
            style_class: 'bongabdo-calendar-wrapper',
        });
        box.x_align = Clutter.ActorAlign.CENTER;
        wrapper.add_child(box);
        this._calendarMenuItem.add_child(wrapper);
    }
}


