# Theme System Documentation

## Overview
The SkyWeave application now supports both **Dark Mode** (default) and **Light Mode** with seamless switching.

## Features

### 🎨 Dual Theme Support
- **Dark Mode**: Warm dark theme with nature-tech fusion colors
- **Light Mode**: Clean light theme with excellent readability
- **Smooth Transitions**: All elements smoothly transition between themes

### 💾 Persistent Preference
- Theme preference is saved in `localStorage`
- Automatically restored on page reload
- No registration or account needed

### 🎯 Theme Toggle Button
Located in the navbar with:
- Animated sun/moon icon
- Visual slider indicator
- Current theme label
- Responsive design (icon-only on mobile)

## Technical Implementation

### CSS Variables
Both themes use the same color palette but different backgrounds and text colors:
- Primary: Deep Teal (`hsl(160, 45%, 45%)`)
- Secondary: Warm Rust (`hsl(28, 70%, 55%)`)
- Accent: Golden Amber (`hsl(45, 85%, 62%)`)

### Theme Switching
Themes are applied via `data-theme` attribute on the `<body>` element:
```html
<body data-theme="dark">  <!-- or "light" -->
```

### Files Modified
1. `index.css` - Added theme CSS variables
2. `App.css` - Added light theme adjustments
3. `theme-adjustments.css` - Comprehensive light theme styling
4. `ThemeToggle.js` - React component for theme switching
5. `ThemeToggle.css` - Styling for toggle button
6. `App.js` - Integrated ThemeToggle component

## Usage

### For Users
1. Look for the theme toggle button in the top-right of the navbar
2. Click to switch between Dark and Light modes
3. Your preference is automatically saved

### For Developers
To add theme support to new components:
```css
/* Default/Dark theme */
.my-component {
  background: var(--bg-card);
  color: var(--text-primary);
}

/* Light theme override */
body[data-theme="light"] .my-component {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
```

## Color Variables

### Available in Both Themes
- `--color-primary`, `--color-secondary`, `--color-accent`
- `--color-success`, `--color-warning`, `--color-danger`

### Theme-Dependent Variables
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- `--bg-card`, `--bg-elevated`
- `--text-primary`, `--text-secondary`, `--text-tertiary`
- `--border-color`
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`

## Browser Support
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## No Breaking Changes
- All existing functionality preserved
- No API changes required
- Backend unaffected
- Gradual enhancement approach
