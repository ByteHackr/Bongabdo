import GLib from 'gi://GLib';
import * as Assert from '../_assert.js';

function readText(path) {
    const [ok, bytes] = GLib.file_get_contents(path);
    Assert.assertTruthy(ok, `failed to read: ${path}`);
    return new TextDecoder('utf-8').decode(bytes);
}

// Integration smoke checks: ensure extension structure exists and follows patterns.

const extensionText = readText('extension.js');
const prefsText = readText('prefs.js');
const metadataText = readText('metadata.json');

// ===== Extension Structure Tests =====
Assert.assertTruthy(extensionText.includes('export default class'), 'extension.js should export a default class');
Assert.assertTruthy(extensionText.includes('extends Extension'), 'extension.js should extend Extension');
Assert.assertTruthy(extensionText.includes('enable()'), 'extension.js should have enable() method');
Assert.assertTruthy(extensionText.includes('disable()'), 'extension.js should have disable() method');

// ===== Settings Tests =====
Assert.assertTruthy(extensionText.includes('this.getSettings()'), 'extension.js should use this.getSettings()');
Assert.assertTruthy(extensionText.includes('get_string'), 'extension.js should read string settings');
Assert.assertTruthy(extensionText.includes('get_int'), 'extension.js should read int settings');
Assert.assertTruthy(extensionText.includes('get_boolean'), 'extension.js should read boolean settings');

// ===== Periodic Update Tests =====
Assert.assertTruthy(extensionText.includes('GLib.timeout_add_seconds'), 'extension.js should use periodic update');
Assert.assertTruthy(extensionText.includes('_updateDisplay'), 'extension.js should have updateDisplay method');

// ===== Module Import Tests =====
Assert.assertTruthy(extensionText.includes("./lib/bengaliCalendar.js"), 'extension.js should import lib/bengaliCalendar.js');
Assert.assertTruthy(extensionText.includes('import * as Bengali'), 'extension.js should import Bengali module');

// ===== UI Component Tests =====
Assert.assertTruthy(extensionText.includes('PanelMenu.Button'), 'extension.js should create PanelMenu.Button');
Assert.assertTruthy(extensionText.includes('PopupMenu.PopupMenuItem'), 'extension.js should use PopupMenuItem');
Assert.assertTruthy(extensionText.includes('St.Label'), 'extension.js should use St.Label');

// ===== Panel Position Tests =====
Assert.assertTruthy(extensionText.includes('addToStatusArea'), 'extension.js should add to status area');
Assert.assertTruthy(extensionText.includes('position'), 'extension.js should handle position setting');
Assert.assertTruthy(extensionText.includes('left') || extensionText.includes('right') || extensionText.includes('center'), 
    'extension.js should support panel positions');

// ===== Calendar Features Tests =====
Assert.assertTruthy(extensionText.includes('show-month-calendar'), 'extension.js should support month calendar');
Assert.assertTruthy(extensionText.includes('show-gregorian'), 'extension.js should support Gregorian date');
Assert.assertTruthy(extensionText.includes('show-festivals'), 'extension.js should support festivals');
Assert.assertTruthy(extensionText.includes('use-bengali-numerals'), 'extension.js should support Bengali numerals');

// ===== Preferences Tests =====
Assert.assertTruthy(prefsText.includes('export default class'), 'prefs.js should export a default class');
Assert.assertTruthy(prefsText.includes('extends ExtensionPreferences'), 'prefs.js should extend ExtensionPreferences');
Assert.assertTruthy(prefsText.includes('fillPreferencesWindow'), 'prefs.js should have fillPreferencesWindow');
Assert.assertTruthy(prefsText.includes('Adw.PreferencesPage'), 'prefs.js should use Adw preferences');

// ===== Metadata Tests =====
Assert.assertTruthy(metadataText.includes('"uuid"'), 'metadata.json should have uuid');
Assert.assertTruthy(metadataText.includes('"shell-version"'), 'metadata.json should have shell-version');
Assert.assertTruthy(metadataText.includes('"settings-schema"'), 'metadata.json should have settings-schema');

// ===== JSON Loading Tests =====
Assert.assertTruthy(extensionText.includes('bengaliMonthStarts.json'), 'extension.js should load month starts JSON');
Assert.assertTruthy(extensionText.includes('_loadMonthStarts'), 'extension.js should have loadMonthStarts method');

// ===== Cleanup Tests =====
Assert.assertTruthy(extensionText.includes('disconnect'), 'extension.js should disconnect settings');
Assert.assertTruthy(extensionText.includes('source_remove'), 'extension.js should remove timeout');
Assert.assertTruthy(extensionText.includes('destroy'), 'extension.js should destroy indicator');

console.log('All extension static tests passed!');
