# Huajing Guanyu · Cosmic Capsules

[中文说明](README.md)

Nine realtime generative capsules: **Original, Ocean, Klein, Ultraviolet, Chrome, Plus, Polar, Dubdot, and Vercel**.

- `NC-01 ~ NC-06`: cosmic nebula fluid mode
- `NC-07 POLAR`: dark capsule with teal, blue, and violet light bands
- `NC-08 DUBDOT`: white capsule with cream, orange, and coral light bands
- `NC-09 VERCEL`: white capsule with mint, blue, and lavender light bands

The three new styles are appended in the exact reference-image order and use a dedicated `aurora` animation mode. The page continues to support WebGL2, Canvas 2D fallback, autoplay, pointer/touch gravity, pause controls, randomization, cool/warm filtering, and an immersive viewer.

![Huajing Guanyu Cosmic Capsules preview](assets/preview-v1.0.3.svg)

## One-click launchers (recommended)

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

- **Autoplay**: all nine capsules start moving after the page loads.
- **Shuffle**: regenerates shape parameters for every capsule.
- **Pause / Continue**: freezes or resumes all visible animations.
- **All / Cool / Warm**: filters capsules by palette group.
- **Click a capsule**: opens the corresponding full-screen viewer.
- **Move or touch**: temporarily changes the gravity direction of the nebula or light bands.

## Rendering modes

### Nebula

The original six presets use layered noise, stars, clouds, and swirls to form cosmic-fluid materials.

### Aurora

The three new presets use low-frequency noise and multiple soft light ribbons to create smooth moving gradients:

```text
NC-07 POLAR
NC-08 DUBDOT
NC-09 VERCEL
```

`POLAR` has a dedicated dark text area. `DUBDOT` and `VERCEL` keep a white capsule base. When WebGL2 is unavailable, the project automatically switches to a Canvas 2D aurora fallback.

## Development and verification

```bash
npm run check
npm test
```

## Main files

```text
index.html              Page structure
styles.css              Existing page and component styles
aurora.css              Aurora capsule theme overrides
src/presets.js          Nine presets, ordering, colors, and parameters
src/cosmic-shader.js    Nebula and Aurora WebGL2 rendering
src/fallback.js         Canvas 2D fallback rendering
src/main.js             Page interaction and render scheduling
scripts/serve.mjs       Local static server
```

## Network scope

By default, the project serves only on local address `127.0.0.1`. It is not published to the internet and does not upload user data.
