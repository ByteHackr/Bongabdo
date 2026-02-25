import Gio from 'gi://Gio';

import { debug, warn } from './logger.js';

/**
 * Load Bengali month starts JSON mapping for India (West Bengal, Tripura, Assam).
 * Aligned with bengalicalendar.com.
 *
 * @param {import('resource:///org/gnome/shell/extensions/extension.js').Extension} extension
 * @param {string} location
 * @returns {Promise<object|null>}
 */
export async function loadMonthStartsAsync(extension, _location) {
    let dir = extension?.dir;
    if (!dir) {
        const path = extension?.path ?? extension?.metadata?.path;
        if (path)
            dir = Gio.File.new_for_path(path);
    }
    if (!dir)
        return null;

    const file = dir.get_child('lib')?.get_child('bengaliMonthStarts.json');
    if (!file)
        return null;

    const bytes = await new Promise((resolve) => {
        file.load_contents_async(null, (fileObj, res) => {
            try {
                const [ok, contents] = fileObj.load_contents_finish(res);
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

/**
 * Load Bengali festivals JSON mapping.
 * 
 * @param {import('resource:///org/gnome/shell/extensions/extension.js').Extension} extension
 * @returns {Promise<object|null>}
 */
export async function loadFestivalsAsync(extension) {
    let dir = extension?.dir;
    if (!dir) {
        const path = extension?.path ?? extension?.metadata?.path;
        if (path)
            dir = Gio.File.new_for_path(path);
    }
    if (!dir)
        return null;

    const file = dir.get_child('lib')?.get_child('bengaliFestivals.json');
    if (!file)
        return null;

    const bytes = await new Promise((resolve) => {
        file.load_contents_async(null, (fileObj, res) => {
            try {
                const [ok, contents] = fileObj.load_contents_finish(res);
                resolve(ok ? contents : null);
            } catch (e) {
                debug('Failed to load festivals mapping; falling back', e);
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
        debug('Festivals JSON parse failed; falling back', e);
        return null;
    }

    if (!parsed || typeof parsed !== 'object') {
        warn('Festivals JSON has invalid structure');
        return null;
    }

    return parsed;
}
