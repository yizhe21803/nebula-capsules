# Huajing Guanyu · Cosmic Capsules

[中文说明](README.md)

Six realtime generative cosmic-fluid capsules: **Original, Ocean, Klein, Ultraviolet, Chrome, and Plus**. The page includes WebGL2 fluid rendering, autoplay, pointer/touch gravity, pause controls, filtering, and an immersive viewer.

![Huajing Guanyu Cosmic Capsules preview](assets/preview-v1.0.3.svg)

## One-click launchers (recommended)

After extracting the source package, open the following folder:

```text
一键启动/
├── macOS-一键启动.command
├── Windows-一键启动.bat
└── 一键启动说明.txt
```

### One-click launch on macOS

1. Make sure **Node.js 18 or newer** is installed.
2. Open the `一键启动` folder.
3. Double-click `macOS-一键启动.command`.
4. A Terminal window will display the startup status, then the browser will open automatically.
5. Keep the Terminal window open while the page is running.
6. To stop the server, press **Control + C** in Terminal or close the Terminal window.

macOS may block an unsigned `.command` file the first time it is opened. In that case:

1. Right-click `macOS-一键启动.command`.
2. Choose **Open**.
3. Confirm **Open** again in the system dialog.

If macOS reports that the file is not executable, open Terminal in the project root and run:

```bash
chmod +x "一键启动/macOS-一键启动.command"
```

Then double-click the launcher again.

### One-click launch on Windows

1. Make sure **Node.js 18 or newer** is installed.
2. Open the `一键启动` folder.
3. Double-click `Windows-一键启动.bat`.
4. A Command Prompt window will display the startup status, then the browser will open automatically.
5. Keep the command window open while the page is running.
6. To stop the server, press **Ctrl + C** or close the command window.

If Windows Defender SmartScreen displays a warning, continue only when you trust the source package.

## Other ways to open the project

### Option 1: npm

Open a terminal in the project root:

```bash
npm start
```

### Option 2: Node.js directly

The runtime has no third-party dependency, so you can also run:

```bash
node scripts/serve.mjs
```

### Option 3: Select a port

```bash
node scripts/serve.mjs --port 5000
```

### Option 4: Do not open the browser automatically

```bash
node scripts/serve.mjs --no-open
```

Open the URL shown in the terminal manually.

## URL and port behavior

Default address:

```text
http://127.0.0.1:4173
```

If port 4173 is already in use, the server automatically tries 4174, 4175, and later ports. Always use the final URL printed in the terminal.

> Do not open `index.html` directly. The project uses ES Modules, so a `file://` URL may block scripts and assets. Run the local server instead.

## Check Node.js

Run:

```bash
node -v
```

The version should be `v18.x`, `v20.x`, `v22.x`, or newer. If the command is unavailable, install Node.js first.

## Controls

- **Autoplay**: all six capsules start moving after the page loads.
- **Shuffle**: regenerates shape parameters for all capsules.
- **Pause / Continue**: freezes or resumes all visible capsules.
- **All / Cool / Warm**: filters capsules by palette group.
- **Click a capsule**: opens the immersive full-screen viewer.
- **Move or touch**: temporarily changes the fluid gravity direction.
- **Randomize**: regenerates the current capsule inside the viewer.
- **Close**: exits the immersive viewer.

## Features

- Realtime WebGL2 fluid and nebula rendering
- Automatic Canvas 2D fallback
- Six independent color presets
- Autoplay on page load
- Pointer and touch gravity interaction
- Global pause and resume
- Shape randomization
- Cool/warm filtering
- Full-screen immersive viewer
- Off-screen rendering suspension
- Responsive two-column desktop and one-column mobile layout

## Troubleshooting

### The launcher does nothing

Run `node -v` in Terminal or Command Prompt. If no version is shown, Node.js is missing or is not available in your system PATH.

### The browser does not open automatically

Copy the URL printed in the terminal, for example:

```text
http://127.0.0.1:4173
```

### Port 4173 is already in use

No manual action is required. The server automatically searches for the next available port and prints the final address.

### The page opens without the full fluid effect

The browser or GPU may not support WebGL2. The project automatically falls back to a Canvas 2D animation. Use a current version of Chrome, Edge, or Safari for the best result.

### How to stop the server

Press `Control + C` on macOS or `Ctrl + C` on Windows in the terminal that is running the server, or close that window.

## Development and verification

```bash
npm run check
npm test
```

## Main files

```text
index.html              Page structure
styles.css              Page and component styles
src/                    Animation and interaction source
scripts/serve.mjs       Local static server
一键启动/               Dedicated one-click launcher folder
README.md               Chinese documentation
README.en.md            English documentation
```

## Network scope

By default, the project serves only on local address `127.0.0.1`. It is not published to the internet and does not upload user data.
