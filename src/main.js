import { CosmicRenderer } from './cosmic-shader.js';
import { FallbackRenderer } from './fallback.js';
import { PRESETS } from './presets.js';

const grid = document.querySelector('#capsule-grid');
const indexList = document.querySelector('#preset-index');
const pauseButton = document.querySelector('#pause-button');
const visibleCount = document.querySelector('#visible-count');
const viewer = document.querySelector('#viewer');
const viewerCanvas = document.querySelector('#viewer-canvas');
const viewerTitle = document.querySelector('#viewer-title');
const viewerCode = document.querySelector('#viewer-code');
const closeViewer = document.querySelector('#close-viewer');
const randomizeButton = document.querySelector('#randomize-button');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let paused = reduceMotion;
let pageVisible = !document.hidden;
let viewerRenderer = null;
let activePreset = PRESETS[0];
let frozenTime = 0;
let pauseStartedAt = 0;
let accumulatedPause = 0;
const renderers = [];

function createRenderer(canvas, preset, options) {
  try {
    return new CosmicRenderer(canvas, preset, options);
  } catch (error) {
    console.warn('[画境观屿] WebGL2 unavailable, using Canvas 2D fallback.', error);
    return new FallbackRenderer(canvas, preset);
  }
}

function createCard(preset) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'capsule-card';
  card.dataset.group = preset.group;
  card.setAttribute('aria-label', `打开 ${preset.name} 沉浸视图`);
  card.innerHTML = `
    <span class="capsule-heading">
      <span><span class="capsule-code">${preset.code}</span> <strong>${preset.name}</strong></span>
      <span class="capsule-mode">LIVE</span>
    </span>
    <span class="capsule-stage">
      <span class="capsule-copy-panel">
        <span class="capsule-brand">画境观屿</span>
        <span class="capsule-meta">HUA JING GUAN YU</span>
        <span class="capsule-state">LIVE COSMIC STUDY</span>
      </span>
      <span class="capsule-visual">
        <canvas aria-hidden="true"></canvas>
      </span>
      <span class="capsule-orbit-dot" aria-hidden="true">•</span>
    </span>
  `;
  const canvas = card.querySelector('canvas');
  const renderer = createRenderer(canvas, preset, { dprCap: 1.6 });
  renderers.push(renderer);
  card.addEventListener('click', () => openViewer(preset));
  grid.append(card);
  return { card, renderer };
}

PRESETS.forEach((preset) => {
  createCard(preset);
  const item = document.createElement('li');
  item.textContent = `${preset.code} ${preset.name}`;
  indexList.append(item);
});

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const index = [...grid.children].indexOf(entry.target);
    if (renderers[index]) renderers[index].visible = entry.isIntersecting;
  }
}, { rootMargin: '160px' });
[...grid.children].forEach((card) => observer.observe(card));

function openViewer(preset) {
  activePreset = preset;
  viewerTitle.textContent = preset.name;
  viewerCode.textContent = preset.code;
  viewer.showModal();
  viewerRenderer?.dispose();
  viewerRenderer = createRenderer(viewerCanvas, preset, { dprCap: 2 });
  viewerRenderer.motionTarget = 0.22;
}

function closeActiveViewer() {
  viewerRenderer?.dispose();
  viewerRenderer = null;
  viewer.close();
}

closeViewer.addEventListener('click', closeActiveViewer);
viewer.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeActiveViewer();
});
viewer.addEventListener('click', (event) => {
  if (event.target === viewer) closeActiveViewer();
});
randomizeButton.addEventListener('click', () => viewerRenderer?.randomize());

pauseButton.addEventListener('click', () => {
  paused = !paused;
  pauseButton.setAttribute('aria-pressed', String(paused));
  pauseButton.textContent = paused ? '▶' : 'Ⅱ';
  pauseButton.setAttribute('aria-label', paused ? '继续动效' : '暂停动效');
  if (paused) pauseStartedAt = performance.now();
  else if (pauseStartedAt) accumulatedPause += performance.now() - pauseStartedAt;
});

for (const button of document.querySelectorAll('.filter-button')) {
  button.addEventListener('click', () => {
    document.querySelector('.filter-button.is-active')?.classList.remove('is-active');
    button.classList.add('is-active');
    const filter = button.dataset.filter;
    let count = 0;
    for (const card of grid.children) {
      const visible = filter === 'all' || card.dataset.group === filter;
      card.hidden = !visible;
      if (visible) count += 1;
    }
    visibleCount.textContent = String(count).padStart(2, '0');
  });
}

document.addEventListener('visibilitychange', () => {
  pageVisible = !document.hidden;
});

function render(now) {
  if (!paused) frozenTime = (now - accumulatedPause) / 1000;
  if (pageVisible) {
    for (const renderer of renderers) renderer.draw(frozenTime, paused);
    viewerRenderer?.draw(frozenTime, paused);
  }
  requestAnimationFrame(render);
}

pauseButton.setAttribute('aria-pressed', String(paused));
pauseButton.textContent = paused ? '▶' : 'Ⅱ';
requestAnimationFrame(render);
