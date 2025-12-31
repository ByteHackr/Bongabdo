import GLib from 'gi://GLib';
import * as Assert from '../_assert.js';

function readText(path) {
  const [ok, bytes] = GLib.file_get_contents(path);
  Assert.assertTruthy(ok, `failed to read: ${path}`);
  return new TextDecoder('utf-8').decode(bytes);
}

// Integration-ish smoke checks: ensure extension structure exists.
const extensionText = readText('extension.js');

Assert.assertTruthy(extensionText.includes('export default class'), 'extension.js should export a default class');
Assert.assertTruthy(extensionText.includes('extends Extension'), 'extension.js should extend Extension');

// Ensure it uses GSettings and sets up periodic update
Assert.assertTruthy(extensionText.includes('this.getSettings()'), 'extension.js should use this.getSettings()');
Assert.assertTruthy(extensionText.includes('GLib.timeout_add_seconds'), 'extension.js should use periodic update');

// Ensure the pure module exists and is imported
Assert.assertTruthy(extensionText.includes("./lib/bengaliCalendar.js"), 'extension.js should import lib/bengaliCalendar.js');


