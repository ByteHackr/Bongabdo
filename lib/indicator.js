import St from 'gi://St';
import Clutter from 'gi://Clutter';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Bengali from './bengaliCalendar.js';
import { buildMonthMatrix, getLocaleWeekStart } from './monthMatrix.js';
import { computeWestBengalMonthView } from './westBengalMonthView.js';
import { debug } from './logger.js';

export class BongabdoIndicator {
    constructor({ uuid, settings, monthStarts, festivalsData, location }) {
        this._uuid = uuid;
        this._settings = settings;
        this._monthStarts = monthStarts;
        this._festivalsData = festivalsData || null;
        this._location = location || 'india';

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
        this._tooltipActor = null;
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

        // Reset calendar navigation and refresh date when opening the menu.
        // This ensures the popup always shows the current date with correct weekday.
        this._button.menu.connectObject('open-state-changed', (_menu, isOpen) => {
            if (!isOpen)
                return;
            // Refresh the date display to ensure weekday is current
            this.update();
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

    setLocation(location) {
        this._location = location || 'india';
    }

    setFestivalsData(festivalsData) {
        this._festivalsData = festivalsData || null;
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

        // In West Bengal/India mode we use `bengaliMonthStarts.json` for accuracy.
        // While that file is loading (or if it fails), fall back to heuristic so we
        // always show a date instead of staying on "…" forever.
        const monthStarts = this._monthStarts && typeof this._monthStarts === 'object'
            ? this._monthStarts
            : null;

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
            monthStarts
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
            const festivals = showFestivals 
                ? Bengali.getFestivals(bengaliDate.month, bengaliDate.day, bengaliDate.year, this._festivalsData)
                : [];
            debug(`Festivals check: month=${bengaliDate.month}, day=${bengaliDate.day}, year=${bengaliDate.year}, festivalsData=${this._festivalsData ? 'loaded' : 'null'}, found=${festivals.length} festivals`);
            if (showFestivals && festivals.length > 0 && this._festivalsItem.label) {
                this._festivalsItem.label.set_text(festivals.join(', '));
                this._festivalsItem.visible = true;
                debug(`Festivals displayed: ${festivals.join(', ')}`);
            } else {
                this._festivalsItem.visible = false;
            }
        }

        this._buildMonthCalendar(bengaliDate, useBengaliNumerals);
    }

    destroy() {
        if (this._button)
            this._button.disconnectObject(this);

        this._hideTooltip();
        if (this._tooltipActor) {
            this._tooltipActor.destroy();
            this._tooltipActor = null;
        }

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

        const monthName = Bengali.BENGALI_MONTHS?.[month] || bengaliDate.monthName || '';
        const todayDay = offset === 0 ? bengaliDate.day : 0;

        // India (West Bengal, Tripura, Assam) - aligned with bengalicalendar.com
        const anchor = new Date();
        anchor.setMonth(anchor.getMonth() + offset);
        const anchorDate = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), 12, 0, 0, 0);

        const wb = computeWestBengalMonthView({
            monthStarts: this._monthStarts,
            month,
            anchorDate,
        });

        if (!wb) {
            const firstDayOfWeek = (new Date(anchor.getFullYear(), anchor.getMonth(), 1)).getDay();
            const fallbackFirstDay = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12, 0, 0);
            return { month, year, monthName, daysInMonth: 30, firstDayOfWeek, prevMonthDays: 30, todayDay, firstDay: fallbackFirstDay };
        }

        return {
            month,
            year,
            monthName,
            daysInMonth: wb.daysInMonth,
            firstDayOfWeek: wb.firstDayOfWeek,
            prevMonthDays: wb.prevMonthDays,
            todayDay,
            firstDay: wb.firstDay,
        };
    }

    _ensureTooltip() {
        if (this._tooltipActor) return;
        this._tooltipActor = new St.BoxLayout({
            vertical: true,
            style_class: 'bongabdo-tooltip',
        });
        this._tooltipActor.add_child(new St.Label({ style_class: 'bongabdo-tooltip-label' }));
        this._tooltipActor.visible = false;
        this._tooltipActor.set_reactive(false);
        Main.uiGroup.add_child(this._tooltipActor);
    }

    _showTooltip(actor, text) {
        this._ensureTooltip();
        const label = this._tooltipActor.get_first_child();
        if (label) label.set_text(text);
        this._tooltipActor.visible = true;
        const [x, y] = actor.get_transformed_position();
        const [_, h] = actor.get_transformed_size();
        this._tooltipActor.set_position(Math.round(x), Math.round(y + h + 4));
    }

    _hideTooltip() {
        if (this._tooltipActor) this._tooltipActor.visible = false;
    }

    _bengaliDayToGregorian(firstDay, dayNum) {
        const d = new Date(firstDay);
        d.setDate(d.getDate() + (dayNum - 1));
        return d;
    }

    _showDateDetails(bengaliDate, gregorianDate, festivals, useBengaliNumerals) {
        const dayName = Bengali.BENGALI_DAYS[gregorianDate.getDay()] || '';
        const dateStr = Bengali.formatBengaliDate(bengaliDate, dayName, 'full', useBengaliNumerals);
        if (this._bengaliDateItem?.label)
            this._bengaliDateItem.label.set_text(dateStr);
        const showGregorian = this._settings.get_boolean('show-gregorian') ?? false;
        if (this._gregorianDateItem?.label) {
            this._gregorianDateItem.label.set_text(gregorianDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
            this._gregorianDateItem.visible = showGregorian;
        }
        if (this._festivalsItem?.label) {
            this._festivalsItem.label.set_text(festivals.length > 0 ? festivals.join(', ') : '');
            this._festivalsItem.visible = festivals.length > 0;
        }
    }

    _renderMonthView(view, useBengaliNumerals) {
        const calendarFontSize = this._settings.get_int('calendar-font-size') || 11;
        const box = new St.BoxLayout({
            vertical: true,
            style_class: 'bongabdo-calendar',
        });
        box.set_style(`font-size: ${calendarFontSize}px;`);

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
        const weekStart = getLocaleWeekStart();
        const dayNames = weekStart === 1 ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
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
            weekStart,
        });

        const weeksBox = new St.BoxLayout({
            vertical: true,
            style_class: 'bongabdo-calendar-weeks',
        });

        const showFestivals = this._settings.get_boolean('show-festivals') ?? true;
        const bengaliYear = view.year;

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

                const dayText = dayNum ? Bengali.formatNumber(dayNum, useBengaliNumerals) : '';
                const style = [
                    'bongabdo-calendar-day',
                    inMonth ? '' : 'other-month',
                    isToday ? 'today' : '',
                ].filter(Boolean).join(' ');

                const festivals = (showFestivals && inMonth && dayNum && this._festivalsData)
                    ? Bengali.getFestivals(view.month, dayNum, bengaliYear, this._festivalsData)
                    : [];
                const holidayType = (inMonth && dayNum && this._festivalsData)
                    ? Bengali.getHolidayType(view.month, dayNum, bengaliYear, this._festivalsData)
                    : null;
                const dayNameBn = view.firstDay ? Bengali.BENGALI_DAYS[this._bengaliDayToGregorian(view.firstDay, dayNum).getDay()] : '';
                const tooltipLines = [dayNameBn ? `${dayNameBn} • ${dayText} ${view.monthName}` : dayText];
                if (holidayType) tooltipLines.push(holidayType === 'public' ? 'Public Holiday' : holidayType === 'sectional' ? 'Sectional Holiday' : 'State Holiday');
                if (festivals.length > 0) tooltipLines.push(...festivals);

                const cellBox = new St.BoxLayout({ vertical: false });
                cellBox.set_reactive(true);
                cellBox.track_hover = true;
                const headerCell = new St.BoxLayout({ vertical: false });
                const dayLabel = new St.Label({ text: dayText, style_class: style });
                headerCell.add_child(dayLabel);
                if (holidayType) {
                    const badge = new St.Label({
                        text: '●',
                        style_class: `bongabdo-holiday-badge bongabdo-holiday-${holidayType}`,
                    });
                    headerCell.add_child(badge);
                }
                cellBox.add_child(headerCell);
                if (inMonth && dayNum && view.firstDay) {
                    cellBox.connect('enter-event', () => this._showTooltip(cellBox, tooltipLines.join('\n')));
                    cellBox.connect('leave-event', () => this._hideTooltip());
                    const gregDate = this._bengaliDayToGregorian(view.firstDay, dayNum);
                    const bengaliDate = { year: bengaliYear, month: view.month, day: dayNum, monthName: Bengali.BENGALI_MONTHS[view.month] };
                    cellBox.connect('button-press-event', () => {
                        this._showDateDetails(bengaliDate, gregDate, festivals, useBengaliNumerals);
                    });
                }
                row.add_child(cellBox);
            }
            weeksBox.add_child(row);
        }

        box.add_child(weeksBox);

        const showFestivalsList = this._settings.get_boolean('show-festivals-list') ?? true;
        if (showFestivalsList && showFestivals && this._festivalsData) {
            const monthFestivals = [];
            for (let d = 1; d <= view.daysInMonth; d++) {
                const f = Bengali.getFestivals(view.month, d, bengaliYear, this._festivalsData);
                if (f.length > 0)
                    monthFestivals.push({ day: d, festivals: f });
            }
            if (monthFestivals.length > 0) {
                const listBox = new St.BoxLayout({
                    vertical: true,
                    style_class: 'bongabdo-festivals-list',
                });
                const toggleLabel = new St.Label({
                    text: `▼ Festivals this month (${monthFestivals.length} days)`,
                    style_class: 'bongabdo-festivals-toggle',
                });
                const toggleBtn = new St.Button({
                    child: toggleLabel,
                    style_class: 'bongabdo-festivals-toggle-btn',
                });
                const listContent = new St.BoxLayout({
                    vertical: true,
                    style_class: 'bongabdo-festivals-list-content',
                });
                listContent.visible = false;
                monthFestivals.forEach(({ day, festivals }) => {
                    const dayNum = Bengali.formatNumber(day, useBengaliNumerals);
                    const row = new St.Label({
                        text: `${dayNum} ${view.monthName}: ${festivals.join(', ')}`,
                        style_class: 'bongabdo-festivals-list-row',
                    });
                    row.clutter_text.line_wrap = true;
                    listContent.add_child(row);
                });
                let expanded = false;
                toggleBtn.connect('clicked', () => {
                    expanded = !expanded;
                    listContent.visible = expanded;
                    toggleLabel.set_text(expanded ? `▲ Festivals this month (${monthFestivals.length} days)` : `▼ Festivals this month (${monthFestivals.length} days)`);
                });
                listBox.add_child(toggleBtn);
                listBox.add_child(listContent);
                box.add_child(listBox);
            }
        }

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


