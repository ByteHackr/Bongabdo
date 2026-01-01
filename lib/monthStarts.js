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
 * @returns {Promise<object|null>}
 */
export async function loadMonthStartsAsync(extension, location) {
    if (location === 'bangladesh')
        return null;

    const dir = extension?.dir;
    if (!dir)
        return null;

    const file = dir.get_child('lib')?.get_child('bengaliMonthStarts.json');
    if (!file)
        return null;

    const bytes = await new Promise((resolve) => {
        file.load_contents_async(null, (_f, res) => {
            try {
                const [ok, contents] = file.load_contents_finish(res);
                resolve(ok ? contents : null);
            } catch (e) {
                debug('Failed to load month starts mapping; falling back', e);
                resolve(null);
            }
        });
    });

    if (!bytes)
        return null;

    const jsonText = new TextDecoder('utf-8').decode(bytes);
    if (!jsonText?.trim())
        return null;

    let parsed = null;
    try {
        parsed = JSON.parse(jsonText);
    } catch (e) {
        debug('Month starts JSON parse failed; falling back', e);
        return null;
    }

    if (!parsed || typeof parsed !== 'object') {
        warn('Month starts JSON has invalid structure');
        return null;
    }

    return parsed;
}
