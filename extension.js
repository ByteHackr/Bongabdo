/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

import GLib from 'gi://GLib';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Bengali from './lib/bengaliCalendar.js';

export default class BengaliCalendarExtension extends Extension {
    enable() {
        this._settings = this.getSettings();

        const positionSetting = this._settings.get_string('position');
        const panelBox = positionSetting === 'left' ? 'left' : 'right';

        this._indicator = new PanelMenu.Button(0.0, _('Bengali Calendar'), false);

        this._panelLabel = new St.Label({
            text: '',
            style_class: 'bengali-calendar-label',
        });

        const fontSize = this._settings.get_int('font-size');
        this._panelLabel.style = `font-size: ${fontSize}px;`;

        this._indicator.add_child(this._panelLabel);

        // Popup items
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

        this._updateDisplay();

        this._updateIntervalId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            60,
            () => {
                this._updateDisplay();
                return GLib.SOURCE_CONTINUE;
            }
        );

        this._settingsConnections = [
            this._settings.connect('changed::display-format', () => this._updateDisplay()),
            this._settings.connect('changed::show-gregorian', () => this._updateDisplay()),
            this._settings.connect('changed::show-festivals', () => this._updateDisplay()),
            this._settings.connect('changed::use-bengali-numerals', () => this._updateDisplay()),
            this._settings.connect('changed::font-size', () => {
                const fontSize = this._settings.get_int('font-size');
                this._panelLabel.style = `font-size: ${fontSize}px;`;
            }),
            // Position changes require reload to move between panel boxes.
            this._settings.connect('changed::position', () => this._updateDisplay()),
        ];

        Main.panel.addToStatusArea(this.uuid, this._indicator, 0, panelBox);
    }

    _updateDisplay() {
        const now = new Date();
        const bengaliDate = Bengali.gregorianToBengali(
            now.getFullYear(),
            now.getMonth() + 1,
            now.getDate()
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
    }

    disable() {
        if (this._settingsConnections) {
            this._settingsConnections.forEach(id => this._settings.disconnect(id));
            this._settingsConnections = null;
        }

        if (this._updateIntervalId) {
            GLib.Source.remove(this._updateIntervalId);
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
        this._settings = null;
    }
}
