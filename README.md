# Bengali Calendar GNOME Extension

A feature-rich GNOME Shell extension that displays the current Bengali calendar date (বাংলা বর্ষপঞ্জি) in the top panel with festivals, holidays, and customizable display formats.

![Bengali Calendar Extension](https://img.shields.io/badge/GNOME-Shell%2045%2B-blue)
![Version](https://img.shields.io/badge/version-2.0-green)

## ✨ Features

### Core Features
- 📅 **Bengali Date Display**: Shows Bengali calendar date with day name, date, month, and year
- 🔢 **Bengali Numerals**: Option to use Bengali numerals (০-৯) or Western numerals
- 🎉 **Festivals & Holidays**: Displays Bengali festivals and holidays in popup menu
- 🌍 **Dual Calendar**: Option to show Gregorian date alongside Bengali date
- ⚙️ **Customizable Formats**: Multiple display formats (Full, Short, Date Only, Compact)
- 🎨 **Customizable Appearance**: Adjustable font size and panel position
- 🔄 **Auto-update**: Updates automatically every minute

### Display Formats
- **Full**: `রবিবার, ১৫ বৈশাখ ১৪৩১` (Day, Date Month Year)
- **Short**: `১৫ বৈশাখ` (Date Month)
- **Date Only**: `১৫ বৈশাখ ১৪৩১` (Date Month Year)
- **Compact**: `১৫/১/১৪৩১` (DD/MM/YYYY)

### Bengali Festivals Included
- পহেলা বৈশাখ (Pohela Boishakh)
- রবীন্দ্রনাথ ঠাকুরের জন্মদিন
- কাজী নজরুল ইসলামের জন্মদিন
- দুর্গা পূজা
- কালী পূজা
- And many more...

## 📦 Installation

### Method 1: Using Makefile (Recommended)

```bash
# Clone the repository
git clone https://github.com/ByteHackr/Bongabdo.git
cd Bongabdo

# Install the extension
make install

# Enable the extension
make enable

# Restart GNOME Shell (Alt+F2, type 'r', Enter)
```

### Method 2: Manual Installation

1. **Copy extension files**:
   ```bash
   mkdir -p ~/.local/share/gnome-shell/extensions/bengali-calendar@bengali-calendar.github.io
   cp -r * ~/.local/share/gnome-shell/extensions/bengali-calendar@bengali-calendar.github.io/
   ```

2. **Compile schemas**:
   ```bash
   cd ~/.local/share/gnome-shell/extensions/bengali-calendar@bengali-calendar.github.io
   glib-compile-schemas schemas/
   ```

3. **Restart GNOME Shell**:
   - Press `Alt + F2`, type `r`, and press Enter
   - Or log out and log back in

4. **Enable the extension**:
   - Open GNOME Extensions app
   - Find "Bengali Calendar" and toggle it on
   - Or use: `gnome-extensions enable bengali-calendar@bengali-calendar.github.io`

### Method 3: From GNOME Extensions Website

1. Visit [extensions.gnome.org](https://extensions.gnome.org)
2. Search for "Bengali Calendar"
3. Click "Install" (requires browser extension)

## 🔧 Requirements

- **GNOME Shell**: 45, 46, or 47
- **Bengali Fonts**: Recommended fonts for proper display

### Installing Bengali Fonts

**Fedora/RHEL:**
```bash
sudo dnf install google-noto-sans-bengali-fonts
```

**Ubuntu/Debian:**
```bash
sudo apt-get install fonts-noto fonts-beng
```

**Arch Linux:**
```bash
sudo pacman -S noto-fonts noto-fonts-bengali
```

**openSUSE:**
```bash
sudo zypper install google-noto-sans-bengali-fonts
```

## ⚙️ Configuration

Access preferences by:
1. Opening GNOME Extensions app
2. Clicking the gear icon next to "Bengali Calendar"
3. Or right-clicking the extension indicator and selecting "Preferences"

### Available Settings

- **Display Format**: Choose how the date appears in the panel
- **Show Gregorian Date**: Toggle Gregorian date in popup menu
- **Show Festivals**: Toggle festival/holiday display
- **Use Bengali Numerals**: Switch between Bengali (০-৯) and Western (0-9) numerals
- **Font Size**: Adjust font size (8-24pt)
- **Panel Position**: Choose left or right side of panel

## 📖 Usage

Once enabled, the Bengali date appears in your GNOME Shell top panel. Click on it to see:
- Full Bengali date
- Gregorian date (if enabled)
- Today's festivals/holidays (if any)

## 📁 Project Structure

```
bengali-calendar@bengali-calendar.github.io/
├── extension.js          # Main extension code
├── metadata.json          # Extension metadata
├── stylesheet.css         # Styling
├── prefs.js              # Preferences widget code
├── schemas/
│   └── org.gnome.shell.extensions.bengali-calendar.gschema.xml
├── Makefile              # Installation helper
├── README.md             # This file
└── .gitignore
```

## 🔄 Updating the Extension

After installing updates:
```bash
cd Bongabdo
git pull
make install
# Restart GNOME Shell (Alt+F2, type 'r', Enter)
```

## 🐛 Troubleshooting

### Extension not showing
- Ensure GNOME Shell was restarted after installation
- Check if extension is enabled: `gnome-extensions list --enabled`
- Check logs: `journalctl -f | grep -i bengali`

### Bengali text not displaying correctly
- Install Bengali fonts (see Requirements)
- Verify fonts: `fc-list | grep -i bengali`
- Restart GNOME Shell

### Date seems incorrect
- The conversion uses standard Bengali calendar rules
- Bengali New Year (Pohela Boishakh) typically falls on April 14-15
- For precise astronomical calculations, the algorithm may need refinement

### Settings not saving
- Ensure schemas are compiled: `glib-compile-schemas schemas/`
- Check schema file exists and is valid

## 📝 Contributing

Contributions are welcome! Please open an issue or submit a pull request on [GitHub](https://github.com/ByteHackr/Bongabdo).

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Bengali calendar conversion algorithm based on standard Bengali calendar rules
- Inspired by the need for Bengali calendar support in GNOME Shell
- Thanks to the GNOME Shell extension community

## 🔗 Links

- [GNOME Extensions Website](https://extensions.gnome.org)
- [GNOME Shell Extension Documentation](https://gjs.guide/extensions/)
- [Bengali Calendar Information](https://en.wikipedia.org/wiki/Bengali_calendars)

## 📊 Version History

### Version 2.0
- ✨ Added preferences/settings system
- ✨ Added popup menu with detailed information
- ✨ Added festival/holiday display
- ✨ Added multiple display formats
- ✨ Added Gregorian date option
- ✨ Added customizable font size
- ✨ Added panel position option
- 🐛 Improved Bengali calendar conversion accuracy

### Version 1.0
- 🎉 Initial release
- Basic Bengali date display
- Bengali numerals support

---

Made with ❤️ for the Bengali-speaking GNOME community
