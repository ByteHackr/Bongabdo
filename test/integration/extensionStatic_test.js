const Assert = imports._assert;
const { GLib } = imports.gi;

function readText(path) {
  const [ok, bytes] = GLib.file_get_contents(path);
  Assert.assertTruthy(ok, `failed to read: ${path}`);
  return imports.byteArray.toString(bytes);
}

// Integration-ish smoke checks: ensure extension structure exists.
const extensionText = readText('extension.js');

Assert.assertTruthy(extensionText.includes('function init()'), 'extension.js should export init()');
Assert.assertTruthy(extensionText.includes('function enable()'), 'extension.js should export enable()');
Assert.assertTruthy(extensionText.includes('function disable()'), 'extension.js should export disable()');

// Ensure it uses settings schema and sets up periodic update
Assert.assertTruthy(extensionText.includes("ExtensionUtils.getSettings('org.gnome.shell.extensions.bengali-calendar')"),
  'extension.js should use correct settings schema');
Assert.assertTruthy(extensionText.includes('GLib.timeout_add_seconds'), 'extension.js should use periodic update');

// Ensure the pure module exists and is imported
Assert.assertTruthy(extensionText.includes('Me.imports.lib.bengaliCalendar'), 'extension.js should import lib/bengaliCalendar');


