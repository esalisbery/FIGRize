# FIGRize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clone Facebook-Scheduler into j:\VibeCode\FIGRize, wrap it in Electron via electron-vite, rebrand as FIGRize, and fix all broken UI elements and dead buttons.

**Architecture:** React source stays at the project root (App.tsx, components/, services/); a new `electron/` directory holds the main process and preload script; `electron.vite.config.ts` replaces `vite.config.ts` and drives all three build pipelines (main, preload, renderer). The CDN import-map is removed — Vite bundles all packages from node_modules.

**Tech Stack:** Electron 36+, electron-vite 3+, React 19, TypeScript 5.8, Vite 6, @google/genai, Tailwind CSS (CDN), date-fns, lucide-react

---

## File Map

**Create:**
- `electron/main.ts` — Electron main process, opens BrowserWindow, loads renderer in dev/prod
- `electron/preload.ts` — Preload script, exposes IPC bridge via contextBridge
- `electron.vite.config.ts` — Replaces vite.config.ts; configures main, preload, renderer pipelines
- `.env` — GEMINI_API_KEY placeholder for AI features

**Modify:**
- `package.json` — name → figRize, add `main` field, update scripts to electron-vite
- `index.html` — remove CDN importmap, add entry script tag, update title to FIGRize
- `components/CalendarGrid.tsx` — remove unused imports (Linkedin, Video), fix Math.random heat map flicker
- `App.tsx` — add editingPost state, fix onPostClick (replace alert), fix initialPlatform, add export handler
- `components/PostModal.tsx` — add editingPost prop, emoji picker, file input for media, fix save disabled condition, remove dead LayoutGrid button

**Delete:**
- `vite.config.ts` — replaced by electron.vite.config.ts

---

### Task 1: Clone the repo into j:\VibeCode\FIGRize

- [ ] **Step 1: Clone into the existing empty folder**

Run from `j:\VibeCode\FIGRize`:
```powershell
git clone https://github.com/esalisbery/Facebook-Scheduler.git .
```
Expected output ends with: `Resolving deltas: done.`

- [ ] **Step 2: Verify key files exist**

```powershell
Get-ChildItem -Name
```
Expected: App.tsx, index.html, index.tsx, package.json, tsconfig.json, vite.config.ts, components/, services/

---

### Task 2: Install base dependencies and Electron packages

- [ ] **Step 1: Install existing npm dependencies**

```powershell
npm install
```
Expected: `added N packages` with no fatal errors.

- [ ] **Step 2: Install Electron and electron-vite**

```powershell
npm install --save-dev electron electron-vite
```
Expected: Both appear in `devDependencies` in package.json.

---

### Task 3: Create the Electron main process

**Files:**
- Create: `electron/main.ts`

- [ ] **Step 1: Create electron/main.ts**

```typescript
import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'FIGRize',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.NODE_ENV === 'development' && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

---

### Task 4: Create the Electron preload script

**Files:**
- Create: `electron/preload.ts`

- [ ] **Step 1: Create electron/preload.ts**

```typescript
import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform
})
```

---

### Task 5: Create electron.vite.config.ts and delete vite.config.ts

**Files:**
- Create: `electron.vite.config.ts`
- Delete: `vite.config.ts`

- [ ] **Step 1: Create electron.vite.config.ts**

```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    main: {
      entry: 'electron/main.ts',
      plugins: [externalizeDepsPlugin()]
    },
    preload: {
      input: resolve(__dirname, 'electron/preload.ts'),
      plugins: [externalizeDepsPlugin()]
    },
    renderer: {
      root: '.',
      build: {
        rollupOptions: {
          input: resolve(__dirname, 'index.html')
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      }
    }
  }
})
```

- [ ] **Step 2: Delete vite.config.ts**

```powershell
Remove-Item vite.config.ts
```

---

### Task 6: Update package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Replace package.json with updated content**

Use the exact electron/electron-vite versions that were installed in Task 2 (check with `npm list electron electron-vite --depth=0`). The template below uses `*` as a placeholder — replace with real installed versions:

```json
{
  "name": "figRize",
  "private": true,
  "version": "0.0.0",
  "main": "out/main/index.js",
  "type": "module",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview"
  },
  "dependencies": {
    "@google/genai": "^1.31.0",
    "lucide-react": "^0.556.0",
    "react-dom": "^19.2.1",
    "react": "^19.2.1",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.0",
    "electron": "^36.0.0",
    "electron-vite": "^3.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

---

### Task 7: Update index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace index.html**

The original uses a CDN importmap from `aistudiocdn.com` — Vite bundles packages from node_modules instead, so remove it. Add the entry script tag and update the title:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FIGRize</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: #f1f1f1; }
      ::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
    </style>
  </head>
  <body class="bg-gray-50 text-slate-800 font-sans antialiased overflow-hidden">
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>
```

---

### Task 8: Create .env file

**Files:**
- Create: `.env`

- [ ] **Step 1: Create .env**

```
GEMINI_API_KEY=your_gemini_api_key_here
```

- [ ] **Step 2: Ensure .env is gitignored**

Open `.gitignore` and verify `.env` is listed. If not, add a line:
```
.env
```

---

### Task 9: Launch and verify Electron window opens

- [ ] **Step 1: Run the dev server**

```powershell
npm run dev
```
Expected: An Electron window titled "FIGRize" appears showing the calendar app with sidebar, header, and calendar grid. No fatal console errors.

- [ ] **Step 2: Verify baseline UI**

In the Electron window, confirm:
- Sidebar renders with navigation items
- Header shows the current week range with Prev/Next buttons
- "Create Post" button is visible in the top right
- Calendar grid renders with 7 columns and time slots

- [ ] **Step 3: Commit working Electron baseline**

```powershell
git add -A
git commit -m "feat: add Electron via electron-vite, rebrand to FIGRize"
```

---

### Task 10: Fix CalendarGrid.tsx — unused imports and flickering heat map

**Files:**
- Modify: `components/CalendarGrid.tsx`

**Bugs:**
- `Linkedin` and `Video` are imported from lucide-react but never used — TypeScript strict mode would error, and they're dead code.
- `getIntensity` calls `Math.random()` on every render, causing the heat map background to flicker every time the component re-renders (e.g., on week navigation).

- [ ] **Step 1: Fix imports — remove Linkedin and Video**

Change line 4 from:
```typescript
import { Image, Video, Linkedin, Instagram, Facebook } from 'lucide-react';
```
To:
```typescript
import { Image, Instagram, Facebook } from 'lucide-react';
```

- [ ] **Step 2: Replace getIntensity with a memoized heat map**

Remove the entire `getIntensity` function:
```typescript
const getIntensity = (dayIndex: number, hour: number) => {
  if ((hour >= 9 && hour <= 11) || (hour >= 17 && hour <= 20)) return 0.2 + (Math.random() * 0.3);
  if (hour >= 1 && hour <= 5) return 0;
  return 0.05 + (Math.random() * 0.1);
};
```

Add a memoized heat map immediately after the `weekDays` useMemo:
```typescript
const heatMap = useMemo(() => {
  const map: Record<string, number> = {};
  DAYS.forEach(dayIndex => {
    HOURS.forEach(hour => {
      if ((hour >= 9 && hour <= 11) || (hour >= 17 && hour <= 20)) {
        map[`${dayIndex}-${hour}`] = 0.2 + Math.random() * 0.3;
      } else if (hour >= 1 && hour <= 5) {
        map[`${dayIndex}-${hour}`] = 0;
      } else {
        map[`${dayIndex}-${hour}`] = 0.05 + Math.random() * 0.1;
      }
    });
  });
  return map;
}, []); // computed once on mount — stable across re-renders
```

- [ ] **Step 3: Update the usage site**

In the hourly slot `style` prop, replace `getIntensity(dayIndex, hour)` with `heatMap[\`${dayIndex}-${hour}\`] || 0`:
```tsx
style={{ backgroundColor: `rgba(235, 230, 255, ${heatMap[`${dayIndex}-${hour}`] || 0})` }}
```

- [ ] **Step 4: Verify no TypeScript errors**

```powershell
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 5: Verify heat map is stable**

In the running Electron window, click "Next" and "Previous" week buttons several times. The background heat-map colors in each cell should remain the same — they should not change randomly on each click.

- [ ] **Step 6: Commit**

```powershell
git add components/CalendarGrid.tsx
git commit -m "fix: remove unused imports and stabilize heat map in CalendarGrid"
```

---

### Task 11: Fix App.tsx — post editing, export button, initialPlatform bug

**Files:**
- Modify: `App.tsx`

**Bugs:**
- `onPostClick` uses `alert()` as a placeholder — clicking a calendar post does nothing useful.
- `initialPlatform={connectedAccount ? Platform.Facebook : Platform.Facebook}` — redundant ternary, both branches return the same value.
- Export button has no `onClick` handler — clicking it does nothing.

- [ ] **Step 1: Add editingPost state**

After the existing state declarations (after `const [selectedSlot, ...]`), add:
```typescript
const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
```

- [ ] **Step 2: Update handleSavePost to support both add and update**

Replace:
```typescript
const handleSavePost = (newPost: SocialPost) => {
  setPosts([...posts, newPost]);
};
```
With:
```typescript
const handleSavePost = (savedPost: SocialPost) => {
  setPosts(prev => {
    const exists = prev.some(p => p.id === savedPost.id);
    return exists
      ? prev.map(p => p.id === savedPost.id ? savedPost : p)
      : [...prev, savedPost];
  });
};
```

- [ ] **Step 3: Add export handler**

After `handleDisconnect`, add:
```typescript
const handleExport = () => {
  const data = JSON.stringify(
    posts.map(p => ({ ...p, date: p.date instanceof Date ? p.date.toISOString() : p.date })),
    null,
    2
  );
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `figRize-posts-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
```

- [ ] **Step 4: Fix onPostClick to open the edit modal**

Replace:
```typescript
onPostClick={(post) => alert(`Editing post: ${post.content}`)}
```
With:
```typescript
onPostClick={(post) => { setEditingPost(post); setIsModalOpen(true); }}
```

- [ ] **Step 5: Wire export button**

Find the export button JSX:
```tsx
<button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
  <Download size={14} />
  <span>Export</span>
</button>
```
Add `onClick={handleExport}`:
```tsx
<button onClick={handleExport} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
  <Download size={14} />
  <span>Export</span>
</button>
```

- [ ] **Step 6: Fix initialPlatform and pass editingPost to PostModal**

Replace the PostModal JSX:
```tsx
<PostModal 
  isOpen={isModalOpen} 
  onClose={() => setIsModalOpen(false)}
  onSave={handleSavePost}
  initialDate={selectedSlot?.date}
  initialPlatform={connectedAccount ? Platform.Facebook : Platform.Facebook}
/>
```
With:
```tsx
<PostModal 
  isOpen={isModalOpen} 
  onClose={() => { setIsModalOpen(false); setEditingPost(null); }}
  onSave={handleSavePost}
  initialDate={selectedSlot?.date}
  initialPlatform={Platform.Facebook}
  editingPost={editingPost}
/>
```

- [ ] **Step 7: Commit**

```powershell
git add App.tsx
git commit -m "fix: post editing, export button, and initialPlatform in App.tsx"
```

---

### Task 12: Fix PostModal.tsx — editing support, emoji picker, media upload, disabled logic

**Files:**
- Modify: `components/PostModal.tsx`

**Bugs:**
- Smile button has no handler — clicking it does nothing.
- Media upload area has no file input — clicking it does nothing.
- Save button `disabled` check uses `!content && !promptTopic` (wrong — promptTopic alone shouldn't enable save).
- LayoutGrid button in background picker is a dead mock with no handler.
- No editing mode — always creates a new post regardless of whether a post was clicked.

- [ ] **Step 1: Add editingPost to PostModalProps interface**

Replace:
```typescript
interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: SocialPost) => void;
  initialDate?: Date;
  initialPlatform?: Platform;
}
```
With:
```typescript
interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: SocialPost) => void;
  initialDate?: Date;
  initialPlatform?: Platform;
  editingPost?: SocialPost | null;
}
```

Update the component destructure to include `editingPost`:
```typescript
export const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose, onSave, initialDate, initialPlatform, editingPost }) => {
```

- [ ] **Step 2: Add emoji picker and media file state + constants**

After the existing state declarations, add:
```typescript
const [showEmojiPicker, setShowEmojiPicker] = useState(false);
const [mediaFile, setMediaFile] = useState<File | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);

const COMMON_EMOJIS = [
  '😀','😂','❤️','👍','🙏','🎉','🔥','✨','💪','🚀',
  '👀','💡','⭐','🌟','💯','✅','🎯','📅','📱','💬'
];

const insertEmoji = (emoji: string) => {
  setContent(prev => prev + emoji);
  setShowEmojiPicker(false);
};
```

- [ ] **Step 3: Update useEffect to populate from editingPost**

Replace the existing `useEffect`:
```typescript
useEffect(() => {
  if (isOpen) {
    const d = initialDate || new Date();
    setDate(d.toISOString().split('T')[0]);
    setTime(d.toTimeString().slice(0, 5));
    setPlatform(initialPlatform || Platform.Facebook);
    setContent('');
    setShowAiPrompt(false);
    // Reset FB specific states
    setSelectedBackground('none');
    setShowBackgroundPicker(false);
    setPostType('Feed');
  }
}, [isOpen, initialDate, initialPlatform]);
```
With:
```typescript
useEffect(() => {
  if (isOpen) {
    if (editingPost) {
      const d = new Date(editingPost.date);
      setDate(d.toISOString().split('T')[0]);
      setTime(d.toTimeString().slice(0, 5));
      setPlatform(editingPost.platform);
      setContent(editingPost.content);
    } else {
      const d = initialDate || new Date();
      setDate(d.toISOString().split('T')[0]);
      setTime(d.toTimeString().slice(0, 5));
      setPlatform(initialPlatform || Platform.Facebook);
      setContent('');
    }
    setShowAiPrompt(false);
    setShowEmojiPicker(false);
    setMediaFile(null);
    setSelectedBackground('none');
    setShowBackgroundPicker(false);
    setPostType('Feed');
  }
}, [isOpen, initialDate, initialPlatform, editingPost]);
```

- [ ] **Step 4: Update handleSave to preserve ID when editing**

Replace:
```typescript
const handleSave = () => {
  const dateTime = new Date(`${date}T${time}`);
  const newPost: SocialPost = {
    id: Math.random().toString(36).substr(2, 9),
    content,
    date: dateTime,
    durationMinutes: 60,
    platform,
    isDraft: false
  };
  onSave(newPost);
  onClose();
};
```
With:
```typescript
const handleSave = () => {
  const dateTime = new Date(`${date}T${time}`);
  const post: SocialPost = {
    id: editingPost?.id ?? Math.random().toString(36).substr(2, 9),
    content,
    date: dateTime,
    durationMinutes: editingPost?.durationMinutes ?? 60,
    platform,
    mediaUrl: mediaFile ? URL.createObjectURL(mediaFile) : editingPost?.mediaUrl,
    isDraft: false
  };
  onSave(post);
  onClose();
};
```

- [ ] **Step 5: Update modal title to show "Edit Post" vs "New Post"**

Replace:
```tsx
<h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
  <span className={`w-3 h-3 rounded-full ${
      platform === Platform.Instagram ? 'bg-pink-500' : 'bg-blue-600'
  }`}></span>
  New Post
</h2>
```
With:
```tsx
<h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
  <span className={`w-3 h-3 rounded-full ${
    platform === Platform.Instagram ? 'bg-pink-500' : 'bg-blue-600'
  }`}></span>
  {editingPost ? 'Edit Post' : 'New Post'}
</h2>
```

- [ ] **Step 6: Replace the dead Smile button with a working emoji picker**

Replace:
```tsx
<button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
  <Smile size={18} />
</button>
```
With:
```tsx
<div className="relative">
  <button
    onClick={() => setShowEmojiPicker(prev => !prev)}
    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
  >
    <Smile size={18} />
  </button>
  {showEmojiPicker && (
    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50 w-56">
      <div className="grid grid-cols-10 gap-0.5">
        {COMMON_EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => insertEmoji(emoji)}
            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-base"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )}
</div>
```

- [ ] **Step 7: Remove the dead LayoutGrid mock button from background picker**

Remove this block from the color picker section:
```tsx
{/* Mock Grid Option */}
<button className="w-8 h-8 rounded-lg bg-gray-800 flex-shrink-0 flex items-center justify-center text-white/50">
  <LayoutGrid size={16} />
</button>
```

Also remove `LayoutGrid` from the import at the top of the file:
```typescript
// Remove LayoutGrid from this line:
import { 
  X, Sparkles, Image as ImageIcon, Calendar as CalendarIcon, Clock, Type, Smile, 
  ChevronDown, ChevronUp, LayoutGrid, AlertCircle
} from 'lucide-react';
// Should become:
import { 
  X, Sparkles, Image as ImageIcon, Calendar as CalendarIcon, Clock, Type, Smile, 
  ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
```

- [ ] **Step 8: Add hidden file input and wire the media upload area**

Add the hidden file input inside the scrollable content `<div>`, just before the closing `</div>`:
```tsx
<input
  type="file"
  ref={fileInputRef}
  onChange={(e) => { if (e.target.files?.[0]) setMediaFile(e.target.files[0]); }}
  accept="image/*,video/*"
  className="hidden"
/>
```

Replace the media upload `<div>`:
```tsx
<div className="group border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer">
  <div className="bg-gray-100 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
      <ImageIcon size={24} className="text-gray-500" />
  </div>
  <span className="text-sm font-medium text-gray-600">Add Photos or Video</span>
  <span className="text-xs text-gray-400 mt-1">or drag and drop</span>
</div>
```
With:
```tsx
<div
  onClick={() => fileInputRef.current?.click()}
  className="group border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
>
  <div className="bg-gray-100 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
    <ImageIcon size={24} className="text-gray-500" />
  </div>
  {mediaFile ? (
    <span className="text-sm font-medium text-indigo-600">{mediaFile.name}</span>
  ) : (
    <>
      <span className="text-sm font-medium text-gray-600">Add Photos or Video</span>
      <span className="text-xs text-gray-400 mt-1">or drag and drop</span>
    </>
  )}
</div>
```

- [ ] **Step 9: Fix save button disabled condition**

Replace:
```tsx
<Button onClick={handleSave} disabled={(!content && !promptTopic) || isOverLimit}>
```
With:
```tsx
<Button onClick={handleSave} disabled={!content || isOverLimit}>
```

- [ ] **Step 10: Verify all PostModal fixes in the running app**

In the Electron window:
1. Click "Create Post" → modal opens with empty form, title reads **"New Post"**
2. Click an existing calendar post → modal opens with that post's content pre-filled, title reads **"Edit Post"**
3. Save the edited post → it updates on the calendar (no duplicate created)
4. Click the Smile button → emoji grid appears; click an emoji → it inserts into the text field
5. Click "Add Photos or Video" area → system file picker opens
6. Save button is disabled when text area is empty; enabled once text is entered

- [ ] **Step 11: Commit**

```powershell
git add components/PostModal.tsx
git commit -m "fix: editing support, emoji picker, media upload, and disabled logic in PostModal"
```

---

### Task 13: Final verification

- [ ] **Step 1: TypeScript check**

```powershell
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 2: Full app walkthrough in Electron**

```powershell
npm run dev
```

Verify each fix end-to-end:
- [ ] Calendar grid renders with stable heat map (no flicker on week navigation)
- [ ] "Create Post" button opens empty modal labeled "New Post"
- [ ] Clicking a calendar post opens modal pre-filled with post content, labeled "Edit Post"
- [ ] Saving an edited post updates it; no duplicate appears on calendar
- [ ] Emoji button opens emoji grid; clicking emoji inserts it into text
- [ ] Media upload area opens a file picker
- [ ] Export button downloads a `.json` file with scheduled posts
- [ ] Platform filter toggles (Facebook / Instagram) filter the calendar
- [ ] Facebook login popup opens, completes mock flow, shows "Facebook Connected" badge
- [ ] "Connect Page" button in sub-header opens login popup

- [ ] **Step 3: Final commit**

```powershell
git add -A
git commit -m "feat: FIGRize complete — Electron desktop app with all UI fixes"
```

---

## Self-Review

**Spec coverage:**
- ✅ Clone Facebook-Scheduler repo → Task 1
- ✅ electron-vite integration, Electron main + preload → Tasks 2–5
- ✅ Rebrand to FIGRize (package name, title, window title) → Tasks 6–7
- ✅ Fix broken buttons: emoji picker, media upload, export, post click → Tasks 11–12
- ✅ Fix runtime bugs: heat map flicker, initialPlatform, save disabled condition → Tasks 10–12
- ✅ Fix dead LayoutGrid mock button → Task 12

**Placeholder scan:** No TBD, TODO, or vague steps found.

**Type consistency:**
- `editingPost?: SocialPost | null` added to PostModal props → Task 12 Step 1
- `editingPost` destructured in PostModal → Task 12 Step 1
- `editingPost?.id` used in handleSave to preserve ID → Task 12 Step 4
- `editingPost` passed from App.tsx PostModal JSX → Task 11 Step 6
- `savedPost.id` used in App.tsx handleSavePost for update-vs-add logic → Task 11 Step 2
All types consistent throughout.
