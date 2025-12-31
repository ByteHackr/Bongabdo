/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* exported init */

const { St, Clutter, GLib, Gio } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

// Extension imports
const ExtensionUtils = imports.misc.extensionUtils;
const _ = ExtensionUtils.gettext;
const Me = ExtensionUtils.getCurrentExtension();
const Bengali = Me.imports.lib.bengaliCalendar;

const { BENGALI_DAYS } = Bengali;

let bengaliCalendarIndicator;
let settings;

function init() {
    // Initialize translations and settings
    ExtensionUtils.initTranslations('bengali-calendar');
    settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.bengali-calendar');
}

function enable() {
    // Create indicator
    const positionSetting = settings.get_string('position');
    const panelBox = positionSetting === 'left' ? 'left' : 'right';
    bengaliCalendarIndicator = new PanelMenu.Button(0.0, _('Bengali Calendar'), false);
    
    // Create label for Bengali date
    const label = new St.Label({
        text: '',
        style_class: 'bengali-calendar-label'
    });
    
    // Apply font size from settings
    const fontSize = settings.get_int('font-size');
    label.style = `font-size: ${fontSize}px;`;
    
    bengaliCalendarIndicator.add_child(label);
    
    // Create popup menu
    const menu = bengaliCalendarIndicator.menu;
    
    // Bengali date item
    const bengaliDateItem = new PopupMenu.PopupMenuItem('', {
        reactive: false,
        can_focus: false
    });
    bengaliDateItem.label.set_style_class_name('bengali-date-popup');
    menu.addMenuItem(bengaliDateItem);

    // Gregorian date item (toggled via settings)
    const gregorianDateItem = new PopupMenu.PopupMenuItem('', {
        reactive: false,
        can_focus: false
    });
    gregorianDateItem.label.set_style_class_name('gregorian-date-popup');
    menu.addMenuItem(gregorianDateItem);
    gregorianDateItem.visible = false;

    // Festivals item (toggled via settings)
    const festivalsItem = new PopupMenu.PopupMenuItem('', {
        reactive: false,
        can_focus: false
    });
    festivalsItem.label.set_style_class_name('festivals-popup');
    menu.addMenuItem(festivalsItem);
    festivalsItem.visible = false;
    
    // Update function
    function updateDisplay() {
        const now = new Date();
        const bengaliDate = Bengali.gregorianToBengali(
            now.getFullYear(),
            now.getMonth() + 1,
            now.getDate()
        );
        
        const dayName = BENGALI_DAYS[now.getDay()];
        const displayFormat = settings.get_string('display-format');
        const useBengaliNumerals = settings.get_boolean('use-bengali-numerals');
        
        // Update panel label
        const panelText = Bengali.formatBengaliDate(bengaliDate, dayName, displayFormat, useBengaliNumerals);
        label.set_text(panelText);
        
        // Update popup menu
        const fullDate = Bengali.formatBengaliDate(bengaliDate, dayName, 'full', useBengaliNumerals);
        bengaliDateItem.label.text = `📅 ${fullDate}`;
        
        // Update Gregorian date if enabled
        const showGregorian = settings.get_boolean('show-gregorian');
        gregorianDateItem.visible = showGregorian;
        if (showGregorian) {
            const gregorianDateStr = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            gregorianDateItem.label.text = `🌍 ${gregorianDateStr}`;
        } else {
            gregorianDateItem.label.text = '';
        }
        
        // Update festivals if enabled
        const showFestivals = settings.get_boolean('show-festivals');
        const festivals = showFestivals ? Bengali.getFestivals(bengaliDate.month, bengaliDate.day) : [];
        if (showFestivals && festivals.length > 0) {
            const festivals = Bengali.getFestivals(bengaliDate.month, bengaliDate.day);
            festivalsItem.label.text = `🎉 ${festivals.join(', ')}`;
            festivalsItem.visible = true;
        } else {
            festivalsItem.label.text = '';
            festivalsItem.visible = false;
        }
    }
    
    // Update immediately
    updateDisplay();
    
    // Update every minute
    const updateInterval = GLib.timeout_add_seconds(
        GLib.PRIORITY_DEFAULT,
        60,
        () => {
            updateDisplay();
            return true;
        }
    );
    
    // Store interval ID for cleanup
    bengaliCalendarIndicator._updateInterval = updateInterval;
    
    // Connect settings changes
    bengaliCalendarIndicator._settingsConnections = [
        settings.connect('changed::display-format', updateDisplay),
        settings.connect('changed::show-gregorian', updateDisplay),
        settings.connect('changed::show-festivals', updateDisplay),
        settings.connect('changed::use-bengali-numerals', updateDisplay),
        settings.connect('changed::font-size', () => {
            const fontSize = settings.get_int('font-size');
            label.style = `font-size: ${fontSize}px;`;
        }),
        settings.connect('changed::position', () => {
            // Note: Position change requires extension reload to move panel box
            updateDisplay();
        })
    ];
    
    // Add to panel
    Main.panel.addToStatusArea('bengali-calendar', bengaliCalendarIndicator, 0, panelBox);
}

function disable() {
    if (bengaliCalendarIndicator) {
        // Disconnect settings signals
        if (bengaliCalendarIndicator._settingsConnections) {
            bengaliCalendarIndicator._settingsConnections.forEach(conn => {
                settings.disconnect(conn);
            });
        }
        
        // Remove timeout if exists
        if (bengaliCalendarIndicator._updateInterval) {
            GLib.source_remove(bengaliCalendarIndicator._updateInterval);
        }
        
        bengaliCalendarIndicator.destroy();
        bengaliCalendarIndicator = null;
    }
}
