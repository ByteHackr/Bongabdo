/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* exported init buildPrefsWidget */

const { GObject, Gtk, Gio } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

function init() {
    ExtensionUtils.initTranslations();
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
        label: 'Display Format:',
        halign: Gtk.Align.START
    }), 0, row, 1, 1);
    
    const displayFormatCombo = new Gtk.ComboBoxText();
    displayFormatCombo.append('full', 'Full (Day, Date Month Year)');
    displayFormatCombo.append('short', 'Short (Date Month)');
    displayFormatCombo.append('date-only', 'Date Only (Date Month Year)');
    displayFormatCombo.append('compact', 'Compact (DD/MM/YYYY)');
    displayFormatCombo.set_active_id(settings.get_string('display-format'));
    displayFormatCombo.connect('changed', (widget) => {
        settings.set_string('display-format', widget.get_active_id());
    });
    widget.attach(displayFormatCombo, 1, row, 1, 1);
    
    // Show Gregorian Date
    row++;
    widget.attach(new Gtk.Label({
        label: 'Show Gregorian Date in Popup:',
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
        label: 'Show Festivals and Holidays:',
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
        label: 'Use Bengali Numerals (০-৯):',
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
        label: 'Font Size:',
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
        label: 'Panel Position:',
        halign: Gtk.Align.START
    }), 0, row, 1, 1);
    
    const positionCombo = new Gtk.ComboBoxText();
    positionCombo.append('left', 'Left');
    positionCombo.append('right', 'Right');
    positionCombo.set_active_id(settings.get_string('position'));
    positionCombo.connect('changed', (widget) => {
        settings.set_string('position', widget.get_active_id());
    });
    widget.attach(positionCombo, 1, row, 1, 1);
    
    widget.show_all();
    return widget;
}
