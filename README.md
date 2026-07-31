# 画境观屿 · Nebula Capsules

Interactive WebGL cosmic fluid materials inside fixed capsule cards.

![Nebula Capsules preview](assets/preview.png)

## Highlights

- Real-time GLSL nebula rendering with domain-warped FBM noise
- Six deterministic cosmic color presets
- Pointer / touch gravity swirl interaction
- Click-to-open immersive full-screen view
- Responsive desktop and mobile layout
- Intersection-based rendering pause for off-screen cards
- Reduced-motion support and Canvas 2D fallback
- Zero runtime dependencies
- GitHub Pages deployment workflow included

## Run locally

```bash
npm start
```

Open `http://127.0.0.1:4173`.

## Project structure

```text
.
├── index.html
├── styles.css
├── src/
│   ├── main.js
│   ├── cosmic-shader.js
│   ├── fallback.js
│   └── presets.js
├── scripts/serve.mjs
├── tests/smoke.mjs
└── .github/workflows/pages.yml
```

## Customize a preset

Edit `src/presets.js`:

```js
{
  id: 'aurora-veil',
  code: 'NC-01',
  name: 'AURORA VEIL',
  group: 'cold',
  seed: 1.7,
  speed: 0.16,
  colors: ['#061326', '#5b38df', '#34d9ff', '#8bffe9']
}
```

## Quality checks

```bash
npm run check
npm test
```

## Deploy to GitHub Pages

1. Push the repository to GitHub.
2. Open **Settings → Pages**.
3. Choose **GitHub Actions** as the source.
4. Push to `main`; the included workflow publishes the site.

## Browser support

Modern browsers with WebGL2 are recommended. A Canvas 2D fallback is provided for unsupported environments.

## License

MIT © 2026 yizhe21803
