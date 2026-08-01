import { hexToRgb01 } from './presets.js';

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

vec3 renderAurora(vec2 uv, vec2 p, vec2 pointer, float distanceToPointer, float t) {
  float rightField = smoothstep(0.05, 0.94, uv.x);
  float phase = t * 0.62 + u_seed * 0.071;
  float distortion = fbm(vec2(uv.x * 1.15 + phase * 0.10, uv.y * 1.8 - phase * 0.08) + u_seed) - 0.5;

  float centerA = 0.70 - uv.x * 0.28 + sin(phase + uv.x * 2.6) * 0.105 + distortion * 0.15;
  float centerB = 0.26 + uv.x * 0.31 + cos(phase * 0.83 + uv.x * 2.15) * 0.09 - distortion * 0.12;
  float centerC = 0.52 + sin(phase * 0.56 + uv.x * 4.1) * 0.16;

  float ribbonA = exp(-pow(uv.y - centerA, 2.0) / 0.042);
  float ribbonB = exp(-pow(uv.y - centerB, 2.0) / 0.050);
  float ribbonC = exp(-pow(uv.y - centerC, 2.0) / 0.115) * 0.48;

  float pointerBend = exp(-distanceToPointer * 6.0) * u_motion;
  ribbonA += pointerBend * 0.28;
  ribbonB += pointerBend * 0.18;

  vec3 color = u_colorA;
  color = mix(color, u_colorB, clamp(ribbonB * rightField * 0.92, 0.0, 1.0));
  color = mix(color, u_colorC, clamp(ribbonC * rightField * 0.88, 0.0, 1.0));
  color = mix(color, u_colorD, clamp(ribbonA * rightField * 0.86, 0.0, 1.0));

  float mist = smoothstep(0.12, 0.92, fbm(vec2(uv.x * 0.82 - phase * 0.08, uv.y * 1.35 + phase * 0.05) + 4.0));
  color = mix(color, mix(u_colorB, u_colorC, 0.5), mist * rightField * 0.12);

  float highlight = exp(-pow(uv.y - (centerA - 0.11), 2.0) / 0.018) * rightField;
  color += mix(u_colorB, vec3(1.0), 0.55) * highlight * 0.12;
  color += u_colorD * pointerBend * 0.16;
  return color;
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
    ? renderAurora(uv, p, pointer, distanceToPointer, t)
    : renderNebula(uv, p, pointer, distanceToPointer, t);

  float vignette = smoothstep(0.94, 0.18, length((uv - 0.5) * vec2(1.0, 1.35)));
  color *= u_mode > 0.5 ? (0.93 + vignette * 0.08) : (0.70 + vignette * 0.42);
  color = pow(max(color, vec3(0.0)), vec3(u_mode > 0.5 ? 0.96 : 0.88));

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
