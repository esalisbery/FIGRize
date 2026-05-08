# FIGRize — Design Spec
**Date:** 2026-05-07

## Overview
FIGRize is a desktop social media scheduling app built with Electron, React 19, TypeScript, and Vite. It is cloned from the `esalisbery/Facebook-Scheduler` repository and adapted to run as a local Electron desktop application on Windows.

## Source
- GitHub: https://github.com/esalisbery/Facebook-Scheduler.git
- Stack: React 19, TypeScript, Vite 6, Lucide React, date-fns, Google GenAI

## Architecture

### Electron Integration (electron-vite)
- `electron/main.ts` — Main process: creates `BrowserWindow`, loads the Vite renderer in dev or the built HTML in production
- `electron/preload.ts` — Preload script providing a secure IPC bridge between renderer and main process
- Vite config updated to use `electron-vite` conventions
- `package.json` scripts updated: `dev` runs `electron-vite dev`, `build` runs `electron-vite build`

### Renderer (existing React app)
All existing components remain in place:
- `App.tsx` — Root component, state management, navigation
- `components/CalendarGrid.tsx` — Weekly calendar view
- `components/PostModal.tsx` — Post creation/editing modal
- `components/Sidebar.tsx` — Platform filter sidebar
- `components/FacebookLoginPopup.tsx` — Facebook OAuth login
- `components/Button.tsx` — Shared button component
- `services/ai.ts` — Google GenAI integration

### Branding
- App title changed from "Facebook Scheduler" to "FIGRize" in `index.html` and `BrowserWindow` title config

## Error Audit Scope
After Electron setup, perform a full audit of:
- All component files for broken event handlers, missing props, or runtime errors
- `services/ai.ts` for API integration issues
- Buttons/modals that don't open, close, or submit correctly
- Facebook login flow functionality

## Success Criteria
- `npm run dev` launches FIGRize as an Electron desktop window
- All visible buttons and modals function correctly
- No console errors on startup
- Post creation, calendar navigation, and platform filtering work
