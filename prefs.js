/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class BengaliCalendarPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        window.set_default_size(520, 420);

        const page = new Adw.PreferencesPage({
            title: _('Bongabdo'),
        });
        window.add(page);

        const displayGroup = new Adw.PreferencesGroup({
            title: _('Display'),
        });
        page.add(displayGroup);

        // Display format (string)
        const formatOptions = [
            ['full', _('Full (Day, Date Month Year)')],
            ['short', _('Short (Date Month)')],
            ['date-only', _('Date Only (Date Month Year)')],
            ['compact', _('Compact (DD/MM/YYYY)')],
        ];
        const formatDropDown = Gtk.DropDown.new_from_strings(formatOptions.map(([, label]) => label));
        formatDropDown.valign = Gtk.Align.CENTER;
        const formatRow = new Adw.ActionRow({
            title: _('Display Format'),
        });
        formatRow.add_suffix(formatDropDown);
        displayGroup.add(formatRow);

        const syncFormatFromSetting = () => {
            const current = settings.get_string('display-format');
            const idx = Math.max(0, formatOptions.findIndex(([id]) => id === current));
            formatDropDown.selected = idx;
        };
        syncFormatFromSetting();
        formatDropDown.connect('notify::selected', () => {
            const idx = formatDropDown.selected;
            settings.set_string('display-format', formatOptions[idx][0]);
        });
        settings.connect('changed::display-format', syncFormatFromSetting);

        // Toggles
        displayGroup.add(this._switchRow(settings, 'show-gregorian', _('Show Gregorian Date in Popup')));
        displayGroup.add(this._switchRow(settings, 'show-festivals', _('Show Festivals and Holidays')));
        displayGroup.add(this._switchRow(settings, 'use-bengali-numerals', _('Use Bengali Numerals (০-৯)')));

        // Font size (int)
        const fontRow = new Adw.ActionRow({ title: _('Font Size') });
        const fontSpin = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 8,
                upper: 24,
                step_increment: 1,
                page_increment: 1,
                value: settings.get_int('font-size'),
            }),
            valign: Gtk.Align.CENTER,
        });
        fontSpin.connect('value-changed', () => settings.set_int('font-size', fontSpin.get_value_as_int()));
        settings.connect('changed::font-size', () => fontSpin.set_value(settings.get_int('font-size')));
        fontRow.add_suffix(fontSpin);
        displayGroup.add(fontRow);

        // Panel position (string)
        const positionOptions = [
            ['left', _('Left')],
            ['right', _('Right')],
        ];
        const positionDropDown = Gtk.DropDown.new_from_strings(positionOptions.map(([, label]) => label));
        positionDropDown.valign = Gtk.Align.CENTER;
        const positionRow = new Adw.ActionRow({ title: _('Panel Position') });
        positionRow.add_suffix(positionDropDown);
        displayGroup.add(positionRow);

        const syncPositionFromSetting = () => {
            const current = settings.get_string('position');
            const idx = Math.max(0, positionOptions.findIndex(([id]) => id === current));
            positionDropDown.selected = idx;
        };
        syncPositionFromSetting();
        positionDropDown.connect('notify::selected', () => {
            const idx = positionDropDown.selected;
            settings.set_string('position', positionOptions[idx][0]);
        });
        settings.connect('changed::position', syncPositionFromSetting);
    }

    _switchRow(settings, key, title) {
        const row = new Adw.ActionRow({ title });
        const sw = new Gtk.Switch({ valign: Gtk.Align.CENTER });
        row.add_suffix(sw);
        row.activatable_widget = sw;
        settings.bind(key, sw, 'active', Gio.SettingsBindFlags.DEFAULT);
        return row;
    }
}
