import { PROGRESS_PRESETS } from './progress-presets.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (start, end, amount) => start + (end - start) * amount;
const smoothstep = (value) => value * value * (3 - 2 * value);

function hexToRgba(hex, alpha = 1) {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function stringSeed(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

const FLOW_PROFILES = {
  'model-training': {
    large: 11.8,
    medium: 8.8,
    fine: 5.0,
    lobe: 5.2,
    timeScale: 0.92,
    detailScale: 1.12,
    glowWidth: 5.0,
    haloWidth: 18
  },
  'agent-migration': {
    large: 14.2,
    medium: 7.0,
    fine: 2.8,
    lobe: 6.4,
    timeScale: 0.74,
    detailScale: 0.78,
    glowWidth: 4.2,
    haloWidth: 22
  },
  'visual-training': {
    large: 12.6,
    medium: 8.4,
    fine: 4.0,
    lobe: 5.8,
    timeScale: 0.84,
    detailScale: 0.96,
    glowWidth: 4.6,
    haloWidth: 20
  }
};

class ProgressCapsuleController {
  constructor(card, preset) {
    this.card = card;
    this.preset = preset;
    this.profile = FLOW_PROFILES[preset.id] || FLOW_PROFILES['visual-training'];
    this.stage = card.querySelector('.progress-stage');
    this.canvas = card.querySelector('.progress-wave-canvas');
    this.context = this.canvas.getContext('2d');
    this.valueElement = card.querySelector('.progress-value');
    this.value = preset.initialProgress;
    this.dragging = false;
    this.resumeAt = 0;
    this.completeUntil = 0;
    this.flowTime = stringSeed(preset.id) * 37;
    this.noiseSeed = stringSeed(`${preset.id}-flow`) * 97 + 3;
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
    this.drawReferenceFlow();
  }

  hash2D(x, y, salt = 0) {
    const value = Math.sin(
      x * 127.1 + y * 311.7 + (this.noiseSeed + salt) * 74.7
    ) * 43758.5453123;
    return value - Math.floor(value);
  }

  valueNoise2D(x, y, salt = 0) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const xf = x - x0;
    const yf = y - y0;
    const u = smoothstep(xf);
    const v = smoothstep(yf);

    const a = this.hash2D(x0, y0, salt);
    const b = this.hash2D(x0 + 1, y0, salt);
    const c = this.hash2D(x0, y0 + 1, salt);
    const d = this.hash2D(x0 + 1, y0 + 1, salt);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }

  fbm2D(x, y, salt = 0) {
    let value = 0;
    let amplitude = 0.56;
    let frequency = 1;
    let total = 0;

    for (let octave = 0; octave < 4; octave += 1) {
      value += this.valueNoise2D(
        x * frequency + octave * 7.17,
        y * frequency - octave * 5.31,
        salt + octave * 13.9
      ) * amplitude;
      total += amplitude;
      frequency *= 2.03;
      amplitude *= 0.48;
    }

    return value / total;
  }

  edgeEnvelope(yRatio) {
    const top = smoothstep(clamp(yRatio / 0.12, 0, 1));
    const bottom = smoothstep(clamp((1 - yRatio) / 0.12, 0, 1));
    return Math.pow(top * bottom, 0.72);
  }

  edgeOffset(y, time, phase = 0, amplitudeScale = 1) {
    const { large, medium, fine, lobe, timeScale, detailScale } = this.profile;
    const yRatio = this.height > 0 ? y / this.height : 0;
    const envelope = this.edgeEnvelope(yRatio);
    const scaledTime = time * timeScale;

    const broad = (this.fbm2D(
      y * 0.0105 + this.noiseSeed * 0.03,
      scaledTime * 0.105 + phase,
      1.2
    ) * 2 - 1) * large;

    const middle = (this.fbm2D(
      y * 0.026 * detailScale + this.noiseSeed * 0.07,
      scaledTime * 0.22 - phase * 0.63,
      5.8
    ) * 2 - 1) * medium;

    const detail = (this.fbm2D(
      y * 0.070 * detailScale + this.noiseSeed * 0.11,
      scaledTime * 0.43 + phase * 0.87,
      11.3
    ) * 2 - 1) * fine;

    const localLobes = (this.valueNoise2D(
      y * 0.018 + this.noiseSeed * 0.13,
      scaledTime * 0.16 + 19.7 + phase,
      18.4
    ) * 2 - 1) * lobe;

    return (broad + middle + detail + localLobes) * envelope * amplitudeScale;
  }

  createEdgePath(baseX, time, phase = 0, amplitudeScale = 1) {
    const path = new Path2D();
    const step = Math.max(2, this.height / 64);

    for (let y = 0; y <= this.height + step; y += step) {
      const x = baseX + this.edgeOffset(y, time, phase, amplitudeScale);
      if (y === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }

    return path;
  }

  createFillPath(baseX, time, phase = 0, amplitudeScale = 1) {
    const path = new Path2D();
    const step = Math.max(2, this.height / 64);
    path.moveTo(0, 0);
    path.lineTo(baseX + this.edgeOffset(0, time, phase, amplitudeScale), 0);

    for (let y = step; y <= this.height + step; y += step) {
      path.lineTo(
        baseX + this.edgeOffset(y, time, phase, amplitudeScale),
        y
      );
    }

    path.lineTo(0, this.height);
    path.closePath();
    return path;
  }

  drawEllipticalGlow(x, y, radiusX, radiusY, color, alpha) {
    const ctx = this.context;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, radiusY / radiusX);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
    gradient.addColorStop(0, hexToRgba(color, alpha));
    gradient.addColorStop(0.48, hexToRgba(color, alpha * 0.38));
    gradient.addColorStop(1, hexToRgba(color, 0));
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.fillRect(-radiusX, -radiusX, radiusX * 2, radiusX * 2);
    ctx.restore();
  }

  drawColorClouds(shoreline, time, accentA, accentB, glow) {
    const slowTime = time * this.profile.timeScale;
    const cloudData = [
      {
        y: this.height * (0.26 + this.valueNoise2D(slowTime * 0.07, 2.1, 31) * 0.18),
        x: shoreline - this.width * 0.095,
        rx: Math.max(58, this.width * 0.16),
        ry: this.height * 0.54,
        color: accentA,
        alpha: 0.34
      },
      {
        y: this.height * (0.66 + (this.valueNoise2D(slowTime * 0.06, 6.7, 44) - 0.5) * 0.28),
        x: shoreline - this.width * 0.065,
        rx: Math.max(48, this.width * 0.13),
        ry: this.height * 0.46,
        color: accentB,
        alpha: 0.30
      },
      {
        y: this.height * (0.46 + (this.valueNoise2D(slowTime * 0.09, 10.2, 58) - 0.5) * 0.34),
        x: shoreline - this.width * 0.025,
        rx: Math.max(34, this.width * 0.085),
        ry: this.height * 0.34,
        color: glow,
        alpha: 0.18
      }
    ];

    for (const cloud of cloudData) {
      this.drawEllipticalGlow(
        cloud.x,
        cloud.y,
        cloud.rx,
        cloud.ry,
        cloud.color,
        cloud.alpha
      );
    }
  }

  drawBlurredLayer({ baseX, time, phase, amplitudeScale, color, alpha, blur }) {
    const ctx = this.context;
    const path = this.createFillPath(baseX, time, phase, amplitudeScale);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = alpha;
    ctx.filter = `blur(${blur}px)`;
    ctx.fillStyle = color;
    ctx.fill(path);
    ctx.restore();
  }

  drawReferenceFlow() {
    if (!this.context || this.width <= 0 || this.height <= 0) return;

    const ctx = this.context;
    const width = this.width;
    const height = this.height;
    const shoreline = width * (this.value / 100);
    const time = this.flowTime;
    const [dark, accentA, accentB, glow] = this.preset.colors;

    ctx.clearRect(0, 0, width, height);

    const background = ctx.createLinearGradient(0, 0, width, 0);
    background.addColorStop(0, '#17171D');
    background.addColorStop(0.56, '#202126');
    background.addColorStop(1, '#242529');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const mainFill = this.createFillPath(shoreline, time, 0, 1);
    const bodyGradient = ctx.createLinearGradient(0, 0, Math.max(shoreline + 20, 1), 0);
    bodyGradient.addColorStop(0, dark);
    bodyGradient.addColorStop(0.42, hexToRgba(dark, 0.98));
    bodyGradient.addColorStop(0.68, hexToRgba(accentA, 0.32));
    bodyGradient.addColorStop(0.88, hexToRgba(accentB, 0.72));
    bodyGradient.addColorStop(1, hexToRgba(glow, 0.82));
    ctx.fillStyle = bodyGradient;
    ctx.fill(mainFill);

    this.drawColorClouds(shoreline, time, accentA, accentB, glow);

    this.drawBlurredLayer({
      baseX: shoreline - 64,
      time,
      phase: 7.8,
      amplitudeScale: 0.76,
      color: accentA,
      alpha: 0.22,
      blur: 20
    });
    this.drawBlurredLayer({
      baseX: shoreline - 34,
      time,
      phase: -4.1,
      amplitudeScale: 0.86,
      color: accentB,
      alpha: 0.30,
      blur: 13
    });

    const edgePath = this.createEdgePath(shoreline, time, 0, 1);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = hexToRgba(accentB, 0.24);
    ctx.lineWidth = this.profile.haloWidth;
    ctx.shadowColor = accentB;
    ctx.shadowBlur = this.profile.haloWidth * 1.1;
    ctx.stroke(edgePath);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = hexToRgba(glow, 0.76);
    ctx.lineWidth = this.profile.glowWidth;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 12;
    ctx.stroke(edgePath);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = hexToRgba('#FFFFFF', 0.92);
    ctx.lineWidth = 1.35;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 5;
    ctx.stroke(edgePath);
    ctx.restore();

    const sheen = ctx.createLinearGradient(0, 0, 0, height);
    sheen.addColorStop(0, 'rgba(255,255,255,0.12)');
    sheen.addColorStop(0.28, 'rgba(255,255,255,0.015)');
    sheen.addColorStop(1, 'rgba(0,0,0,0.10)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, width, height);
  }

  updateFromPointer(event) {
    const bounds = this.stage.getBoundingClientRect();
    const ratio = bounds.width > 0 ? (event.clientX - bounds.left) / bounds.width : 0;
    this.setProgress(ratio * 100);
    this.completeUntil = 0;
    this.drawReferenceFlow();
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
      this.drawReferenceFlow();
    });
  }

  update(delta, paused, now) {
    if (!paused) this.flowTime += delta;

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

    this.drawReferenceFlow();
  }

  randomize() {
    this.completeUntil = 0;
    this.resumeAt = performance.now() + 600;
    this.flowTime = Math.random() * 40;
    this.noiseSeed = Math.random() * 100 + 3;
    this.setProgress(18 + Math.random() * 68);
    this.drawReferenceFlow();
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
