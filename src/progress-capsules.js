import { PROGRESS_PRESETS } from './progress-presets.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (start, end, amount) => start + (end - start) * amount;

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
    cycles: [0.98, 3.05, 5.45],
    amplitudes: [11.2, 11.0, 5.2],
    speeds: [0.31, -0.53, 0.78],
    bulgeAmplitude: 8.2,
    timeScale: 1.0,
    glowWidth: 5.8,
    haloWidth: 20,
    whiteAlpha: 0.72,
    whiteWidth: 1.15,
    cloudWidth: 0.17,
    autoRange: [25, 66]
  },
  'agent-migration': {
    cycles: [0.62, 1.55, 2.95],
    amplitudes: [16.0, 7.8, 2.3],
    speeds: [0.25, -0.40, 0.60],
    bulgeAmplitude: 8.4,
    timeScale: 0.82,
    glowWidth: 6.3,
    haloWidth: 21,
    whiteAlpha: 0.18,
    whiteWidth: 0.45,
    cloudWidth: 0.18,
    autoRange: [24, 62]
  },
  'visual-training': {
    cycles: [0.88, 2.45, 4.35],
    amplitudes: [12.8, 10.2, 4.3],
    speeds: [0.28, -0.47, 0.69],
    bulgeAmplitude: 7.3,
    timeScale: 0.91,
    glowWidth: 6.0,
    haloWidth: 21,
    whiteAlpha: 0.30,
    whiteWidth: 0.55,
    cloudWidth: 0.175,
    autoRange: [20, 75]
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
    this.targetValue = preset.initialProgress;
    this.dragging = false;
    this.resumeAt = 0;
    this.nextTargetAt = 0;
    this.flowTime = stringSeed(preset.id) * 31;
    this.seed = stringSeed(`${preset.id}-reference`) * Math.PI * 2;
    this.randomState = Math.floor(stringSeed(`${preset.id}-auto`) * 0x7fffffff) || 1;
    this.dpr = 1;
    this.width = 0;
    this.height = 0;

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.stage);

    this.setProgress(this.value);
    this.bindEvents();
    this.resizeCanvas();
  }

  random() {
    this.randomState = (Math.imul(this.randomState, 1664525) + 1013904223) >>> 0;
    return this.randomState / 4294967296;
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

  edgeEnvelope(yRatio) {
    const edge = Math.sin(Math.PI * clamp(yRatio, 0, 1));
    return Math.pow(Math.max(edge, 0), 0.48);
  }

  localBulge(yRatio, time, index) {
    const direction = index === 0 ? 1 : -1;
    const center = 0.28 + index * 0.40 + Math.sin(time * (0.19 + index * 0.035) + this.seed * (1.1 + index)) * 0.13;
    const width = 0.075 + index * 0.016 + Math.sin(time * 0.13 + this.seed * 2.1) * 0.012;
    const distance = (yRatio - center) / Math.max(width, 0.035);
    const gaussian = Math.exp(-0.5 * distance * distance);
    return gaussian * Math.sin(time * (0.71 + index * 0.09) + this.seed * (2.7 + index)) * this.profile.bulgeAmplitude * direction;
  }

  edgeOffset(y, time, phase = 0, amplitudeScale = 1) {
    const yRatio = this.height > 0 ? y / this.height : 0;
    const envelope = this.edgeEnvelope(yRatio);
    const scaledTime = time * this.profile.timeScale;
    let offset = 0;

    for (let index = 0; index < this.profile.cycles.length; index += 1) {
      const cycle = this.profile.cycles[index];
      const amplitude = this.profile.amplitudes[index];
      const speed = this.profile.speeds[index];
      const amplitudeMotion = 0.74 + 0.26 * Math.sin(
        scaledTime * (0.17 + index * 0.045) + this.seed * (index + 2.4)
      );
      offset += Math.sin(
        yRatio * Math.PI * 2 * cycle + scaledTime * speed * Math.PI * 2 + this.seed * (index + 1) + phase
      ) * amplitude * amplitudeMotion;
    }

    offset += this.localBulge(yRatio, scaledTime + phase, 0);
    offset += this.localBulge(yRatio, scaledTime - phase * 0.7, 1);
    return offset * envelope * amplitudeScale;
  }

  createEdgePath(baseX, time, phase = 0, amplitudeScale = 1) {
    const path = new Path2D();
    const step = Math.max(1.8, this.height / 92);

    for (let y = 0; y <= this.height + step; y += step) {
      const x = baseX + this.edgeOffset(y, time, phase, amplitudeScale);
      if (y === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }
    return path;
  }

  createFillPath(baseX, time, phase = 0, amplitudeScale = 1) {
    const path = new Path2D();
    const step = Math.max(1.8, this.height / 92);
    path.moveTo(0, 0);
    path.lineTo(baseX + this.edgeOffset(0, time, phase, amplitudeScale), 0);
    for (let y = step; y <= this.height + step; y += step) {
      path.lineTo(baseX + this.edgeOffset(y, time, phase, amplitudeScale), y);
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
    gradient.addColorStop(0.42, hexToRgba(color, alpha * 0.48));
    gradient.addColorStop(1, hexToRgba(color, 0));
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.fillRect(-radiusX, -radiusX, radiusX * 2, radiusX * 2);
    ctx.restore();
  }

  drawDarkEllipticalShadow(x, y, radiusX, radiusY, alpha) {
    const ctx = this.context;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, radiusY / radiusX);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
    gradient.addColorStop(0, `rgba(6, 6, 11, ${alpha})`);
    gradient.addColorStop(0.54, `rgba(8, 8, 14, ${alpha * 0.62})`);
    gradient.addColorStop(1, 'rgba(8, 8, 14, 0)');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = gradient;
    ctx.fillRect(-radiusX, -radiusX, radiusX * 2, radiusX * 2);
    ctx.restore();
  }

  drawColorClouds(shoreline, time, accentA, accentB, glow) {
    const width = this.width;
    const height = this.height;
    const scale = this.profile.cloudWidth;
    const t = time * this.profile.timeScale;

    const upperY = height * (0.28 + Math.sin(t * 0.24 + this.seed) * 0.13);
    const lowerY = height * (0.70 + Math.cos(t * 0.21 + this.seed * 1.7) * 0.12);
    const middleY = height * (0.49 + Math.sin(t * 0.31 + this.seed * 2.3) * 0.15);

    const farX = shoreline - width * 0.095;
    const farRx = Math.max(52, width * scale);
    const farRy = height * 0.42;
    this.drawEllipticalGlow(farX, upperY, farRx, farRy, accentA, 0.38);
    this.drawDarkEllipticalShadow(
      farX + farRx * 0.16,
      upperY,
      farRx * 0.58,
      farRy * 0.66,
      0.74
    );

    const lowerX = shoreline - width * 0.072;
    const lowerRx = Math.max(44, width * scale * 0.82);
    const lowerRy = height * 0.36;
    this.drawEllipticalGlow(lowerX, lowerY, lowerRx, lowerRy, accentB, 0.31);
    this.drawDarkEllipticalShadow(
      lowerX + lowerRx * 0.14,
      lowerY,
      lowerRx * 0.54,
      lowerRy * 0.62,
      0.64
    );

    this.drawEllipticalGlow(
      shoreline - width * 0.034,
      middleY,
      Math.max(30, width * scale * 0.48),
      height * 0.27,
      glow,
      0.20
    );
  }

  drawPathBand({ baseX, time, phase, amplitudeScale, color, alpha, blur, width, composite = 'screen' }) {
    const ctx = this.context;
    const path = this.createEdgePath(baseX, time, phase, amplitudeScale);
    ctx.save();
    ctx.globalCompositeOperation = composite;
    ctx.globalAlpha = alpha;
    ctx.filter = `blur(${blur}px)`;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke(path);
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
    ctx.fillStyle = '#202126';
    ctx.fillRect(0, 0, width, height);

    const mainFill = this.createFillPath(shoreline, time, 0, 1);
    const bodyGradient = ctx.createLinearGradient(0, 0, Math.max(shoreline, 1), 0);
    bodyGradient.addColorStop(0, dark);
    bodyGradient.addColorStop(0.74, dark);
    bodyGradient.addColorStop(0.89, hexToRgba(dark, 0.99));
    bodyGradient.addColorStop(0.955, hexToRgba(accentA, 0.09));
    bodyGradient.addColorStop(0.992, hexToRgba(accentB, 0.54));
    bodyGradient.addColorStop(1, hexToRgba(glow, 0.78));
    ctx.fillStyle = bodyGradient;
    ctx.fill(mainFill);

    this.drawColorClouds(shoreline, time, accentA, accentB, glow);

    this.drawPathBand({
      baseX: shoreline - width * 0.105,
      time,
      phase: 1.42,
      amplitudeScale: 1.18,
      color: accentA,
      alpha: 0.22,
      blur: 21,
      width: 54
    });
    this.drawPathBand({
      baseX: shoreline - width * 0.073,
      time,
      phase: -0.92,
      amplitudeScale: 1.06,
      color: accentB,
      alpha: 0.30,
      blur: 15,
      width: 42
    });
    this.drawPathBand({
      baseX: shoreline - width * 0.047,
      time,
      phase: 0.42,
      amplitudeScale: 0.94,
      color: 'rgba(5, 5, 10, 0.92)',
      alpha: 0.72,
      blur: 12,
      width: 34,
      composite: 'source-over'
    });
    this.drawPathBand({
      baseX: shoreline - width * 0.025,
      time,
      phase: -0.28,
      amplitudeScale: 0.96,
      color: accentB,
      alpha: 0.66,
      blur: 8,
      width: 28
    });

    const edgePath = this.createEdgePath(shoreline, time, 0, 1);

    ctx.save();
    ctx.clip(mainFill);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = hexToRgba(accentA, 0.20);
    ctx.lineWidth = this.profile.haloWidth;
    ctx.shadowColor = accentA;
    ctx.shadowBlur = this.profile.haloWidth * 0.72;
    ctx.stroke(edgePath);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = hexToRgba(accentB, 0.78);
    ctx.lineWidth = this.profile.glowWidth + 4.2;
    ctx.shadowColor = accentB;
    ctx.shadowBlur = 8;
    ctx.stroke(edgePath);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = hexToRgba(glow, 0.88);
    ctx.lineWidth = this.profile.glowWidth;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 5;
    ctx.stroke(edgePath);
    ctx.restore();

    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = hexToRgba(glow, 0.84);
    ctx.lineWidth = 2.15;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 2.5;
    ctx.stroke(edgePath);
    ctx.restore();

    if (this.profile.whiteAlpha > 0.05) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `rgba(255,255,245,${this.profile.whiteAlpha})`;
      ctx.lineWidth = this.profile.whiteWidth;
      ctx.stroke(edgePath);
      ctx.restore();
    }
  }

  updateFromPointer(event) {
    const bounds = this.stage.getBoundingClientRect();
    const ratio = bounds.width > 0 ? (event.clientX - bounds.left) / bounds.width : 0;
    this.setProgress(ratio * 100);
    this.targetValue = this.value;
    this.drawReferenceFlow();
  }

  beginDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    this.dragging = true;
    this.resumeAt = Number.POSITIVE_INFINITY;
    this.stage.classList.add('is-dragging');
    try { this.stage.setPointerCapture?.(event.pointerId); } catch {}
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
    this.nextTargetAt = this.resumeAt;
    this.stage.classList.remove('is-dragging');
    try {
      if (event?.pointerId !== undefined && this.stage.hasPointerCapture?.(event.pointerId)) {
        this.stage.releasePointerCapture(event.pointerId);
      }
    } catch {}
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
      this.targetValue = this.value;
      this.resumeAt = performance.now() + 1800;
      this.nextTargetAt = this.resumeAt;
      this.drawReferenceFlow();
    });
  }

  chooseNextTarget(now) {
    const [minValue, maxValue] = this.profile.autoRange;
    this.targetValue = minValue + this.random() * (maxValue - minValue);
    this.nextTargetAt = now + 650 + this.random() * 650;
  }

  update(delta, paused, now) {
    if (!paused) this.flowTime += delta;

    if (!paused && !this.dragging && now >= this.resumeAt) {
      if (!this.nextTargetAt || now >= this.nextTargetAt) this.chooseNextTarget(now);
      const easing = 1 - Math.exp(-delta * 3.25);
      this.setProgress(lerp(this.value, this.targetValue, easing));
    }

    this.drawReferenceFlow();
  }

  randomize() {
    this.resumeAt = performance.now() + 500;
    this.nextTargetAt = this.resumeAt;
    this.flowTime = this.random() * 40;
    const [minValue, maxValue] = this.profile.autoRange;
    this.setProgress(minValue + this.random() * (maxValue - minValue));
    this.targetValue = this.value;
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
