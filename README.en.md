# Huajing Guanyu · Cosmic Capsules

[中文说明](README.md)

Current version: **project 1.6.0 / NC-10–NC-12 visual version v2.4.7**.

The project contains twelve realtime animated capsules across three rendering modes: Nebula, Aurora, and Progress.

## Capsule list

### Nebula

- `NC-01 ORIGINAL`
- `NC-02 OCEAN`
- `NC-03 KLEIN`
- `NC-04 ULTRAVIOLET`
- `NC-05 CHROME`
- `NC-06 PLUS`

These presets use layered noise, stars, clouds, and swirls to form cosmic-nebula materials.

### Aurora

- `NC-07 POLAR`: dark capsule with orange, magenta, and warm-white light ribbons
- `NC-08 DUBDOT`: white capsule with pale blue, sky blue, and cyan light ribbons
- `NC-09 VERCEL`: white capsule with mint, soft yellow, and pale pink light ribbons

All three use internal WebGL2 ribbon rendering, with automatic Canvas 2D fallback when WebGL2 is unavailable.

### Progress

- `NC-10 MODEL TRAINING`
- `NC-11 AGENT MIGRATION`
- `NC-12 VISUAL TRAINING`

Selecting **Progress** in the filter bar displays the three progress capsules in a centered, single-column layout with one capsule per row.

Current visual and interaction specification:

- Fixed desktop size: `454 × 104px`
- The capsules no longer stretch when the page grows; they shrink only when the viewport is too narrow
- The internal primary title is the brand name **“画境观屿”**
- Automatic progress moves forward only, at a constant linear rate, with no rollback or random jumps
- `NC-10`: `1.10% per second`
- `NC-11`: `1.00% per second`
- `NC-12`: `1.05% per second`
- Progress remains at `100%` and does not automatically reset
- Mouse, touch, and keyboard progress adjustment are supported
- After manual adjustment, automatic forward loading resumes after about `1.8 seconds`
- Shuffle changes only the fluid texture phase and does not change the percentage
- A `240 × 80` smooth motion field and a 24-frame runtime texture atlas reduce fine-grained jitter
- Canvas 2D fallback remains available when WebGL2 is unavailable

> `NC-01–NC-09` remain frozen modules. Progress updates do not modify `src/main.js`, `src/presets.js`, `src/cosmic-shader.js`, `src/fallback.js`, or `aurora.css`.

![NC-01–NC-09 preview](assets/preview-v2.0.4.png)

## One-click launchers

Node.js 18 or newer is required.

```text
一键启动/
├── macOS-一键启动.command
├── Windows-一键启动.bat
└── 一键启动说明.txt
```

You can also run this command in the project root:

```bash
npm start
```

Default address:

```text
http://127.0.0.1:4173
```

If the port is occupied, the server automatically tries later ports. The project uses ES Modules, so run it through the local server instead of opening `index.html` directly.

## Controls

- **Autoplay**: visible animations start immediately after the page loads
- **Shuffle**: regenerates the original capsule shapes; progress capsules only change fluid texture phase
- **Pause / Continue**: freezes or resumes all visible motion and automatic progress
- **All / Cool / Warm / Progress**: filters by palette and capsule type
- **Click an original capsule**: opens its immersive preview
- **Drag a progress capsule**: directly changes the current percentage
- **Keyboard progress controls**: arrow keys adjust by 2%, Page Up / Page Down by 10%, and Home / End jump to 0% / 100%

## Rendering architecture

### Nebula

`NC-01–NC-06` use `src/cosmic-shader.js` for WebGL2 nebula rendering, with `src/fallback.js` as the Canvas 2D fallback.

### Aurora

`NC-07–NC-09` use dedicated Aurora parameters and `aurora.css` theme overrides, without external video or CSS sweep layers.

### Progress

`NC-10–NC-12` are connected through independent incremental modules and do not intrude into the original nine-capsule rendering path:

- `src/progress-presets.js`: codes, palettes, initial values, and loading rates
- `src/progress-capsules.js`: components, dragging, keyboard controls, and forward-only progress logic
- `src/progress-motion-data.js`: smooth boundary motion-field generation
- `src/progress-reference-atlases.js`: runtime reference texture atlases
- `src/progress-flow-renderer.js`: WebGL2 fluid and boundary rendering
- `src/progress-flow-overlays.js`: WebGL overlay and Canvas fallback switching
- `src/progress-entry.js`: mounts progress capsules after the original nine have loaded
- `progress.css`: Progress filter, fixed sizing, and responsive layout

## Development and verification

```bash
npm run check
npm test
```

`npm test` verifies:

- The `NC-01–NC-09` ordering and frozen module boundary remain untouched
- `NC-10–NC-12` loading rates and forward-only logic
- The internal brand title “画境观屿”
- The fixed `454 × 104px` narrow layout
- WebGL2, runtime texture, and Canvas 2D fallback entry points

## Main files

```text
index.html                         Page structure and filter entry
styles.css                         Original page and component styles
aurora.css                         NC-07–NC-09 Aurora theme
progress.css                       NC-10–NC-12 fixed narrow layout
src/presets.js                     Frozen NC-01–NC-09 presets
src/cosmic-shader.js               Nebula / Aurora WebGL2 rendering
src/fallback.js                    Original nine-capsule Canvas fallback
src/main.js                        Original nine-capsule interaction and scheduling
src/progress-*.js                  Independent progress-capsule modules
progress-tests.mjs                 Progress and frozen-boundary validation
scripts/serve.mjs                  Local static server
```

## Network scope

By default, the project serves only on local address `127.0.0.1`. It is not automatically published to the internet and does not upload user data.
