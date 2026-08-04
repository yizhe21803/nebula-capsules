import { PROGRESS_PRESETS } from './progress-presets.js';
import { createProgressCapsules } from './progress-capsules.js';

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

  // 不修改原渲染器：等待 main.js 完成 NC-01～NC-09 挂载后，再追加三条进度胶囊。
  if (grid.children.length < LEGACY_CAPSULE_COUNT || indexList.children.length < LEGACY_CAPSULE_COUNT) {
    requestAnimationFrame(mountProgressCapsules);
    return;
  }

  grid.dataset.progressMounted = 'true';

  const progressCapsules = createProgressCapsules({ grid, indexList });
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
    }

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

mountProgressCapsules();
