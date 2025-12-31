# Bengali Calendar (GNOME Shell)

Shows Bengali date in the top panel with optional festivals and Gregorian date.

- Formats: full, short, date-only, compact; Bengali or Western numerals.
- Popup: Bengali date, optional Gregorian date, today’s festivals (toggle).
- Settings: format, numerals, show Gregorian, show festivals, font size, left/right panel position.
- GNOME Shell 45–47.

## Install
```bash
git clone https://github.com/ByteHackr/Bongabdo.git
cd Bongabdo
make install
make enable
# restart Shell (Alt+F2, r, Enter)
```
Manual: copy repo to `~/.local/share/gnome-shell/extensions/bengali-calendar@bengali-calendar.github.io/` and run `glib-compile-schemas schemas/`.

## Preferences
Open GNOME Extensions app → gear icon, or right-click the indicator → Preferences.

## Development
- Run tests: `./test/run-tests.sh` (uses gjs).
- CI: GitHub Actions runs the same suite on push/PR.

## Notes
- Font: any Bengali-capable font (Noto Sans Bengali recommended).
- Calendar conversion is heuristic (fixed Pohela Boishakh on Apr 14; simple month lengths). For strict accuracy, a richer dataset/algorithm is needed.

## License
MIT.
