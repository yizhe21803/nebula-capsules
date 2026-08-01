import { hexToRgb01 } from './presets.js';

function rgb(color, alpha = 1) {
  const [r, g, b] = hexToRgb01(color).map((value) => Math.round(value * 255));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
    this.canvas.width = Math.max(2, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(2, Math.round(rect.height * dpr));
  }

  drawAurora(time) {
    const ctx = this.context;
    const { width, height } = this.canvas;
    ctx.fillStyle = this.preset.colors[0];
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'screen';
    const positions = [
      [0.78 + Math.sin(time * 0.42) * 0.08, 0.28 + Math.cos(time * 0.31) * 0.12, 0.72, 1],
      [0.68 + Math.cos(time * 0.34) * 0.10, 0.70 + Math.sin(time * 0.27) * 0.13, 0.62, 2],
      [0.92 + Math.sin(time * 0.25) * 0.05, 0.52, 0.48, 3]
    ];

    for (const [xRatio, yRatio, radiusRatio, colorIndex] of positions) {
      const x = xRatio * width;
      const y = yRatio * height;
      const radius = Math.max(width, height) * radiusRatio;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, rgb(this.preset.colors[colorIndex], 0.78));
      glow.addColorStop(0.45, rgb(this.preset.colors[colorIndex], 0.34));
      glow.addColorStop(1, rgb(this.preset.colors[colorIndex], 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.globalCompositeOperation = 'source-over';
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
