import { PROGRESS_PRESETS } from './progress-presets.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

class ProgressCapsuleController {
  constructor(card, preset) {
    this.card = card;
    this.preset = preset;
    this.stage = card.querySelector('.progress-stage');
    this.valueElement = card.querySelector('.progress-value');
    this.value = preset.initialProgress;
    this.dragging = false;
    this.resumeAt = 0;
    this.completeUntil = 0;

    this.stage.style.setProperty('--progress-accent-a', preset.colors[0]);
    this.stage.style.setProperty('--progress-accent-b', preset.colors[1]);
    this.stage.style.setProperty('--progress-accent-c', preset.colors[2]);
    this.stage.style.setProperty('--progress-glow', preset.colors[3]);

    this.setProgress(this.value);
    this.bindEvents();
  }

  setProgress(nextValue) {
    this.value = clamp(nextValue, 0, 100);
    const rounded = Math.round(this.value);
    this.stage.style.setProperty('--progress', this.value.toFixed(2));
    this.stage.setAttribute('aria-valuenow', String(rounded));
    this.stage.setAttribute('aria-valuetext', `${rounded}%`);
    this.valueElement.textContent = `${rounded}%`;
  }

  updateFromPointer(event) {
    const bounds = this.stage.getBoundingClientRect();
    const ratio = bounds.width > 0 ? (event.clientX - bounds.left) / bounds.width : 0;
    this.setProgress(ratio * 100);
    this.completeUntil = 0;
  }

  beginDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    this.dragging = true;
    this.resumeAt = Number.POSITIVE_INFINITY;
    this.stage.classList.add('is-dragging');
    this.stage.setPointerCapture?.(event.pointerId);
    this.updateFromPointer(event);
  }

  moveDrag(event) {
    if (!this.dragging) return;
    event.preventDefault();
    this.updateFromPointer(event);
  }

  endDrag(event) {
    if (!this.dragging) return;
    this.dragging = false;
    this.resumeAt = performance.now() + 1800;
    this.stage.classList.remove('is-dragging');
    if (event?.pointerId !== undefined && this.stage.hasPointerCapture?.(event.pointerId)) {
      this.stage.releasePointerCapture(event.pointerId);
    }
  }

  bindEvents() {
    this.stage.addEventListener('pointerdown', (event) => this.beginDrag(event));
    this.stage.addEventListener('pointermove', (event) => this.moveDrag(event));
    this.stage.addEventListener('pointerup', (event) => this.endDrag(event));
    this.stage.addEventListener('pointercancel', (event) => this.endDrag(event));

    this.stage.addEventListener('keydown', (event) => {
      const actions = {
        ArrowLeft: -2,
        ArrowDown: -2,
        ArrowRight: 2,
        ArrowUp: 2,
        PageDown: -10,
        PageUp: 10
      };

      if (event.key === 'Home') {
        event.preventDefault();
        this.setProgress(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        this.setProgress(100);
      } else if (actions[event.key]) {
        event.preventDefault();
        this.setProgress(this.value + actions[event.key]);
      } else {
        return;
      }

      this.resumeAt = performance.now() + 1800;
      this.completeUntil = 0;
    });
  }

  update(delta, paused, now) {
    if (paused || this.dragging || now < this.resumeAt) return;

    if (this.value >= 100) {
      if (!this.completeUntil) this.completeUntil = now + 900;
      if (now >= this.completeUntil) {
        this.completeUntil = 0;
        this.setProgress(8);
      }
      return;
    }

    this.setProgress(this.value + this.preset.loadRate * delta);
  }

  randomize() {
    this.completeUntil = 0;
    this.resumeAt = performance.now() + 600;
    this.setProgress(18 + Math.random() * 68);
  }
}

function createProgressCard(preset) {
  const card = document.createElement('article');
  card.className = 'capsule-card progress-card';
  card.dataset.group = preset.group;
  card.dataset.mode = 'progress';
  card.dataset.progressId = preset.id;

  card.innerHTML = `
    <span class="card-topline">
      <span><span class="card-code">${preset.code}</span> <strong>${preset.name}</strong></span>
      <span class="card-live">AUTO + DRAG</span>
    </span>
    <span
      class="progress-stage"
      role="slider"
      tabindex="0"
      aria-label="${preset.name} 加载进度"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow="${preset.initialProgress}"
    >
      <span class="progress-fill" aria-hidden="true"></span>
      <span class="progress-interface" aria-hidden="true"></span>
      <span class="progress-copy">
        <span class="progress-name">${preset.name}<sup>*</sup></span>
        <span class="progress-subtitle">${preset.subtitle}</span>
      </span>
      <span class="progress-value" aria-hidden="true">${preset.initialProgress}%</span>
      <span class="progress-drag-label" aria-hidden="true">DRAG</span>
    </span>
  `;

  return card;
}

export function createProgressCapsules({ grid, indexList }) {
  const controllers = [];

  for (const preset of PROGRESS_PRESETS) {
    const card = createProgressCard(preset);
    grid.append(card);
    controllers.push(new ProgressCapsuleController(card, preset));

    const item = document.createElement('li');
    item.textContent = `${preset.code} ${preset.name}`;
    indexList.append(item);
  }

  return {
    cards: controllers.map((controller) => controller.card),
    update(delta, paused, now) {
      for (const controller of controllers) controller.update(delta, paused, now);
    },
    randomize() {
      for (const controller of controllers) controller.randomize();
    }
  };
}
