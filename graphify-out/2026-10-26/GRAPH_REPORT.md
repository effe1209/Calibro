# Graph Report - ChroneApp  (2026-10-26)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 399 nodes · 735 edges · 22 communities (18 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c64449e8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.jsx
- InfiniteMenu.jsx
- react
- package.json
- WatchList.jsx
- dependencies
- AppDelegate
- MetaBalls
- WatchAnalytics.jsx
- devDependencies
- migrate-watch-photos.mjs
- InfoWatchModal.jsx
- public/manifest.json
- FloatingLines.jsx
- scripts
- Clock.jsx
- LogoLoop.jsx
- WatchMovementComplication.jsx
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `react` - 41 edges
2. `App()` - 31 edges
3. `InfiniteGridMenu` - 16 edges
4. `Geometry` - 15 edges
5. `getWatchImageUrl()` - 11 edges
6. `AppDelegate` - 10 edges
7. `WatchAnalytics()` - 10 edges
8. `normalizeNotificationPreferences()` - 9 edges
9. `WatchList()` - 9 edges
10. `MetaBalls()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `AuthForm()`  [EXTRACTED]
  src/App.jsx → src/components/AuthForm.jsx
- `App()` --calls--> `Dock()`  [EXTRACTED]
  src/App.jsx → src/components/Dock.jsx
- `App()` --calls--> `CollectionQuickStats()`  [EXTRACTED]
  src/App.jsx → src/components/CollectionQuickStats.jsx
- `DayWatchModal()` --calls--> `getWatchImageUrl()`  [EXTRACTED]
  src/components/DayWatchModal.jsx → src/components/imageService.js
- `useWatchThumbnail()` --calls--> `getWatchThumbnailUrl()`  [EXTRACTED]
  src/components/useWatchThumbnail.js → src/components/imageService.js

## Import Cycles
- None detected.

## Communities (22 total, 4 thin omitted)

### Community 0 - "App.jsx"
Cohesion: 0.09
Nodes (42): browser-image-compression, lucide-react, react-dom, App(), FloatingLines, InfiniteGridModal, StatsModal, createFullBackup() (+34 more)

### Community 1 - "InfiniteMenu.jsx"
Cohesion: 0.07
Nodes (17): gl-matrix, InfiniteGridModal(), ArcballControl, createAndSetupTexture(), createProgram(), createShader(), defaultItems, DiscGeometry (+9 more)

### Community 2 - "react"
Cohesion: 0.06
Nodes (36): name, private, scripts, build, deploy, dev, lint, migrate:watch-photos (+28 more)

### Community 3 - "package.json"
Cohesion: 0.08
Nodes (18): react, react-avatar, react-icons, AuthForm(), Clock(), getClockPosition(), romanNumerals, DayWatchModal() (+10 more)

### Community 4 - "WatchList.jsx"
Cohesion: 0.13
Nodes (23): swiper, AddWatchForm(), ExternalImageProcessingNotice(), FeatureCheckboxList(), FunctionsSection(), ModifyWatchModal(), OutfitModal(), COLOR_LABEL_BY_VALUE (+15 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (29): dependencies, browser-image-compression, @capacitor/cli, @capacitor/core, @capacitor/ios, chart.js, colorthief, @emotion/react (+21 more)

### Community 6 - "AppDelegate"
Cohesion: 0.15
Nodes (17): framer-motion, motion, addYears(), daysFromToday(), formatDate(), getDueDate(), MaintenanceReminderBanner(), parseDate() (+9 more)

### Community 7 - "MetaBalls"
Cohesion: 0.13
Nodes (3): Capacitor, AppDelegate, UIKit

### Community 8 - "WatchAnalytics.jsx"
Cohesion: 0.13
Nodes (7): ogl, Iridescence(), fract(), hash31(), hash33(), MetaBalls(), parseHexColor()

### Community 9 - "devDependencies"
Cohesion: 0.27
Nodes (12): chart.js, react-chartjs-2, StatsModal(), asNumber(), CHART_COLORS, formatEuro(), makeConditionData(), makeCountData() (+4 more)

### Community 10 - "migrate-watch-photos.mjs"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, gh-pages, globals, @types/react (+3 more)

### Community 11 - "InfoWatchModal.jsx"
Cohesion: 0.20
Nodes (6): @supabase/supabase-js, cleanupFailures, listFolder(), listUserObjects(), referencedLegacyPaths, supabase

### Community 12 - "public/manifest.json"
Cohesion: 0.20
Nodes (9): background_color, display, icons, id, name, scope, short_name, start_url (+1 more)

### Community 13 - "FloatingLines.jsx"
Cohesion: 0.27
Nodes (7): @react-three/fiber, three, FloatingLines(), hexToVec3(), hexToNormalizedRGB(), Silk(), SilkPlane

### Community 14 - "scripts"
Cohesion: 0.39
Nodes (6): ANIMATION_CONFIG, LogoLoop, toCssLength(), useAnimationLoop(), useImageLoader(), useResizeObserver()

### Community 15 - "Clock.jsx"
Cohesion: 0.60
Nodes (3): CircularText(), getRotationTransition(), getTransition()

### Community 16 - "LogoLoop.jsx"
Cohesion: 0.70
Nodes (4): createGearPath(), Gear(), Screw(), WatchMovementComplication()

### Community 17 - "WatchMovementComplication.jsx"
Cohesion: 0.40
Nodes (4): buildCommand, outputDirectory, redirects, rewrites

## Knowledge Gaps
- **16 isolated node(s):** `@capacitor/cli`, `@capacitor/core`, `@capacitor/ios`, `colorthief`, `@emotion/react` (+11 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 154 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `package.json` to `App.jsx`, `InfiniteMenu.jsx`, `react`, `WatchList.jsx`, `AppDelegate`, `WatchAnalytics.jsx`, `devDependencies`, `FloatingLines.jsx`, `scripts`, `Clock.jsx`?**
  _High betweenness centrality (0.419) - this node is a cross-community bridge._
- **What connects `@capacitor/cli`, `@capacitor/core`, `@capacitor/ios` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0936026936026936 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `react`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Should `InfiniteMenu.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06708595387840671 - nodes in this community are weakly interconnected._
- **Why does `@supabase/supabase-js` connect `InfoWatchModal.jsx` to `App.jsx`, `react`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.05641025641025641 - nodes in this community are weakly interconnected._