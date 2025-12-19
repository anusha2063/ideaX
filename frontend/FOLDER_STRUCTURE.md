# Frontend Folder Structure

## Overview
The frontend has been reorganized into a clean, scalable structure that follows React best practices.

## New Structure

```
src/
├── components/
│   ├── common/              # Reusable UI components
│   │   └── ThemeToggle/
│   │       ├── index.js
│   │       └── ThemeToggle.css
│   ├── features/            # Feature-specific components
│   │   ├── Dashboard/
│   │   │   ├── index.js
│   │   │   └── Dashboard.css
│   │   ├── Home/
│   │   │   ├── index.js
│   │   │   └── Home.css
│   │   └── MapView/
│   │       ├── index.js
│   │       └── MapView.css
│   └── layout/              # Layout components (reserved for future)
├── constants/
│   └── config.js            # Application configuration constants
├── services/
│   └── api.js               # API communication utilities
├── styles/
│   ├── App.css              # App-level styles
│   ├── index.css            # Global styles and CSS variables
│   └── theme-adjustments.css
└── utils/
    └── validators.js        # Data validation utilities
```

## Key Benefits

### 1. **Better Organization**
- Components are grouped by purpose (common, features, layout)
- Clear separation between UI and business logic
- Easy to locate files

### 2. **Scalability**
- Easy to add new features without cluttering root
- Services and utilities are centralized
- Constants are in one place

### 3. **Maintainability**
- Related files are grouped together
- Import paths are logical and consistent
- Styles are co-located with components

### 4. **Team Collaboration**
- Clear structure for new developers
- Standard patterns for adding features
- Reduces merge conflicts

## Import Path Examples

### Before (Old Structure)
```javascript
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import ThemeToggle from './components/ThemeToggle';
import './App.css';
```

### After (New Structure)
```javascript
import Home from './components/features/Home';
import Dashboard from './components/features/Dashboard';
import ThemeToggle from './components/common/ThemeToggle';
import './styles/App.css';
```

## Available Constants (config.js)

```javascript
API_BASE_URL           // Backend API URL
POLLING_INTERVALS      // Polling configuration
KEYBOARD_SHORTCUTS     // Keyboard shortcut keys
MAP_CONFIG            // Default map settings
```

## Available Services (api.js)

```javascript
api.checkStatus()      // Check backend status
api.getTrailData()     // Fetch trail GeoJSON
api.setBaseLocation()  // Set base location
```

## Available Utils (validators.js)

```javascript
isValidCoordinate()    // Validate single coordinate
filterValidCoordinates() // Filter array of coordinates
```

## Migration Completed

✅ All components moved to organized structure
✅ All imports updated correctly
✅ CSS files moved to styles folder
✅ New utility files created (config, api, validators)
✅ Build tested successfully (compiles without errors)
✅ Dev server tested (runs on http://localhost:3000)
✅ No breaking changes - all functionality preserved

## Testing Checklist

- [x] App builds successfully
- [x] Dev server starts without errors
- [x] All imports resolve correctly
- [x] No console errors
- [x] Theme toggle works
- [x] Navigation works
- [x] Components render correctly

## Future Enhancements

The following folders are ready for future additions:

- **components/layout/** - For Navbar, Footer, Header components
- **services/** - For additional API services (auth, analytics, etc.)
- **utils/** - For helper functions (formatters, calculators, etc.)
- **constants/** - For additional configuration files

## Notes

- All functionality remains identical to before reorganization
- No code logic was changed, only file locations
- The structure follows industry-standard React patterns
- Easy to scale as the project grows
