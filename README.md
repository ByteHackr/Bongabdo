# Bongabdo (GNOME Shell)

A Simple Bengali Calendar Extension for Gnome Shell.

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
Manual: copy repo to `~/.local/share/gnome-shell/extensions/bongabdo@bongabdo.github.io/` and run `glib-compile-schemas schemas/`.

## Preferences
Open GNOME Extensions app → gear icon, or right-click the indicator → Preferences.

## Development
- Run tests: `./test/run-tests.sh` (uses `gjs -m`).
- CI: GitHub Actions runs the same suite on push/PR.

## Notes
- Font: any Bengali-capable font (Noto Sans Bengali recommended).
- **West Bengal Calendar**: Uses `lib/bengaliMonthStarts.json` mapping (West Bengal Surya Siddhanta). Update from Panjika each year for accuracy. Falls back to heuristic (Apr 14 = Pohela Boishakh) if JSON missing.

## License
MIT.
