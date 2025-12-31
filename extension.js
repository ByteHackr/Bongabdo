/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* exported init */

const { St, Clutter, GLib, Gio } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

// Extension imports
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Bengali = Me.imports.lib.bengaliCalendar;

const { BENGALI_DAYS } = Bengali;

let bengaliCalendarIndicator;
let settings;

function init() {
    // Initialize settings
    settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.bengali-calendar');
}

function enable() {
    // Create indicator
    const position = settings.get_string('position') === 'left' ? 0.0 : 1.0;
    bengaliCalendarIndicator = new PanelMenu.Button(position, 'Bengali Calendar', false);
    
    // Create label for Bengali date
    const label = new St.Label({
        text: '',
        style_class: 'bengali-calendar-label'
    });
    
    // Apply font size from settings
    const fontSize = settings.get_int('font-size');
    label.style = `font-size: ${fontSize}pt;`;
    
    bengaliCalendarIndicator.add_child(label);
    
    // Create popup menu
    const menu = bengaliCalendarIndicator.menu;
    
    // Bengali date section
    const bengaliDateSection = new PopupMenu.PopupMenuSection();
    const bengaliDateLabel = new St.Label({
        text: '',
        style_class: 'bengali-date-popup'
    });
    bengaliDateSection.addActor(bengaliDateLabel);
    menu.addMenuItem(new PopupMenu.PopupBaseMenuItem({ activate: false }));
    menu.addMenuItem(new PopupMenu.PopupBaseMenuItem({ 
        child: bengaliDateSection,
        reactive: false 
    }));
    
    // Gregorian date section (if enabled)
    const gregorianDateLabel = new St.Label({
        text: '',
        style_class: 'gregorian-date-popup'
    });
    const gregorianDateSection = new PopupMenu.PopupMenuSection();
    gregorianDateSection.addActor(gregorianDateLabel);
    
    // Festivals section
    const festivalsLabel = new St.Label({
        text: '',
        style_class: 'festivals-popup'
    });
    const festivalsSection = new PopupMenu.PopupMenuSection();
    festivalsSection.addActor(festivalsLabel);
    
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
        bengaliDateLabel.set_text(`📅 ${fullDate}`);
        
        // Update Gregorian date if enabled
        if (settings.get_boolean('show-gregorian')) {
            const gregorianDateStr = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            gregorianDateLabel.set_text(`🌍 ${gregorianDateStr}`);
            if (!menu._gregorianAdded) {
                menu.addMenuItem(new PopupMenu.PopupBaseMenuItem({ 
                    child: gregorianDateSection,
                    reactive: false 
                }));
                menu._gregorianAdded = true;
            }
            gregorianDateSection.visible = true;
        } else {
            if (menu._gregorianAdded) {
                gregorianDateSection.visible = false;
            }
        }
        
        // Update festivals if enabled
        if (settings.get_boolean('show-festivals')) {
            const festivals = Bengali.getFestivals(bengaliDate.month, bengaliDate.day);
            if (festivals.length > 0) {
                festivalsLabel.set_text(`🎉 ${festivals.join(', ')}`);
                if (!menu._festivalsAdded) {
                    menu.addMenuItem(new PopupMenu.PopupBaseMenuItem({ 
                        child: festivalsSection,
                        reactive: false 
                    }));
                    menu._festivalsAdded = true;
                }
                festivalsSection.visible = true;
            } else {
                if (menu._festivalsAdded) {
                    festivalsSection.visible = false;
                }
            }
        } else {
            if (menu._festivalsAdded) {
                festivalsSection.visible = false;
            }
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
            label.style = `font-size: ${fontSize}pt;`;
        }),
        settings.connect('changed::position', () => {
            // Note: Position change requires extension reload
            updateDisplay();
        })
    ];
    
    // Add to panel
    Main.panel.addToStatusArea('bengali-calendar', bengaliCalendarIndicator);
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
