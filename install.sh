#!/bin/bash
# Installation script for Bengali Calendar GNOME Extension

UUID="bengali-calendar@bengali-calendar.github.io"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"

echo "Installing Bengali Calendar GNOME Extension..."

# Create extension directory
mkdir -p "$EXTENSION_DIR"

# Copy files
cp extension.js metadata.json stylesheet.css prefs.js "$EXTENSION_DIR/"
cp -r schemas "$EXTENSION_DIR/"

# Compile schemas
echo "Compiling schemas..."
glib-compile-schemas "$EXTENSION_DIR/schemas"

echo "Extension installed to $EXTENSION_DIR"
echo ""
echo "Next steps:"
echo "1. Restart GNOME Shell (Alt+F2, type 'r', Enter)"
echo "2. Enable the extension:"
echo "   gnome-extensions enable $UUID"
echo "   Or use GNOME Extensions app"
echo ""
echo "Installation complete!"

