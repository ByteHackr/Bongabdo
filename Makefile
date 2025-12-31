# Makefile for Bengali Calendar GNOME Extension

UUID = bongabdo@bongabdo.github.io
INSTALL_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)
SCHEMA_DIR = $(INSTALL_DIR)/schemas

.PHONY: install uninstall enable disable zip clean

install: install-files compile-schemas
	@echo "Extension installed to $(INSTALL_DIR)"
	@echo "Restart GNOME Shell (Alt+F2, type 'r') or log out and back in"
	@echo "Then enable the extension using: gnome-extensions enable $(UUID)"

install-files:
	@mkdir -p $(INSTALL_DIR)
	@cp -r extension.js metadata.json stylesheet.css prefs.js schemas lib icon.svg icon-symbolic.svg $(INSTALL_DIR)/
	@echo "Files copied to $(INSTALL_DIR)"
	@echo "Note: Update lib/bengaliMonthStarts.json from Panjika each year for accurate West Bengal dates"

compile-schemas:
	@mkdir -p $(SCHEMA_DIR)
	@glib-compile-schemas $(SCHEMA_DIR)
	@echo "Schemas compiled"

uninstall:
	@rm -rf $(INSTALL_DIR)
	@echo "Extension uninstalled"

enable:
	gnome-extensions enable $(UUID)

disable:
	gnome-extensions disable $(UUID)

zip: clean
	@mkdir -p build
	@zip -r build/$(UUID).zip \
		extension.js metadata.json stylesheet.css prefs.js LICENSE \
		icon.svg icon-symbolic.svg \
		schemas lib \
		-x "schemas/gschemas.compiled"
	@echo "Extension packaged to build/$(UUID).zip"

clean:
	@rm -rf build
	@echo "Build directory cleaned"

