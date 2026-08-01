import { hexToRgb01 } from './presets.js';

function rgb(color, alpha = 1) {
  const [r, g, b] = hexToRgb01(color).map((value) => Math.round(value * 255));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ellipseGlow(ctx, width, height, xRatio, yRatio, xRadiusRatio, yRadiusRatio, color, alpha) {
  const x = xRatio * width;
  const y = yRatio * height;
  const radius = Math.max(width, height) * xRadiusRatio;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, yRadiusRatio / xRadiusRatio);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  glow.addColorStop(0, rgb(color, alpha));
  glow.addColorStop(0.45, rgb(color, alpha * 0.45));
  glow.addColorStop(1, rgb(color, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  ctx.restore();
}

export class FallbackRenderer {
  constructor(canvas, preset) {
    this.canvas = canvas;
    this.preset = preset;
    this.context = canvas.getContext('2d');
    this.visible = true;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(2, Math.round(rect.width * dpr));
    const height = Math.max(2, Math.round(rect.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  drawPolar(time) {
    const ctx = this.context;
    const { width, height } = this.canvas;
    const phase = time * 0.72 + this.preset.seed * 0.063;
    ctx.fillStyle = this.preset.colors[0];
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'screen';

    ellipseGlow(ctx, width, height, 0.88 + Math.sin(phase * 0.42) * 0.035, 0.70, 0.48, 0.24, this.preset.colors[1], 0.84);
    ellipseGlow(ctx, width, height, 0.80 + Math.cos(phase * 0.36) * 0.045, 0.38 + Math.sin(phase * 0.58) * 0.07, 0.56, 0.26, this.preset.colors[2], 0.84);
    ellipseGlow(ctx, width, height, 0.97 + Math.sin(phase * 0.31) * 0.014, 0.61 + Math.cos(phase * 0.47) * 0.08, 0.22, 0.16, this.preset.colors[3], 0.96);

    ctx.globalCompositeOperation = 'source-over';
  }

  drawDubdot(time) {
    const ctx = this.context;
    const { width, height } = this.canvas;
    const phase = time * 0.54 + this.preset.seed * 0.051;
    ctx.fillStyle = this.preset.colors[0];
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'screen';

    ellipseGlow(ctx, width, height, 0.86 + Math.sin(phase * 0.35) * 0.025, 0.67 + Math.cos(phase * 0.50) * 0.05, 0.54, 0.30, this.preset.colors[2], 0.50);
    ellipseGlow(ctx, width, height, 0.91 + Math.cos(phase * 0.31) * 0.020, 0.35 + Math.sin(phase * 0.43) * 0.05, 0.52, 0.29, this.preset.colors[3], 0.58);
    ellipseGlow(ctx, width, height, 0.73, 0.50, 0.40, 0.42, this.preset.colors[1], 0.26);

    ctx.globalCompositeOperation = 'source-over';
  }

  drawVercel(time) {
    const ctx = this.context;
    const { width, height } = this.canvas;
    const phase = time * 0.38 + this.preset.seed * 0.044;
    ctx.fillStyle = this.preset.colors[0];
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'screen';

    ellipseGlow(ctx, width, height, 0.88 + Math.sin(phase * 0.35) * 0.025, 0.79, 0.50, 0.34, this.preset.colors[1], 0.38);
    ellipseGlow(ctx, width, height, 0.90 + Math.cos(phase * 0.28) * 0.025, 0.52 + Math.sin(phase * 0.26) * 0.035, 0.52, 0.34, this.preset.colors[2], 0.40);
    ellipseGlow(ctx, width, height, 0.86 + Math.sin(phase * 0.23 + 1.3) * 0.035, 0.22, 0.50, 0.34, this.preset.colors[3], 0.36);

    ctx.globalCompositeOperation = 'source-over';
  }

  drawAurora(time) {
    if (this.preset.motionProfile === 'polar') this.drawPolar(time);
    else if (this.preset.motionProfile === 'dubdot') this.drawDubdot(time);
    else this.drawVercel(time);
  }

  drawNebula(time) {
    const ctx = this.context;
    const { width, height } = this.canvas;
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, this.preset.colors[0]);
    gradient.addColorStop(0.38, this.preset.colors[1]);
    gradient.addColorStop(0.72, this.preset.colors[2]);
    gradient.addColorStop(1, this.preset.colors[3]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'screen';
    for (let index = 0; index < 6; index += 1) {
      const x = (0.5 + 0.45 * Math.sin(time * 0.32 + index * 1.7)) * width;
      const y = (0.5 + 0.4 * Math.cos(time * 0.25 + index)) * height;
      const radius = Math.max(width, height) * (0.08 + (index % 3) * 0.04);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, rgb(this.preset.colors[(index + 1) % 4], 0.24));
      glow.addColorStop(1, rgb(this.preset.colors[index % 4], 0));
      ctx.fillStyle = glow;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  draw(time) {
    if (!this.visible) return;
    this.resize();
    if (this.preset.mode === 'aurora') this.drawAurora(time);
    else this.drawNebula(time);
  }

  setPreset(preset) { this.preset = preset; }
  randomize() {}
  dispose() {}
}
