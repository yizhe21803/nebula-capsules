import { hexToRgb01 } from './presets.js';

const AURORA_PROFILE = {
  polar: 1,
  dubdot: 2,
  vercel: 3
};

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_seed;
uniform float u_motion;
uniform float u_mode;
uniform float u_profile;
uniform vec2 u_pointer;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform vec3 u_colorC;
uniform vec3 u_colorD;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32 + u_seed);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.52;
  mat2 rotation = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 6; i++) {
    value += amplitude * noise(p);
    p = rotation * p * 2.03 + 17.7;
    amplitude *= 0.5;
  }
  return value;
}

float gaussian(float value, float center, float width) {
  return exp(-pow(value - center, 2.0) / max(width, 0.0001));
}

vec3 palette(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 shadow = mix(u_colorA, u_colorB, smoothstep(0.06, 0.62, t));
  vec3 body = mix(u_colorB, u_colorC, smoothstep(0.30, 0.82, t));
  vec3 highlight = mix(u_colorC, u_colorD, smoothstep(0.74, 1.0, t));
  vec3 restrained = mix(shadow, body, smoothstep(0.26, 0.72, t));
  return mix(restrained, highlight, smoothstep(0.78, 0.97, t));
}

vec3 renderNebula(vec2 uv, vec2 p, vec2 pointer, float distanceToPointer, float t) {
  vec2 delta = p - pointer;
  float influence = exp(-distanceToPointer * 4.6) * u_motion;
  float angle = influence * 1.7;
  mat2 swirl = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  p = pointer + swirl * delta;
  p += normalize(delta + 0.0001) * influence * 0.08;

  vec2 drift = vec2(t * 0.22, -t * 0.13);
  vec2 q = vec2(
    fbm(p * 1.35 + drift + u_seed),
    fbm(p * 1.35 + vec2(5.2, 1.3) - drift * 0.85)
  );
  vec2 r = vec2(
    fbm(p * 2.0 + 3.6 * q + vec2(1.7, 9.2) + t * 0.10),
    fbm(p * 2.0 + 3.0 * q + vec2(8.3, 2.8) - t * 0.085)
  );

  float cloud = fbm(p * 1.7 + 4.2 * r);
  float veins = fbm(p * 4.0 - 2.0 * q + t * 0.065);
  float nebula = smoothstep(0.18, 0.91, cloud * 0.9 + veins * 0.22);

  vec3 color = palette(nebula);
  color += u_colorD * pow(max(cloud - 0.63, 0.0), 2.0) * 1.05;
  color *= 0.78 + 0.34 * smoothstep(0.15, 0.9, veins);

  vec2 starGrid = floor((uv + vec2(u_seed * 0.013, 0.0)) * vec2(132.0, 58.0));
  vec2 starCell = fract(uv * vec2(132.0, 58.0)) - 0.5;
  float starRandom = hash21(starGrid);
  float starShape = smoothstep(0.075, 0.0, length(starCell));
  float starMask = step(0.989, starRandom) * starShape;
  float twinkle = 0.35 + 0.65 * sin(t * (1.0 + starRandom * 2.4) + starRandom * 40.0) * 0.5 + 0.5;
  color += starMask * twinkle * mix(u_colorC, u_colorD, starRandom) * 1.05;

  float pointerGlow = exp(-distanceToPointer * 7.0) * u_motion;
  color += u_colorD * pointerGlow * 0.28;
  return color;
}

vec3 renderPolar(vec2 uv, float distanceToPointer, float t) {
  float phase = t * 1.08 + u_seed * 0.063;
  float rightField = smoothstep(0.06, 0.96, uv.x);
  float grain = fbm(vec2(uv.x * 1.85 - phase * 0.14, uv.y * 2.45 + phase * 0.10) + u_seed) - 0.5;

  float orangeCenter = 0.76 - uv.x * 0.20 + sin(phase + uv.x * 3.7) * 0.14 + grain * 0.16;
  float magentaCenter = 0.37 + uv.x * 0.13 + sin(phase * 0.84 + uv.x * 4.7 + 1.1) * 0.16 - grain * 0.14;
  float lowerCenter = 0.13 + sin(phase * 0.72 + uv.x * 3.8) * 0.10;
  float sweepCenter = 0.54 + sin(phase * 1.22 + uv.x * 5.4) * 0.08;

  float orangeBand = gaussian(uv.y, orangeCenter, 0.074);
  float magentaBand = gaussian(uv.y, magentaCenter, 0.115);
  float lowerBand = gaussian(uv.y, lowerCenter, 0.070);
  float sweepBand = gaussian(uv.y, sweepCenter, 0.027) * smoothstep(0.28, 0.98, uv.x);

  vec2 corePosition = vec2(
    0.945 + sin(phase * 0.68) * 0.052,
    0.60 + cos(phase * 0.83) * 0.145
  );
  float whiteCore = exp(-length((uv - corePosition) * vec2(2.05, 0.94)) * 6.1);
  float secondaryCore = exp(-length((uv - vec2(0.90 + cos(phase * 0.47) * 0.055, 0.27 + sin(phase * 0.64) * 0.08)) * vec2(2.4, 1.15)) * 7.0);
  float pulse = 0.72 + sin(phase * 1.62) * 0.28;
  float pointerBend = exp(-distanceToPointer * 6.4) * u_motion;

  vec3 color = u_colorA;
  color = mix(color, u_colorB, clamp(orangeBand * rightField * 1.16, 0.0, 1.0));
  color = mix(color, u_colorC, clamp((magentaBand * 1.18 + lowerBand * 0.82) * rightField, 0.0, 1.0));
  color += u_colorD * whiteCore * pulse * 1.30;
  color += mix(u_colorD, u_colorC, 0.30) * secondaryCore * 0.58;
  color += mix(u_colorD, u_colorC, 0.55) * sweepBand * 0.42;
  color += u_colorC * pointerBend * rightField * 0.24;
  color += mix(u_colorB, u_colorC, 0.55) * smoothstep(0.35, 0.94, grain + 0.5) * rightField * 0.18;
  return color;
}

vec3 renderDubdot(vec2 uv, float distanceToPointer, float t) {
  float phase = t * 0.86 + u_seed * 0.051;
  float rightField = smoothstep(0.16, 0.97, uv.x);
  float drift = fbm(vec2(uv.x * 1.25 - phase * 0.105, uv.y * 1.95 + phase * 0.075) + u_seed) - 0.5;

  float upperCenter = 0.72 - uv.x * 0.18 + sin(phase + uv.x * 3.4) * 0.115 + drift * 0.15;
  float lowerCenter = 0.28 + uv.x * 0.11 + cos(phase * 0.88 + uv.x * 3.2) * 0.125 - drift * 0.12;
  float middleCenter = 0.50 + sin(phase * 1.18 + uv.x * 4.8) * 0.075;
  float upperBand = gaussian(uv.y, upperCenter, 0.115);
  float lowerBand = gaussian(uv.y, lowerCenter, 0.125);
  float middleBand = gaussian(uv.y, middleCenter, 0.052) * smoothstep(0.34, 0.98, uv.x);
  float softBody = exp(-length((uv - vec2(0.87 + sin(phase * 0.52) * 0.065, 0.51 + cos(phase * 0.44) * 0.045)) * vec2(1.42, 0.72)) * 2.85);
  float pointerBend = exp(-distanceToPointer * 6.8) * u_motion;

  vec3 color = u_colorA;
  color = mix(color, u_colorB, clamp(softBody * rightField * 0.74, 0.0, 1.0));
  color = mix(color, u_colorC, clamp((upperBand * 0.76 + middleBand * 0.28) * rightField, 0.0, 1.0));
  color = mix(color, u_colorD, clamp((lowerBand * 0.82 + softBody * 0.46 + middleBand * 0.34) * rightField, 0.0, 1.0));
  color += mix(u_colorC, u_colorD, 0.58) * middleBand * rightField * 0.18;
  color = mix(color, vec3(1.0), smoothstep(0.0, 0.34, 1.0 - rightField) * 0.24);
  color += u_colorD * pointerBend * rightField * 0.15;
  return color;
}

vec3 renderVercel(vec2 uv, float distanceToPointer, float t) {
  float phase = t * 1.18 + u_seed * 0.044;
  float rightField = smoothstep(0.02, 0.96, uv.x);
  float haze = fbm(vec2(uv.x * 1.10 - phase * 0.14, uv.y * 1.55 + phase * 0.10) + u_seed) - 0.5;

  vec2 mintPos = vec2(0.78 + sin(phase * 0.82) * 0.16, 0.78 + cos(phase * 0.67) * 0.14);
  vec2 goldPos = vec2(0.88 + cos(phase * 0.71) * 0.14, 0.50 + sin(phase * 0.59) * 0.16);
  vec2 pinkPos = vec2(0.79 + sin(phase * 0.63 + 1.7) * 0.18, 0.22 + cos(phase * 0.74) * 0.13);

  vec2 mintEchoPos = vec2(0.92 + cos(phase * 0.55) * 0.10, 0.66 + sin(phase * 0.92) * 0.11);
  vec2 goldEchoPos = vec2(0.73 + sin(phase * 0.88 + 1.2) * 0.12, 0.55 + cos(phase * 0.66) * 0.12);
  vec2 pinkEchoPos = vec2(0.93 + cos(phase * 0.79 + 0.8) * 0.11, 0.34 + sin(phase * 0.58) * 0.10);

  float mintPulse = 0.72 + sin(phase * 1.18) * 0.28;
  float goldPulse = 0.74 + sin(phase * 1.37 + 1.6) * 0.26;
  float pinkPulse = 0.70 + sin(phase * 1.06 + 3.1) * 0.30;

  float mintCloud = exp(-length((uv - mintPos) * vec2(1.30, 0.72)) * 3.05) * mintPulse;
  mintCloud += exp(-length((uv - mintEchoPos) * vec2(1.55, 0.88)) * 4.10) * (1.0 - mintPulse) * 0.92;

  float goldCloud = exp(-length((uv - goldPos) * vec2(1.22, 0.70)) * 2.92) * goldPulse;
  goldCloud += exp(-length((uv - goldEchoPos) * vec2(1.48, 0.84)) * 3.90) * (1.0 - goldPulse) * 0.88;

  float pinkCloud = exp(-length((uv - pinkPos) * vec2(1.18, 0.72)) * 2.84) * pinkPulse;
  pinkCloud += exp(-length((uv - pinkEchoPos) * vec2(1.42, 0.82)) * 3.75) * (1.0 - pinkPulse) * 0.94;

  float mintRibbon = gaussian(uv.y, 0.76 - uv.x * 0.20 + sin(phase * 0.91 + uv.x * 4.4) * 0.13, 0.095);
  float goldRibbon = gaussian(uv.y, 0.52 - uv.x * 0.08 + sin(phase * 1.07 + uv.x * 3.8 + 1.4) * 0.12, 0.105);
  float pinkRibbon = gaussian(uv.y, 0.26 + uv.x * 0.13 + sin(phase * 0.79 + uv.x * 4.9 + 2.8) * 0.12, 0.090);

  float movingGap = gaussian(uv.y, 0.48 + sin(phase * 0.72 + uv.x * 5.2) * 0.16, 0.050) * smoothstep(0.34, 0.98, uv.x);
  float pointerBend = exp(-distanceToPointer * 6.8) * u_motion;

  vec3 color = u_colorA;
  color = mix(color, u_colorB, clamp((mintCloud * 0.96 + mintRibbon * 0.28 + haze * 0.20) * rightField, 0.0, 1.0));
  color = mix(color, u_colorC, clamp((goldCloud * 0.94 + goldRibbon * 0.34) * rightField, 0.0, 1.0));
  color = mix(color, u_colorD, clamp((pinkCloud * 0.90 + pinkRibbon * 0.32) * rightField, 0.0, 1.0));

  color += mix(u_colorB, u_colorC, 0.46) * mintRibbon * rightField * 0.13;
  color += mix(u_colorC, u_colorD, 0.48) * pinkRibbon * rightField * 0.12;
  color = mix(color, vec3(1.0), movingGap * 0.16);
  color += mix(u_colorB, u_colorD, 0.5) * pointerBend * rightField * 0.14;
  return color;
}

vec3 renderAuroraProfile(vec2 uv, float distanceToPointer, float t) {
  if (u_profile < 1.5) return renderPolar(uv, distanceToPointer, t);
  if (u_profile < 2.5) return renderDubdot(uv, distanceToPointer, t);
  return renderVercel(uv, distanceToPointer, t);
}

void main() {
  vec2 uv = v_uv;
  vec2 p = uv - 0.5;
  p.x *= u_resolution.x / max(u_resolution.y, 1.0);

  vec2 pointer = u_pointer - 0.5;
  pointer.x *= u_resolution.x / max(u_resolution.y, 1.0);
  float distanceToPointer = length(p - pointer);
  float t = u_time;

  vec3 color = u_mode > 0.5
    ? renderAuroraProfile(uv, distanceToPointer, t)
    : renderNebula(uv, p, pointer, distanceToPointer, t);

  float vignette = smoothstep(0.94, 0.18, length((uv - 0.5) * vec2(1.0, 1.35)));
  color *= u_mode > 0.5 ? (0.96 + vignette * 0.05) : (0.70 + vignette * 0.42);
  color = pow(max(color, vec3(0.0)), vec3(u_mode > 0.5 ? 0.98 : 0.88));

  outColor = vec4(color, 1.0);
}`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown shader compile error';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || 'Unknown program link error';
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

export class CosmicRenderer {
  constructor(canvas, preset, options = {}) {
    this.canvas = canvas;
    this.preset = { ...preset };
    this.options = { dprCap: 1.75, ...options };
    this.gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });
    if (!this.gl) throw new Error('WebGL2 is not available');

    this.program = createProgram(this.gl);
    this.locations = this.#getLocations();
    this.pointer = [0.72, 0.45];
    this.pointerTarget = [...this.pointer];
    this.motion = 0;
    this.motionTarget = 0;
    this.timeOffset = preset.seed * 0.73;
    this.visible = true;
    this.disposed = false;

    this.#setupGeometry();
    this.#bindEvents();
    this.resize();
  }

  #getLocations() {
    const gl = this.gl;
    const uniform = (name) => gl.getUniformLocation(this.program, name);
    return {
      position: gl.getAttribLocation(this.program, 'a_position'),
      resolution: uniform('u_resolution'),
      time: uniform('u_time'),
      seed: uniform('u_seed'),
      motion: uniform('u_motion'),
      mode: uniform('u_mode'),
      profile: uniform('u_profile'),
      pointer: uniform('u_pointer'),
      colorA: uniform('u_colorA'),
      colorB: uniform('u_colorB'),
      colorC: uniform('u_colorC'),
      colorD: uniform('u_colorD')
    };
  }

  #setupGeometry() {
    const gl = this.gl;
    const vertices = new Float32Array([-1, -1, 3, -1, -1, 3]);
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }

  #bindEvents() {
    this.onPointerMove = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointerTarget[0] = (event.clientX - rect.left) / Math.max(rect.width, 1);
      this.pointerTarget[1] = 1 - (event.clientY - rect.top) / Math.max(rect.height, 1);
      this.motionTarget = 1;
    };
    this.onPointerLeave = () => { this.motionTarget = 0; };
    this.canvas.addEventListener('pointermove', this.onPointerMove, { passive: true });
    this.canvas.addEventListener('pointerdown', this.onPointerMove, { passive: true });
    this.canvas.addEventListener('pointerleave', this.onPointerLeave, { passive: true });
  }

  setPreset(preset) {
    this.preset = { ...preset };
    this.timeOffset = preset.seed * 0.73;
  }

  randomize() {
    this.preset.seed = Math.random() * 100;
    this.timeOffset = Math.random() * 40;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.options.dprCap);
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(2, Math.round(rect.width * dpr));
    const height = Math.max(2, Math.round(rect.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  }

  draw(elapsedSeconds, paused = false) {
    if (this.disposed || !this.visible) return;
    this.resize();
    const gl = this.gl;
    this.pointer[0] += (this.pointerTarget[0] - this.pointer[0]) * 0.08;
    this.pointer[1] += (this.pointerTarget[1] - this.pointer[1]) * 0.08;
    this.motion += (this.motionTarget - this.motion) * 0.07;

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.locations.position);
    gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);

    const colors = this.preset.colors.map(hexToRgb01);
    gl.uniform2f(this.locations.resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.locations.time, this.timeOffset + (paused ? 0 : elapsedSeconds * this.preset.speed));
    gl.uniform1f(this.locations.seed, this.preset.seed);
    gl.uniform1f(this.locations.motion, this.motion);
    gl.uniform1f(this.locations.mode, this.preset.mode === 'aurora' ? 1 : 0);
    gl.uniform1f(this.locations.profile, AURORA_PROFILE[this.preset.motionProfile] || 0);
    gl.uniform2f(this.locations.pointer, this.pointer[0], this.pointer[1]);
    gl.uniform3fv(this.locations.colorA, colors[0]);
    gl.uniform3fv(this.locations.colorB, colors[1]);
    gl.uniform3fv(this.locations.colorC, colors[2]);
    gl.uniform3fv(this.locations.colorD, colors[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    this.disposed = true;
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerdown', this.onPointerMove);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
  }
}
