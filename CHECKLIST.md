# GNOME Shell Extension Compliance Checklist

Based on [gjs.guide/extensions/](https://gjs.guide/extensions/)

## ✅ Required Files

- [x] **metadata.json** - Extension metadata with required fields
- [x] **extension.js** - Main extension code with init/enable/disable functions
- [x] **prefs.js** - Preferences widget (if extension has settings)
- [x] **schemas/** - GSettings schema directory
- [x] **stylesheet.css** - Optional styling

## ✅ Metadata.json Requirements

- [x] **uuid**: Unique identifier (`bengali-calendar@bengali-calendar.github.io`)
- [x] **name**: Extension name (`Bengali Calendar`)
- [x] **description**: Clear description
- [x] **shell-version**: Array of supported versions (`["45", "46", "47"]`)
- [x] **url**: Repository URL (needs to be updated with actual GitHub URL)
- [x] **version**: Version number (`2`)
- [x] **settings-schema**: GSettings schema ID
- [x] **gettext-domain**: Translation domain (optional but included)

## ✅ Extension Structure

### init() Function
- [x] Minimal initialization
- [x] No object creation before enable()
- [x] Settings initialization (acceptable)

### enable() Function
- [x] Creates all UI elements
- [x] Connects signals
- [x] Adds main loop sources (GLib.timeout_add_seconds)
- [x] Adds to panel

### disable() Function
- [x] Disconnects all signals
- [x] Removes main loop sources
- [x] Destroys all objects
- [x] Sets variables to null

## ✅ Code Quality

- [x] Clean, consistent indentation
- [x] Proper comments
- [x] No hardcoded paths
- [x] No user-specific settings
- [x] Proper error handling
- [x] Uses ExtensionUtils.getSettings() for preferences

## ✅ Preferences

- [x] **prefs.js** implements `buildPrefsWidget()` function
- [x] Uses GTK widgets (GTK3 for Shell 45-47)
- [x] GSettings schema properly defined
- [x] Settings bindings work correctly
- [x] Preferences window is accessible

## ✅ GSettings Schema

- [x] Schema file in `schemas/` directory
- [x] Proper schema ID format
- [x] All keys have defaults
- [x] Proper types (string, boolean, integer)
- [x] Descriptions and summaries included

## ✅ Imports

- [x] Uses proper GNOME Shell imports
- [x] Uses ExtensionUtils for settings
- [x] No unnecessary imports
- [x] Proper module imports

## ✅ Functionality

- [x] Extension serves clear purpose
- [x] Works on declared shell versions
- [x] No external binaries required
- [x] No external scripts (all in GJS)
- [x] Proper cleanup on disable

## ✅ Documentation

- [x] README.md with installation instructions
- [x] LICENSE file (GPL-3.0)
- [x] Clear description in metadata.json
- [x] Code comments where needed

## ⚠️ Notes

1. **URL Field**: Update `metadata.json` with actual GitHub repository URL before submission
2. **GTK Version**: Using GTK3 for Shell 45-47 (acceptable). For Shell 48+, consider GTK4 migration
3. **Testing**: Test on all declared shell versions (45, 46, 47)
4. **Screenshots**: Prepare screenshots for store submission

## 📋 Pre-Submission Checklist

Before submitting to extensions.gnome.org:

- [ ] Update `url` in metadata.json with actual GitHub URL
- [ ] Test extension on GNOME Shell 45
- [ ] Test extension on GNOME Shell 46
- [ ] Test extension on GNOME Shell 47
- [ ] Verify preferences work correctly
- [ ] Take screenshots for store
- [ ] Create zip package: `make zip`
- [ ] Review code one more time
- [ ] Check for any console errors: `journalctl -f | grep -i bengali`

## 🔗 References

- [GNOME Shell Extensions Guide](https://gjs.guide/extensions/)
- [Review Guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html)
- [Extension Anatomy](https://gjs.guide/extensions/overview/anatomy.html)
- [Preferences Guide](https://gjs.guide/extensions/development/preferences.html)

