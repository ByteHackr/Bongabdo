# Quick Start Guide

## Installation (Choose One Method)

### Method 1: Using Makefile
```bash
make install
make enable
# Restart GNOME Shell (Alt+F2, type 'r')
```

### Method 2: Using Install Script
```bash
./install.sh
# Restart GNOME Shell (Alt+F2, type 'r')
gnome-extensions enable bengali-calendar@bengali-calendar.github.io
```

### Method 3: Manual Installation
```bash
mkdir -p ~/.local/share/gnome-shell/extensions/bengali-calendar@bengali-calendar.github.io
cp -r extension.js metadata.json stylesheet.css prefs.js schemas ~/.local/share/gnome-shell/extensions/bengali-calendar@bengali-calendar.github.io/
cd ~/.local/share/gnome-shell/extensions/bengali-calendar@bengali-calendar.github.io
glib-compile-schemas schemas/
# Restart GNOME Shell (Alt+F2, type 'r')
gnome-extensions enable bengali-calendar@bengali-calendar.github.io
```

## Configuration

1. Open GNOME Extensions app
2. Find "Bengali Calendar"
3. Click the gear icon ⚙️ to open preferences
4. Customize:
   - Display format
   - Show/hide Gregorian date
   - Show/hide festivals
   - Use Bengali or Western numerals
   - Font size
   - Panel position

## Features

- **Panel Display**: Shows Bengali date in top panel
- **Click to View**: Click the date to see:
  - Full Bengali date
  - Gregorian date (if enabled)
  - Today's festivals/holidays (if any)

## Troubleshooting

**Extension not showing?**
- Restart GNOME Shell: `Alt+F2`, type `r`, Enter
- Check if enabled: `gnome-extensions list --enabled | grep bengali`

**Bengali text not displaying?**
- Install fonts: `sudo dnf install google-noto-sans-bengali-fonts` (Fedora)
- Or: `sudo apt-get install fonts-noto fonts-beng` (Ubuntu/Debian)

**Need help?**
- Check README.md for detailed documentation
- Check logs: `journalctl -f | grep -i bengali`

## Creating Package for Store

```bash
make zip
# Upload build/bengali-calendar@bengali-calendar.github.io.zip to extensions.gnome.org
```

See STORE_SUBMISSION.md for detailed submission guide.

