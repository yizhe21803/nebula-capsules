import { PROGRESS_PRESETS } from './progress-presets.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function hexToRgba(hex, alpha = 1) {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

class ProgressCapsuleController {
  constructor(card, preset) {
    this.card = card;
    this.preset = preset;
    this.stage = card.querySelector('.progress-stage');
    this.canvas = card.querySelector('.progress-wave-canvas');
    this.context = this.canvas.getContext('2d');
    this.valueElement = card.querySelector('.progress-value');
    this.value = preset.initialProgress;
    this.dragging = false;
    this.resumeAt = 0;
    this.completeUntil = 0;
    this.flowTime = Math.random() * 20;
    this.dpr = 1;
    this.width = 0;
    this.height = 0;

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.stage);

    this.setProgress(this.value);
    this.bindEvents();
    this.resizeCanvas();
  }

  setProgress(nextValue) {
    this.value = clamp(nextValue, 0, 100);
    const rounded = Math.round(this.value);
    this.stage.style.setProperty('--progress', this.value.toFixed(2));
    this.stage.setAttribute('aria-valuenow', String(rounded));
    this.stage.setAttribute('aria-valuetext', `${rounded}%`);
    this.valueElement.textContent = `${rounded}%`;
  }

  resizeCanvas() {
    const bounds = this.stage.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, bounds.width);
    this.height = Math.max(1, bounds.height);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawBeachWaves();
  }

  createBoundaryPath(baseX, amplitude, frequency, phase, secondaryAmplitude = 0) {
    const path = new Path2D();
    const step = Math.max(3, this.height / 34);
    path.moveTo(0, 0);
    path.lineTo(baseX, 0);

    for (let y = 0; y <= this.height + step; y += step) {
      const primary = Math.sin(y * frequency + phase) * amplitude;
      const secondary = Math.sin(y * frequency * 0.47 - phase * 1.38) * secondaryAmplitude;
      const curl = Math.sin(y * frequency * 1.9 + phase * 0.62) * amplitude * 0.16;
      path.lineTo(baseX + primary + secondary + curl, y);
    }

    path.lineTo(0, this.height);
    path.closePath();
    return path;
  }

  createFoamPath(baseX, amplitude, frequency, phase, secondaryAmplitude = 0) {
    const path = new Path2D();
    const step = Math.max(3, this.height / 38);

    for (let y = 0; y <= this.height + step; y += step) {
      const primary = Math.sin(y * frequency + phase) * amplitude;
      const secondary = Math.sin(y * frequency * 0.47 - phase * 1.38) * secondaryAmplitude;
      const curl = Math.sin(y * frequency * 1.9 + phase * 0.62) * amplitude * 0.16;
      const x = baseX + primary + secondary + curl;
      if (y === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }

    return path;
  }

  drawWaveLayer({ baseX, amplitude, frequency, phase, colors, alpha, foamAlpha, blur }) {
    const ctx = this.context;
    const bodyPath = this.createBoundaryPath(baseX, amplitude, frequency, phase, amplitude * 0.34);
    const foamPath = this.createFoamPath(baseX, amplitude, frequency, phase, amplitude * 0.34);

    const gradient = ctx.createLinearGradient(0, 0, Math.max(baseX + amplitude * 2, 1), 0);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.52, colors[1]);
    gradient.addColorStop(0.84, colors[2]);
    gradient.addColorStop(1, colors[3]);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = colors[3];
    ctx.shadowBlur = blur;
    ctx.fillStyle = gradient;
    ctx.fill(bodyPath);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = foamAlpha;
    ctx.strokeStyle = hexToRgba('#FFFFFF', 0.95);
    ctx.lineWidth = Math.max(1.2, this.height * 0.013);
    ctx.shadowColor = colors[3];
    ctx.shadowBlur = Math.max(8, this.height * 0.12);
    ctx.stroke(foamPath);
    ctx.restore();
  }

  drawSwashGlow(centerX, centerY, radiusX, radiusY, color, alpha) {
    const ctx = this.context;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(1, radiusY / radiusX);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
    glow.addColorStop(0, hexToRgba(color, alpha));
    glow.addColorStop(0.52, hexToRgba(color, alpha * 0.34));
    glow.addColorStop(1, hexToRgba(color, 0));
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = glow;
    ctx.fillRect(-radiusX, -radiusX, radiusX * 2, radiusX * 2);
    ctx.restore();
  }

  drawBeachWaves() {
    if (!this.context || this.width <= 0 || this.height <= 0) return;

    const ctx = this.context;
    const width = this.width;
    const height = this.height;
    const shoreline = width * (this.value / 100);
    const time = this.flowTime;
    const [dark, accentA, accentB, glow] = this.preset.colors;

    ctx.clearRect(0, 0, width, height);

    const background = ctx.createLinearGradient(0, 0, width, 0);
    background.addColorStop(0, '#17191F');
    background.addColorStop(0.62, '#22242A');
    background.addColorStop(1, '#2B2C31');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const ambient = ctx.createRadialGradient(
      shoreline,
      height * 0.5,
      0,
      shoreline,
      height * 0.5,
      Math.max(width * 0.3, height * 1.4)
    );
    ambient.addColorStop(0, hexToRgba(accentB, 0.18));
    ambient.addColorStop(0.5, hexToRgba(accentA, 0.08));
    ambient.addColorStop(1, hexToRgba(dark, 0));
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, width, height);

    this.drawWaveLayer({
      baseX: shoreline + 24,
      amplitude: height * 0.12,
      frequency: 0.052,
      phase: time * 0.82 + 0.8,
      colors: [dark, accentA, accentB, glow],
      alpha: 0.42,
      foamAlpha: 0.18,
      blur: height * 0.08
    });

    this.drawWaveLayer({
      baseX: shoreline + 8,
      amplitude: height * 0.16,
      frequency: 0.066,
      phase: -time * 1.12 + 2.2,
      colors: [dark, accentB, accentA, glow],
      alpha: 0.58,
      foamAlpha: 0.31,
      blur: height * 0.10
    });

    this.drawWaveLayer({
      baseX: shoreline - 8,
      amplitude: height * 0.20,
      frequency: 0.083,
      phase: time * 1.46 + 4.1,
      colors: [dark, accentA, accentB, glow],
      alpha: 0.88,
      foamAlpha: 0.68,
      blur: height * 0.15
    });

    const driftA = Math.sin(time * 0.74) * height * 0.20;
    const driftB = Math.cos(time * 0.57 + 1.4) * height * 0.24;
    this.drawSwashGlow(
      shoreline - width * 0.07,
      height * 0.35 + driftA,
      Math.max(54, width * 0.16),
      height * 0.62,
      accentB,
      0.34
    );
    this.drawSwashGlow(
      shoreline - width * 0.03,
      height * 0.68 + driftB,
      Math.max(48, width * 0.13),
      height * 0.50,
      glow,
      0.24
    );

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = hexToRgba('#FFFFFF', 0.72);
    ctx.lineWidth = 1;

    for (let index = 0; index < 3; index += 1) {
      const offset = (index - 1) * height * 0.24;
      const y = height * 0.5 + offset + Math.sin(time * (0.72 + index * 0.16)) * height * 0.06;
      ctx.beginPath();
      ctx.moveTo(Math.max(0, shoreline - width * 0.36), y);
      ctx.bezierCurveTo(
        shoreline - width * 0.24,
        y - height * 0.11,
        shoreline - width * 0.12,
        y + height * 0.12,
        shoreline + height * 0.04,
        y - height * 0.02
      );
      ctx.stroke();
    }
    ctx.restore();

    const gloss = ctx.createLinearGradient(0, 0, 0, height);
    gloss.addColorStop(0, 'rgba(255,255,255,0.16)');
    gloss.addColorStop(0.34, 'rgba(255,255,255,0.02)');
    gloss.addColorStop(1, 'rgba(0,0,0,0.12)');
    ctx.fillStyle = gloss;
    ctx.fillRect(0, 0, width, height);
  }

  updateFromPointer(event) {
    const bounds = this.stage.getBoundingClientRect();
    const ratio = bounds.width > 0 ? (event.clientX - bounds.left) / bounds.width : 0;
    this.setProgress(ratio * 100);
    this.completeUntil = 0;
    this.drawBeachWaves();
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
      this.drawBeachWaves();
    });
  }

  update(delta, paused, now) {
    if (!paused) {
      this.flowTime += delta;
    }

    if (!paused && !this.dragging && now >= this.resumeAt) {
      if (this.value >= 100) {
        if (!this.completeUntil) this.completeUntil = now + 900;
        if (now >= this.completeUntil) {
          this.completeUntil = 0;
          this.setProgress(8);
        }
      } else {
        this.setProgress(this.value + this.preset.loadRate * delta);
      }
    }

    this.drawBeachWaves();
  }

  randomize() {
    this.completeUntil = 0;
    this.resumeAt = performance.now() + 600;
    this.flowTime = Math.random() * 20;
    this.setProgress(18 + Math.random() * 68);
    this.drawBeachWaves();
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
      <canvas class="progress-wave-canvas" aria-hidden="true"></canvas>
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
