/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

import GLib from 'gi://GLib';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { BongabdoIndicator } from './lib/indicator.js';
import { loadMonthStarts } from './lib/monthStarts.js';

export default class BongabdoExtension extends Extension {
    enable() {
        this._settings = this.getSettings();

        const location = this._settings.get_string('location') || 'west-bengal';
        const monthStarts = loadMonthStarts(this, location);

        this._indicator = new BongabdoIndicator({
            uuid: this.uuid,
            settings: this._settings,
            monthStarts,
        });
        this._indicator.create();
        this._indicator.addToPanel(this._settings.get_string('position') || 'right');
        this._indicator.update();

        // Periodic update (every minute).
        this._updateIntervalId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 60, () => {
            this._indicator?.update();
            return true;
        });

        // Settings signals (auto-cleaned via disconnectObject(this) in disable()).
        this._settings.connectObject(
            'changed::display-format', () => this._indicator?.update(),
            'changed::show-gregorian', () => this._indicator?.update(),
            'changed::show-festivals', () => this._indicator?.update(),
            'changed::use-bengali-numerals', () => this._indicator?.update(),
            'changed::show-month-calendar', () => this._indicator?.update(),
            'changed::location', () => {
                const newLocation = this._settings.get_string('location') || 'west-bengal';
                const nextMonthStarts = loadMonthStarts(this, newLocation);
                this._indicator?.setMonthStarts(nextMonthStarts);
                this._indicator?.update();
            },
            'changed::font-size', () => this._indicator?.setFontSize(this._settings.get_int('font-size')),
            'changed::position', () => this._indicator?.setPosition(this._settings.get_string('position')),
            this
        );
    }

    disable() {
        // Stop periodic updates first to avoid races while tearing down actors.
        if (this._updateIntervalId) {
            GLib.source_remove(this._updateIntervalId);
            this._updateIntervalId = 0;
        }

        this._settings?.disconnectObject(this);

        this._indicator?.destroy();
        this._indicator = null;

        this._settings = null;
    }
}


