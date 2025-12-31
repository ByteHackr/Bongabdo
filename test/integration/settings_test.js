import * as Assert from '../_assert.js';
import GLib from 'gi://GLib';

// Test that all settings are properly defined in schema

function readText(path) {
    const [ok, bytes] = GLib.file_get_contents(path);
    Assert.assertTruthy(ok, `failed to read: ${path}`);
    return new TextDecoder('utf-8').decode(bytes);
}

const schemaText = readText('schemas/org.gnome.shell.extensions.bongabdo.gschema.xml');
const extensionText = readText('extension.js');
const indicatorText = readText('lib/indicator.js');
const monthStartsText = readText('lib/monthStarts.js');
const prefsText = readText('prefs.js');

// Required settings
const requiredSettings = [
    'display-format',
    'show-gregorian',
    'show-festivals',
    'use-bengali-numerals',
    'font-size',
    'position',
    'location',
    'show-month-calendar',
];

// Test schema has all settings
requiredSettings.forEach(setting => {
    Assert.assertTruthy(schemaText.includes(`name="${setting}"`), 
        `Schema should define ${setting}`);
});

// Test extension uses all settings
requiredSettings.forEach(setting => {
    const combined = extensionText + indicatorText + monthStartsText;
    Assert.assertTruthy(combined.includes(setting),
        `Code should use ${setting} setting`);
});

// Test prefs UI has all settings
const prefsSettings = [
    'display-format',
    'show-gregorian',
    'show-festivals',
    'use-bengali-numerals',
    'font-size',
    'position',
    'location',
    'show-month-calendar',
];

prefsSettings.forEach(setting => {
    Assert.assertTruthy(prefsText.includes(setting), 
        `Preferences UI should have ${setting} control`);
});

// Test default values
Assert.assertTruthy(schemaText.includes('<default>\'full\'</default>'), 'display-format default should be full');
Assert.assertTruthy(schemaText.includes('<default>false</default>'), 'show-gregorian default should be false');
Assert.assertTruthy(schemaText.includes('<default>true</default>'), 'show-festivals default should be true');
Assert.assertTruthy(schemaText.includes('<default>14</default>'), 'font-size default should be 14');
Assert.assertTruthy(schemaText.includes('<default>\'right\'</default>'), 'position default should be right');
Assert.assertTruthy(schemaText.includes('<default>\'west-bengal\'</default>'), 'location default should be west-bengal');

// Test position options
Assert.assertTruthy(schemaText.includes('left') || extensionText.includes('left'), 'should support left position');
Assert.assertTruthy(schemaText.includes('right') || extensionText.includes('right'), 'should support right position');
Assert.assertTruthy(schemaText.includes('center') || extensionText.includes('center'), 'should support center position');

// Test location options
Assert.assertTruthy(prefsText.includes('West Bengal'), 'should have West Bengal option');
Assert.assertTruthy(prefsText.includes('Bangladesh'), 'should have Bangladesh option');
Assert.assertTruthy(prefsText.includes('India'), 'should have India option');

console.log('All settings tests passed!');
