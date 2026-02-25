/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

import GLib from 'gi://GLib';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { BongabdoIndicator } from './lib/indicator.js';
import { loadMonthStartsAsync, loadFestivalsAsync } from './lib/monthStarts.js';

export default class BongabdoExtension extends Extension {
    enable() {
        this._settings = this.getSettings();

        this._monthStartsLoadSeq = 0;
        this._festivalsLoadSeq = 0;

        const location = this._settings.get_string('location') || 'india';

        this._indicator = new BongabdoIndicator({
            uuid: this.uuid,
            settings: this._settings,
            monthStarts: null,
            festivalsData: null,
            location,
        });
        this._indicator.create();
        this._indicator.addToPanel(this._settings.get_string('position') || 'right');
        this._indicator.update();

        // Load month-start mappings asynchronously to avoid blocking GNOME Shell.
        this._reloadMonthStarts(location);
        // Load festivals data asynchronously
        this._reloadFestivals();

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
            'changed::calendar-font-size', () => this._indicator?.update(),
            'changed::show-festivals-list', () => this._indicator?.update(),
            'changed::location', () => {
                const newLocation = this._settings.get_string('location') || 'india';
                this._reloadMonthStarts(newLocation);
            },
            'changed::font-size', () => this._indicator?.setFontSize(this._settings.get_int('font-size')),
            'changed::position', () => this._indicator?.setPosition(this._settings.get_string('position')),
            this
        );
    }

    _reloadMonthStarts(location) {
        if (!this._indicator)
            return;

        const loc = location || 'india';
        this._indicator.setLocation(loc);

        const seq = ++this._monthStartsLoadSeq;
        loadMonthStartsAsync(this, loc).then((monthStarts) => {
            // Ignore out-of-order async completions, or completions after disable().
            if (!this._indicator || seq !== this._monthStartsLoadSeq)
                return;

            this._indicator.setMonthStarts(monthStarts);
            this._indicator.update();
        });
    }

    _reloadFestivals() {
        if (!this._indicator)
            return;

        const seq = ++this._festivalsLoadSeq;
        loadFestivalsAsync(this).then((festivalsData) => {
            // Ignore out-of-order async completions, or completions after disable().
            if (!this._indicator || seq !== this._festivalsLoadSeq)
                return;

            this._indicator.setFestivalsData(festivalsData);
            this._indicator.update();
        });
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

        this._monthStartsLoadSeq = 0;
        this._festivalsLoadSeq = 0;
        this._settings = null;
    }
}

