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
    const phase = time * 1.08 + this.preset.seed * 0.063;
    ctx.fillStyle = this.preset.colors[0];
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'screen';

    ellipseGlow(ctx, width, height, 0.84 + Math.sin(phase * 0.62) * 0.075, 0.72 + Math.cos(phase * 0.51) * 0.055, 0.62, 0.31, this.preset.colors[1], 0.98);
    ellipseGlow(ctx, width, height, 0.74 + Math.cos(phase * 0.55) * 0.085, 0.38 + Math.sin(phase * 0.82) * 0.13, 0.68, 0.34, this.preset.colors[2], 0.98);
    ellipseGlow(ctx, width, height, 0.95 + Math.sin(phase * 0.58) * 0.045, 0.60 + Math.cos(phase * 0.79) * 0.14, 0.30, 0.23, this.preset.colors[3], 1.0);
    ellipseGlow(ctx, width, height, 0.88 + Math.cos(phase * 0.43) * 0.055, 0.26 + Math.sin(phase * 0.71) * 0.08, 0.25, 0.16, this.preset.colors[3], 0.72);

    ctx.globalCompositeOperation = 'source-over';
  }

  drawDubdot(time) {
    const ctx = this.context;
    const { width, height } = this.canvas;
    const phase = time * 0.86 + this.preset.seed * 0.051;
    ctx.fillStyle = this.preset.colors[0];
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'screen';

    ellipseGlow(ctx, width, height, 0.82 + Math.sin(phase * 0.62) * 0.070, 0.70 + Math.cos(phase * 0.78) * 0.095, 0.66, 0.36, this.preset.colors[2], 0.72);
    ellipseGlow(ctx, width, height, 0.88 + Math.cos(phase * 0.54) * 0.060, 0.31 + Math.sin(phase * 0.69) * 0.105, 0.64, 0.35, this.preset.colors[3], 0.82);
    ellipseGlow(ctx, width, height, 0.69 + Math.sin(phase * 0.47) * 0.055, 0.50 + Math.cos(phase * 0.51) * 0.050, 0.50, 0.46, this.preset.colors[1], 0.42);
    ellipseGlow(ctx, width, height, 0.91 + Math.sin(phase * 0.82) * 0.035, 0.50 + Math.cos(phase * 0.86) * 0.075, 0.31, 0.18, this.preset.colors[3], 0.42);

    ctx.globalCompositeOperation = 'source-over';
  }

  drawVercel(time) {
    const ctx = this.context;
    const { width, height } = this.canvas;
    const phase = time * 1.62 + this.preset.seed * 0.044;

    ctx.fillStyle = this.preset.colors[0];
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'screen';

    ellipseGlow(
      ctx, width, height,
      0.84 + Math.sin(phase * 0.68) * 0.12,
      0.73 + Math.cos(phase * 0.82) * 0.15,
      0.66, 0.34,
      this.preset.colors[1], 0.78
    );
    ellipseGlow(
      ctx, width, height,
      0.91 + Math.cos(phase * 0.61 + 1.2) * 0.11,
      0.50 + Math.sin(phase * 0.77) * 0.17,
      0.68, 0.36,
      this.preset.colors[2], 0.82
    );
    ellipseGlow(
      ctx, width, height,
      0.82 + Math.sin(phase * 0.73 + 2.1) * 0.13,
      0.27 + Math.cos(phase * 0.66) * 0.15,
      0.66, 0.34,
      this.preset.colors[3], 0.78
    );

    ellipseGlow(
      ctx, width, height,
      0.94 + Math.sin(phase * 0.92) * 0.055,
      0.68 + Math.cos(phase * 1.04) * 0.09,
      0.30, 0.16,
      this.preset.colors[1], 0.42
    );
    ellipseGlow(
      ctx, width, height,
      0.89 + Math.cos(phase * 0.86) * 0.060,
      0.49 + Math.sin(phase * 0.98) * 0.10,
      0.31, 0.17,
      this.preset.colors[2], 0.46
    );
    ellipseGlow(
      ctx, width, height,
      0.93 + Math.sin(phase * 0.81 + 1.6) * 0.058,
      0.30 + Math.cos(phase * 0.91) * 0.09,
      0.30, 0.16,
      this.preset.colors[3], 0.43
    );

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
