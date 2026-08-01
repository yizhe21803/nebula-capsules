import { CosmicRenderer } from './cosmic-shader.js';
import { FallbackRenderer } from './fallback.js';
import { PRESETS } from './presets.js';

const grid = document.querySelector('#capsule-grid');
const indexList = document.querySelector('#capsule-index');
const pauseButton = document.querySelector('#pause-button');
const pauseIcon = pauseButton.querySelector('.pause-icon');
const pauseLabel = pauseButton.querySelector('.pause-label');
const shuffleButton = document.querySelector('#shuffle-button');
const visibleCount = document.querySelector('#visible-count');
const totalCount = document.querySelector('#total-count');
const viewer = document.querySelector('#viewer');
const viewerCanvas = document.querySelector('#viewer-canvas');
const viewerTitle = document.querySelector('#viewer-title');
const viewerCode = document.querySelector('#viewer-code');
const viewerClose = document.querySelector('#viewer-close');
const viewerRandomize = document.querySelector('#viewer-randomize');

let paused = false;
let pageVisible = !document.hidden;
let animationTime = 0;
let lastFrame = performance.now();
let viewerRenderer = null;
const renderers = [];

function createRenderer(canvas, preset, options) {
  try {
    return new CosmicRenderer(canvas, preset, options);
  } catch (error) {
    console.warn('[画境观屿] WebGL2 不可用，已切换 Canvas 2D 降级动效。', error);
    return new FallbackRenderer(canvas, preset);
  }
}

function openViewer(preset) {
  viewerTitle.textContent = preset.name;
  viewerCode.textContent = preset.code;
  viewer.showModal();
  viewerRenderer?.dispose();
  viewerRenderer = createRenderer(viewerCanvas, preset, { dprCap: 2 });
}

function closeViewer() {
  viewerRenderer?.dispose();
  viewerRenderer = null;
  viewer.close();
}

function createCard(preset) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'capsule-card';
  card.dataset.group = preset.group;
  card.dataset.mode = preset.mode || 'nebula';
  card.setAttribute('aria-label', `打开 ${preset.name} 沉浸预览`);
  const subtitle = preset.subtitle || '画境观屿';
  const brandLine = preset.subtitle ? 'SOFT AURORA CAPSULE' : 'HUA JING GUAN YU';
  const studyLine = preset.mode === 'aurora' ? 'LIVE AURORA STUDY' : 'LIVE COSMIC STUDY';
  card.innerHTML = `
    <span class="card-topline">
      <span><span class="card-code">${preset.code}</span> <strong>${preset.name}</strong></span>
      <span class="card-live">LIVE</span>
    </span>
    <span class="capsule-stage">
      <span class="card-copy">
        <span class="card-code-inside">${preset.code}</span>
        <span class="card-name">${preset.name}</span>
        <span class="card-brand">${subtitle}</span>
        <span class="card-brand-en">${brandLine}</span>
        <span class="card-state">${studyLine}</span>
      </span>
      <span class="capsule-visual"><canvas aria-hidden="true"></canvas></span>
    </span>
  `;

  const canvas = card.querySelector('canvas');
  const renderer = createRenderer(canvas, preset, { dprCap: 1.55 });
  renderers.push(renderer);
  card.addEventListener('click', () => openViewer(preset));
  grid.append(card);
}

for (const preset of PRESETS) {
  createCard(preset);
  const item = document.createElement('li');
  item.textContent = `${preset.code} ${preset.name}`;
  indexList.append(item);
}

const totalText = String(PRESETS.length).padStart(2, '0');
visibleCount.textContent = totalText;
totalCount.textContent = totalText;

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const index = [...grid.children].indexOf(entry.target);
    if (renderers[index]) renderers[index].visible = entry.isIntersecting;
  }
}, { rootMargin: '180px' });

[...grid.children].forEach((card) => observer.observe(card));

function updatePauseControl() {
  pauseButton.setAttribute('aria-pressed', String(paused));
  pauseIcon.textContent = paused ? '▶' : 'Ⅱ';
  pauseLabel.textContent = paused ? '继续动效' : '暂停动效';
}

pauseButton.addEventListener('click', () => {
  paused = !paused;
  updatePauseControl();
});

shuffleButton.addEventListener('click', () => {
  for (const renderer of renderers) renderer.randomize();
  viewerRenderer?.randomize();
});

viewerRandomize.addEventListener('click', () => viewerRenderer?.randomize());
viewerClose.addEventListener('click', closeViewer);
viewer.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeViewer();
});
viewer.addEventListener('click', (event) => {
  if (event.target === viewer) closeViewer();
});

for (const button of document.querySelectorAll('.filter-button')) {
  button.addEventListener('click', () => {
    document.querySelector('.filter-button.is-active')?.classList.remove('is-active');
    button.classList.add('is-active');
    const filter = button.dataset.filter;
    let count = 0;
    for (const card of grid.children) {
      const show = filter === 'all' || card.dataset.group === filter;
      card.hidden = !show;
      if (show) count += 1;
    }
    visibleCount.textContent = String(count).padStart(2, '0');
  });
}

document.addEventListener('visibilitychange', () => {
  pageVisible = !document.hidden;
  lastFrame = performance.now();
});

function render(now) {
  const delta = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  if (!paused) animationTime += delta;

  if (pageVisible) {
    for (const renderer of renderers) renderer.draw(animationTime);
    viewerRenderer?.draw(animationTime);
  }
  requestAnimationFrame(render);
}

updatePauseControl();
requestAnimationFrame(render);
