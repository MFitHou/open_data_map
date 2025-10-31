# Project Structure Refactoring

# Project Structure Refactoring

## 📁 New Folder Structure

```
src/
├── components/              # All components (.tsx files only)
│   ├── ui/                 # Reusable UI components
│   │   ├── CurrentLocationButton.tsx
│   │   ├── DownloadButton.tsx
│   │   ├── Info.tsx
│   │   ├── InfoPanel.tsx
│   │   ├── SearchResult.tsx
│   │   └── index.ts
│   │
│   ├── map/                # Map-specific components
│   │   ├── SimpleMap.tsx
│   │   ├── Search.tsx
│   │   ├── FlyToLocation.tsx
│   │   ├── NearbyMarkers.tsx
│   │   ├── MemberOutlines.tsx
│   │   ├── MapChatbot.tsx
│   │   ├── MapIcons.ts
│   │   ├── MapUtils.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── chatbot/            # Chatbot components
│   │   ├── Chatbot.tsx
│   │   └── ChatInput.tsx
│   │
│   ├── home/               # Home page
│   │   └── Home.tsx
│   │
│   └── query/              # Query page
│       └── Query.tsx
│
├── styles/                 # All CSS files organized by type
│   ├── components/         # Component styles
│   │   ├── CurrentLocationButton.css
│   │   ├── DownloadButton.css
│   │   ├── Info.css
│   │   ├── InfoPanel.css
│   │   ├── Search.css
│   │   ├── MapChatbot.css
│   │   └── Chatbot.css
│   │
│   └── pages/              # Page styles
│       ├── Home.css
│       └── Query.css
│
├── hooks/                  # Custom React hooks
│   ├── useCurrentLocation.ts
│   ├── useTour.ts
│   └── index.ts
│
├── tours/                  # Tour configuration
│   ├── HelpButton.tsx
│   ├── tourConfig.ts
│   ├── driverStyles.css
│   └── README.md
│
└── utils/                  # Utility functions
    ├── dataExport.ts
    ├── linkResolver.ts
    ├── nearbyApi.ts
    ├── overpass.ts
    ├── rdfParser.ts
    └── wikidataUtils.ts
```

## 🎯 What Changed?

### 1. **Separation by Type** ✨
Files are now organized by their type/purpose:

**Components (`components/`)**
- Only `.tsx` and `.ts` files
- No CSS files
- Organized by feature/domain

**Styles (`styles/`)**
- All CSS files in one place
- `components/` - Component styles
- `pages/` - Page-level styles

**Hooks (`hooks/`)**
- All custom React hooks
- Reusable logic extraction

**Benefits:**
- ✅ Clear separation of concerns
- ✅ Easy to find all styles in one place
- ✅ Easy to find all components
- ✅ Easy to find all hooks
- ✅ Better for large teams

## 🔄 Import Changes

### Before:
```tsx
import { InfoPanel } from './InfoPanel';
import { useCurrentLocation } from './useCurrentLocation';
import './Search.css';
```

### After:
```tsx
// Components from ui/
import { InfoPanel, DownloadButton } from '../ui';

// Hooks from hooks/
import { useCurrentLocation, useTour } from '../../hooks';

// Styles from styles/
import '../../styles/components/Search.css';
import '../../styles/pages/Home.css';
```

## 📝 Migration Guide

### For Components:
1. ✅ UI components moved from `components/map/` → `components/ui/`
2. ✅ Update imports to use `from '../ui'` or `from '../../ui'`
3. ✅ CSS imports changed from `../../styles/X.css` → `./X.css`

### For Hooks:
1. ✅ Hooks moved from `components/map/` and `tours/` → `hooks/`
2. ✅ Update imports to use `from '../../hooks'` or `from '../hooks'`

### For CSS:
1. ✅ All component CSS moved from `styles/` to component folders
2. ✅ CSS imports updated to relative paths `./ComponentName.css`
3. ✅ `styles/` folder completely removed

### For Existing Code:
- ✅ `SimpleMap.tsx` updated with new imports
- ✅ `HelpButton.tsx` updated to use `hooks/useTour`
- ✅ `Search.tsx`, `Home.tsx`, `Query.tsx` updated with co-located CSS
- ✅ Old files removed from `components/map/`

## ✅ Files Status

### ✨ New Files Created:
- `components/ui/` - 10 files (5 components + 5 CSS + index.ts)
- `hooks/` - 3 files (2 hooks + index.ts)

### ✏️ Updated Files:
- `components/map/SimpleMap.tsx` - Updated imports to use ui/ and hooks/
- `components/map/Search.tsx` - CSS import updated to ./Search.css
- `components/home/Home.tsx` - CSS import updated to ./Home.css
- `components/query/Query.tsx` - CSS import updated to ./Query.css
- `tours/HelpButton.tsx` - Hook import updated to use hooks/
- `components/map/index.ts` - Removed exports of moved components

### �️ Deleted Files:
- `components/map/CurrentLocationButton.tsx` ✅
- `components/map/DownloadButton.tsx` ✅
- `components/map/Info.tsx` ✅
- `components/map/InfoPanel.tsx` ✅
- `components/map/SearchResult.tsx` ✅
- `components/map/useCurrentLocation.ts` ✅
- `tours/useTour.ts` ✅
- `styles/Info.css` ✅
- `styles/InfoPanel.css` ✅
- `styles/Search.css` ✅ (moved to map/)
- `styles/Home.css` ✅ (moved to home/)
- `styles/Query.css` ✅ (moved to query/)
- `styles/` folder ✅ (completely removed)

## 🧪 Testing Checklist

- [ ] Map loads correctly
- [ ] Search functionality works
- [ ] Current location button works
- [ ] InfoPanel displays correctly
- [ ] Download button (XML/RDF) works
- [ ] Tour help buttons work
- [ ] Home page loads
- [ ] Query page works
- [ ] CSS styles display correctly
- [ ] No console errors
- [ ] All imports resolve correctly
- [ ] Hot reload works in dev mode

## 🎨 Best Practices Applied

1. **Component Co-location** - Components with their styles
2. **Custom Hooks** - Reusable stateful logic
3. **Central Exports** - index.ts files for clean imports
4. **Clear Separation** - UI vs Logic vs Utils
5. **TypeScript Types** - Properly exported and typed

## 🚀 Next Steps

1. Test all functionality thoroughly
2. Delete old files after verification
3. Update documentation
4. Consider adding unit tests for hooks
5. Consider adding Storybook for UI components

## 📚 Related Documentation

- See `REFACTORING.md` in `components/map/` for previous refactoring
- See `README.md` in `tours/` for tour configuration
- See individual component JSDoc comments for usage

---

**Created:** October 30, 2025  
**Author:** MFitHou  
**Version:** 2.0 - Structure Refactoring
