/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* exported init buildPrefsWidget */

const { GObject, Gtk, Gio } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const _ = ExtensionUtils.gettext;

function init() {
    ExtensionUtils.initTranslations('bengali-calendar');
}

function buildPrefsWidget() {
    const widget = new Gtk.Grid({
        margin: 20,
        row_spacing: 12,
        column_spacing: 12,
        column_homogeneous: false
    });
    
    const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.bengali-calendar');
    
    // Display Format
    let row = 0;
    widget.attach(new Gtk.Label({
        label: _('Display Format:'),
        halign: Gtk.Align.START
    }), 0, row, 1, 1);
    
    const displayFormatCombo = new Gtk.ComboBoxText();
    displayFormatCombo.append('full', _('Full (Day, Date Month Year)'));
    displayFormatCombo.append('short', _('Short (Date Month)'));
    displayFormatCombo.append('date-only', _('Date Only (Date Month Year)'));
    displayFormatCombo.append('compact', _('Compact (DD/MM/YYYY)'));
    displayFormatCombo.set_active_id(settings.get_string('display-format'));
    displayFormatCombo.connect('changed', (widget) => {
        settings.set_string('display-format', widget.get_active_id());
    });
    widget.attach(displayFormatCombo, 1, row, 1, 1);
    
    // Show Gregorian Date
    row++;
    widget.attach(new Gtk.Label({
        label: _('Show Gregorian Date in Popup:'),
        halign: Gtk.Align.START
    }), 0, row, 1, 1);
    
    const showGregorianSwitch = new Gtk.Switch({
        halign: Gtk.Align.END,
        active: settings.get_boolean('show-gregorian')
    });
    showGregorianSwitch.connect('notify::active', (widget) => {
        settings.set_boolean('show-gregorian', widget.active);
    });
    widget.attach(showGregorianSwitch, 1, row, 1, 1);
    
    // Show Festivals
    row++;
    widget.attach(new Gtk.Label({
        label: _('Show Festivals and Holidays:'),
        halign: Gtk.Align.START
    }), 0, row, 1, 1);
    
    const showFestivalsSwitch = new Gtk.Switch({
        halign: Gtk.Align.END,
        active: settings.get_boolean('show-festivals')
    });
    showFestivalsSwitch.connect('notify::active', (widget) => {
        settings.set_boolean('show-festivals', widget.active);
    });
    widget.attach(showFestivalsSwitch, 1, row, 1, 1);
    
    // Use Bengali Numerals
    row++;
    widget.attach(new Gtk.Label({
        label: _('Use Bengali Numerals (০-৯):'),
        halign: Gtk.Align.START
    }), 0, row, 1, 1);
    
    const useBengaliNumeralsSwitch = new Gtk.Switch({
        halign: Gtk.Align.END,
        active: settings.get_boolean('use-bengali-numerals')
    });
    useBengaliNumeralsSwitch.connect('notify::active', (widget) => {
        settings.set_boolean('use-bengali-numerals', widget.active);
    });
    widget.attach(useBengaliNumeralsSwitch, 1, row, 1, 1);
    
    // Font Size
    row++;
    widget.attach(new Gtk.Label({
        label: _('Font Size:'),
        halign: Gtk.Align.START
    }), 0, row, 1, 1);
    
    const fontSizeSpin = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            lower: 8,
            upper: 24,
            step_increment: 1,
            value: settings.get_int('font-size')
        }),
        halign: Gtk.Align.END
    });
    fontSizeSpin.connect('value-changed', (widget) => {
        settings.set_int('font-size', widget.get_value_as_int());
    });
    widget.attach(fontSizeSpin, 1, row, 1, 1);
    
    // Panel Position
    row++;
    widget.attach(new Gtk.Label({
        label: _('Panel Position:'),
        halign: Gtk.Align.START
    }), 0, row, 1, 1);
    
    const positionCombo = new Gtk.ComboBoxText();
    positionCombo.append('left', _('Left'));
    positionCombo.append('right', _('Right'));
    positionCombo.set_active_id(settings.get_string('position'));
    positionCombo.connect('changed', (widget) => {
        settings.set_string('position', widget.get_active_id());
    });
    widget.attach(positionCombo, 1, row, 1, 1);
    
    widget.show_all();
    return widget;
}
