# Architecture

## Rendering model

Each capsule owns a small `canvas` and an independent `CosmicRenderer`. A shared animation loop supplies elapsed time to all visible renderers. `IntersectionObserver` disables drawing for off-screen capsules.

## Shader pipeline

1. A full-screen triangle covers the canvas.
2. Layered value noise builds fractional Brownian motion (FBM).
3. Domain warping bends the FBM field into fluid nebula structures.
4. Four preset colors are interpolated through the generated density field.
5. A procedural star grid adds sparse, independently twinkling points.
6. Pointer distance applies a localized rotation and displacement field.
7. Vignette and gamma shaping finish the image.

## Performance controls

- Device pixel ratio is capped per renderer.
- Off-screen canvases are not drawn.
- Hidden tabs stop rendering.
- `prefers-reduced-motion` starts the experience paused.
- WebGL2 failure automatically activates a Canvas 2D fallback.

## Extension points

- Add or edit visual presets in `src/presets.js`.
- Change noise, color mixing, stars, or pointer behavior in `src/cosmic-shader.js`.
- Replace the gallery shell without changing the renderer API.
