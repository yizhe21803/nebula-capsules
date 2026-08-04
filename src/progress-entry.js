import { PROGRESS_PRESETS } from './progress-presets.js';
import { createProgressCapsules } from './progress-capsules.js';
import { createProgressFlowOverlays } from './progress-flow-overlays.js';

const LEGACY_CAPSULE_COUNT = 9;

function mountProgressCapsules() {
  const grid = document.querySelector('#capsule-grid');
  const indexList = document.querySelector('#capsule-index');
  const visibleCount = document.querySelector('#visible-count');
  const totalCount = document.querySelector('#total-count');
  const pauseButton = document.querySelector('#pause-button');
  const shuffleButton = document.querySelector('#shuffle-button');

  if (!grid || !indexList || !visibleCount || !totalCount || !pauseButton || !shuffleButton) {
    throw new Error('[画境观屿] 进度胶囊挂载失败：页面结构不完整。');
  }

  if (grid.dataset.progressMounted === 'true') return;

  // Do not touch the original renderer. Wait until main.js has mounted NC-01 through NC-09.
  if (grid.children.length < LEGACY_CAPSULE_COUNT || indexList.children.length < LEGACY_CAPSULE_COUNT) {
    requestAnimationFrame(mountProgressCapsules);
    return;
  }

  grid.dataset.progressMounted = 'true';

  const progressCapsules = createProgressCapsules({ grid, indexList });
  const flowOverlays = createProgressFlowOverlays(progressCapsules.cards, PROGRESS_PRESETS);
  const totalItems = grid.children.length;
  const totalText = String(totalItems).padStart(2, '0');

  totalCount.textContent = totalText;

  const activeFilter = document.querySelector('.filter-button.is-active')?.dataset.filter || 'all';
  visibleCount.textContent = activeFilter === 'progress'
    ? String(PROGRESS_PRESETS.length).padStart(2, '0')
    : totalText;

  shuffleButton.addEventListener('click', () => progressCapsules.randomize());

  let lastFrame = performance.now();
  let pageVisible = !document.hidden;
  let flowTime = 0;

  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
    lastFrame = performance.now();
  });

  function update(now) {
    const delta = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    const paused = pauseButton.getAttribute('aria-pressed') === 'true';

    if (pageVisible) {
      progressCapsules.update(delta, paused, now);
      if (!paused) flowTime += delta;
      flowOverlays.update(flowTime);
    }

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

mountProgressCapsules();
