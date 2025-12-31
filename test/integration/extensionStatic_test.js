import GLib from 'gi://GLib';
import * as Assert from '../_assert.js';

function readText(path) {
    const [ok, bytes] = GLib.file_get_contents(path);
    Assert.assertTruthy(ok, `failed to read: ${path}`);
    return new TextDecoder('utf-8').decode(bytes);
}

// Integration smoke checks: ensure extension structure exists and follows patterns.

const extensionText = readText('extension.js');
const indicatorText = readText('lib/indicator.js');
const monthStartsText = readText('lib/monthStarts.js');
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
Assert.assertTruthy(extensionText.includes('get_boolean') || indicatorText.includes('get_boolean'),
    'code should read boolean settings');
Assert.assertTruthy(extensionText.includes('connectObject'), 'extension.js should use connectObject for signals');
Assert.assertTruthy(extensionText.includes('disconnectObject'), 'extension.js should disconnectObject on disable');

// ===== Periodic Update Tests =====
Assert.assertTruthy(extensionText.includes('GLib.timeout_add_seconds'), 'extension.js should use periodic update');
Assert.assertTruthy(extensionText.includes('GLib.source_remove'), 'extension.js should remove timeout on disable');

// ===== Module Import Tests =====
Assert.assertTruthy(extensionText.includes("./lib/indicator.js"), 'extension.js should import indicator module');
Assert.assertTruthy(indicatorText.includes("./bengaliCalendar.js"), 'indicator should import Bengali calendar logic');

// ===== UI Component Tests =====
Assert.assertTruthy(indicatorText.includes('PanelMenu.Button'), 'indicator should create PanelMenu.Button');
Assert.assertTruthy(indicatorText.includes('PopupMenu.PopupMenuItem'), 'indicator should use PopupMenuItem');
Assert.assertTruthy(indicatorText.includes('St.Label'), 'indicator should use St.Label');

// ===== Panel Position Tests =====
Assert.assertTruthy(indicatorText.includes('addToStatusArea'), 'indicator should add to status area');
Assert.assertTruthy(extensionText.includes('position') || indicatorText.includes('position'), 'code should handle position setting');
Assert.assertTruthy(indicatorText.includes('left') || indicatorText.includes('right') || indicatorText.includes('center'),
    'indicator should support panel positions');

// ===== Calendar Features Tests =====
const combined = extensionText + indicatorText + monthStartsText;
Assert.assertTruthy(combined.includes('show-month-calendar'), 'code should support month calendar');
Assert.assertTruthy(combined.includes('show-gregorian'), 'code should support Gregorian date');
Assert.assertTruthy(combined.includes('show-festivals'), 'code should support festivals');
Assert.assertTruthy(combined.includes('use-bengali-numerals'), 'code should support Bengali numerals');

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
Assert.assertTruthy(monthStartsText.includes('bengaliMonthStarts.json'), 'monthStarts loader should reference bengaliMonthStarts.json');

// ===== Cleanup Tests =====
Assert.assertTruthy(extensionText.includes('disconnectObject'), 'extension.js should disconnectObject in disable');
Assert.assertTruthy(extensionText.includes('source_remove'), 'extension.js should remove timeout in disable');
Assert.assertTruthy(indicatorText.includes('destroy()'), 'indicator should implement destroy()');

console.log('All extension static tests passed!');
