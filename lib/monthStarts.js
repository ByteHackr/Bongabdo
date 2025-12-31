import Gio from 'gi://Gio';

import { debug, warn } from './logger.js';

/**
 * Load Bengali month starts JSON mapping for the given location.
 *
 * - For `bangladesh` we return null (fixed calendar; no mapping needed).
 * - For other locations, we best-effort read `lib/bengaliMonthStarts.json`.
 *
 * @param {import('resource:///org/gnome/shell/extensions/extension.js').Extension} extension
 * @param {string} location
 * @returns {object|null}
 */
export function loadMonthStarts(extension, location) {
    if (location === 'bangladesh')
        return null;

    const dir = extension?.dir;
    if (!dir)
        return null;

    const file = dir.get_child('lib')?.get_child('bengaliMonthStarts.json');
    if (!file)
        return null;

    try {
        if (!file.query_exists(null))
            return null;

        const [ok, bytes] = Gio.File.new_for_path(file.get_path()).load_contents(null);
        if (!ok || !bytes)
            return null;

        const jsonText = new TextDecoder('utf-8').decode(bytes);
        if (!jsonText?.trim())
            return null;

        const parsed = JSON.parse(jsonText);
        if (!parsed || typeof parsed !== 'object') {
            warn('Month starts JSON has invalid structure');
            return null;
        }

        return parsed;
    } catch (e) {
        debug('Failed to load month starts mapping; falling back', e);
        return null;
    }
}


