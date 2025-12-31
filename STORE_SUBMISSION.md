# GNOME Extensions Store Submission Guide

This guide will help you submit the Bengali Calendar extension to the GNOME Extensions website.

## Prerequisites

1. **GitHub Account**: Create a GitHub account if you don't have one
2. **GitHub Repository**: Create a public repository for your extension
3. **GNOME Account**: Create an account on [extensions.gnome.org](https://extensions.gnome.org)

## Step 1: Prepare Your Repository

1. **Update metadata.json**:
   - ✅ Already updated with repository URL: `https://github.com/ByteHackr/Bongabdo`

2. **Update README.md**:
   - Update any placeholder URLs
   - Add screenshots if available
   - Ensure all instructions are clear

3. **Create a Release**:
   ```bash
   # Create a zip file
   make zip
   
   # This creates: build/bengali-calendar@bengali-calendar.github.io.zip
   ```

## Step 2: Upload to GNOME Extensions Website

1. **Go to Upload Page**:
   - Visit: https://extensions.gnome.org/upload/

2. **Upload Extension**:
   - Click "Choose File"
   - Select: `build/bengali-calendar@bengali-calendar.github.io.zip`
   - Click "Upload"

3. **Fill in Extension Details**:
   - **Name**: Bengali Calendar
   - **Description**: 
     ```
     Display Bengali calendar dates (বাংলা বর্ষপঞ্জি) in the GNOME Shell panel 
     with festivals, holidays, and customizable formats. Features include Bengali 
     numerals, multiple display formats, festival notifications, and Gregorian date 
     display option.
     ```
   - **Tags**: calendar, bengali, bangla, date, festival, holiday
   - **Screenshot**: Upload a screenshot showing the extension in action
   - **Homepage URL**: https://github.com/ByteHackr/Bongabdo

4. **Review and Submit**:
   - Review all information
   - Click "Submit for Review"

## Step 3: After Submission

1. **Wait for Review**:
   - GNOME team will review your extension
   - This usually takes a few days

2. **Address Feedback**:
   - Check your email for any feedback
   - Make necessary changes
   - Resubmit if needed

3. **Maintain Your Extension**:
   - Keep the extension updated for new GNOME Shell versions
   - Fix bugs as they're reported
   - Add new features based on user feedback

## Requirements Checklist

Before submitting, ensure:

- [x] Extension has a unique UUID
- [x] metadata.json is valid and complete
- [x] GSettings schema is properly defined
- [x] Preferences UI works correctly
- [x] Extension works on all declared shell versions (45, 46, 47)
- [x] README.md is comprehensive
- [x] LICENSE file is included
- [x] No hardcoded paths or user-specific settings
- [x] Extension follows GNOME Shell extension guidelines
- [x] Code is clean and well-commented

## Screenshot Guidelines

Take a screenshot showing:
1. The extension indicator in the GNOME Shell panel
2. The popup menu with Bengali date
3. The preferences window (optional but recommended)

**Screenshot Tips**:
- Use a clean desktop background
- Show Bengali text clearly
- Include both panel and popup if possible
- Recommended size: 1280x720 or larger

## Common Issues and Solutions

### Issue: Extension rejected for invalid UUID
**Solution**: Ensure UUID follows format: `name@domain.com` and is unique

### Issue: Schema compilation errors
**Solution**: Run `glib-compile-schemas schemas/` before creating zip

### Issue: Preferences not working
**Solution**: Ensure prefs.js is properly formatted and GSettings schema matches

### Issue: Extension doesn't work on certain GNOME versions
**Solution**: Test on all declared versions and update shell-version array

## Version Updates

When updating your extension:

1. **Increment Version**:
   - Update `version` in metadata.json
   - Update version in README.md

2. **Create New Release**:
   ```bash
   make zip
   ```

3. **Upload New Version**:
   - Go to your extension page on extensions.gnome.org
   - Click "Upload New Version"
   - Upload the new zip file
   - Add release notes

## Resources

- [GNOME Extensions Website](https://extensions.gnome.org)
- [GNOME Shell Extension Guidelines](https://gjs.guide/extensions/)
- [GSettings Documentation](https://developer.gnome.org/gio/stable/GSettings.html)
- [GNOME Shell JavaScript Documentation](https://gjs-docs.gnome.org/)

## Support

If you encounter issues:
1. Check GNOME Extensions website FAQ
2. Ask in GNOME Discourse forums
3. Check extension logs: `journalctl -f | grep -i bengali`

Good luck with your submission! 🚀

