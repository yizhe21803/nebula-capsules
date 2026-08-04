function hexToRgb01(hex) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255
  ];
}

function stringSeed(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

const PROFILE_INDEX = {
  'model-training': 0,
  'agent-migration': 1,
  'visual-training': 2
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
uniform float u_progress;
uniform float u_seed;
uniform float u_profile;
uniform vec3 u_dark;
uniform vec3 u_accentA;
uniform vec3 u_accentB;
uniform vec3 u_glow;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32 + u_seed * 11.7);
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
  float amplitude = 0.55;
  mat2 rotation = mat2(0.82, 0.57, -0.57, 0.82);
  for (int i = 0; i < 6; i++) {
    value += noise(p) * amplitude;
    p = rotation * p * 2.02 + 13.7;
    amplitude *= 0.48;
  }
  return value;
}

float gaussian(float value, float center, float width) {
  float delta = (value - center) / max(width, 0.0001);
  return exp(-delta * delta);
}

float edgeEnvelope(float y) {
  return pow(max(sin(3.14159265 * clamp(y, 0.0, 1.0)), 0.0), 0.46);
}

float profileMix(float model, float agent, float visual) {
  if (u_profile < 0.5) return model;
  if (u_profile < 1.5) return agent;
  return visual;
}

float edgeDisplacement(float y, float t) {
  float envelope = edgeEnvelope(y);
  float speed = profileMix(1.00, 0.80, 0.90);
  float time = t * speed;

  float broadScale = profileMix(1.65, 1.10, 1.42);
  float middleScale = profileMix(4.15, 2.35, 3.45);
  float detailScale = profileMix(7.60, 4.40, 6.10);

  float broadAmp = profileMix(0.0165, 0.0215, 0.0200);
  float middleAmp = profileMix(0.0110, 0.0042, 0.0060);
  float detailAmp = profileMix(0.0045, 0.0010, 0.0015);

  float broad = (fbm(vec2(y * broadScale + u_seed * 0.7, time * 0.095)) * 2.0 - 1.0) * broadAmp;
  float middle = (fbm(vec2(y * middleScale + 7.3 + u_seed, -time * 0.17)) * 2.0 - 1.0) * middleAmp;
  float detail = (fbm(vec2(y * detailScale + 17.1, time * 0.29 + u_seed)) * 2.0 - 1.0) * detailAmp;

  float lobeCenterA = 0.27 + sin(time * 0.29 + u_seed * 3.0) * 0.14;
  float lobeCenterB = 0.70 + cos(time * 0.25 + u_seed * 4.7) * 0.14;
  float lobeWidth = profileMix(0.065, 0.125, 0.085);
  float lobeAmp = profileMix(0.0165, 0.0180, 0.0170);
  float lobes = gaussian(y, lobeCenterA, lobeWidth) * sin(time * 1.09 + u_seed * 6.0) * lobeAmp;
  lobes -= gaussian(y, lobeCenterB, lobeWidth * 1.08) * cos(time * 0.96 + u_seed * 5.0) * lobeAmp;

  float activity = profileMix(
    0.30 + 0.70 * (0.5 + 0.5 * sin(time * 0.43 + u_seed * 1.2)),
    0.58 + 0.42 * (0.5 + 0.5 * sin(time * 0.24 + u_seed * 1.7)),
    0.44 + 0.56 * (0.5 + 0.5 * cos(time * 0.31 + u_seed * 1.4))
  );
  float harmonic = profileMix(
    sin(y * 18.8495559 + time * 0.78 + u_seed * 2.1) * 0.0115,
    sin(y * 5.6548668 - time * 0.43 + u_seed * 1.8) * 0.0080,
    sin(y * 9.7389372 + time * 0.55 + u_seed * 2.4) * 0.0125
  ) * activity;

  return (broad + middle + detail + lobes + harmonic) * envelope;
}

float ellipseRing(vec2 p, float radius, float width) {
  return gaussian(length(p), radius, width);
}

void main() {
  vec2 uv = v_uv;
  float t = u_time;
  float edge = u_progress + edgeDisplacement(uv.y, t);
  float d = uv.x - edge;

  vec3 rightBase = vec3(0.122, 0.125, 0.145);
  vec3 color = rightBase;

  float leftMask = 1.0 - smoothstep(-0.001, 0.002, d);
  color = mix(color, u_dark, leftMask * 0.96);

  vec2 flowP = vec2((d + 0.13) * 5.2, uv.y * 1.85);
  float flowA = fbm(flowP + vec2(-t * 0.080, t * 0.10) + u_seed * 1.7);
  float flowB = fbm(flowP * 1.52 + vec2(t * 0.105, -t * 0.15) + 8.2 + u_seed);
  float flowC = fbm(flowP * 2.25 + vec2(-t * 0.18, t * 0.20) + 19.0);

  float farCenter = profileMix(-0.165, -0.145, -0.155) + (flowA - 0.5) * 0.040;
  float midCenter = profileMix(-0.098, -0.087, -0.092) + (flowB - 0.5) * 0.027;
  float hotCenter = profileMix(-0.032, -0.030, -0.031) + (flowC - 0.5) * 0.014;

  float farBand = gaussian(d, farCenter, profileMix(0.090, 0.098, 0.092));
  float midBand = gaussian(d, midCenter, profileMix(0.054, 0.062, 0.057));
  float hotBand = gaussian(d, hotCenter, profileMix(0.027, 0.031, 0.029));
  float darkTrough = gaussian(d, -0.060 + (flowB - 0.5) * 0.014, profileMix(0.027, 0.031, 0.029));

  float ringY = 0.47 + sin(t * 0.22 + u_seed * 2.4) * 0.11;
  vec2 ringP = vec2((d + 0.135) / 0.125, (uv.y - ringY) / 0.31);
  ringP += vec2((flowB - 0.5) * 0.16, (flowA - 0.5) * 0.11);
  float ring = ellipseRing(ringP, 0.72, 0.22);
  float ringCore = gaussian(length(ringP), 0.28, 0.27);
  float ringPulse = 0.48 + 0.52 * sin(t * 0.46 + u_seed * 4.1) * 0.5 + 0.26;
  float modelRing = ring * ringPulse * (1.0 - step(0.5, u_profile));
  float visualRing = ring * 0.34 * step(1.5, u_profile);

  float cloudGate = leftMask * smoothstep(-0.30, -0.008, d);
  float textureA = smoothstep(0.24, 0.92, flowA * 0.72 + flowB * 0.42);
  float textureB = smoothstep(0.28, 0.94, flowB * 0.68 + flowC * 0.38);

  color += u_accentA * farBand * cloudGate * (0.17 + textureA * profileMix(0.72, 0.48, 0.60));
  color += u_accentB * midBand * cloudGate * (0.24 + textureB * profileMix(0.74, 0.66, 0.69));
  color += u_glow * hotBand * cloudGate * profileMix(0.58, 0.42, 0.49);
  color += u_accentA * (modelRing + visualRing) * cloudGate * profileMix(0.88, 0.0, 0.55);
  color *= 1.0 - (darkTrough * profileMix(0.74, 0.58, 0.66) + ringCore * modelRing * 0.70) * cloudGate;

  float broadHalo = exp(-abs(d) * 58.0);
  float innerHalo = exp(-abs(d) * 110.0);
  float colorCore = exp(-abs(d) * 225.0);
  float sharpCore = exp(-abs(d) * 470.0);
  float leftGate = 1.0 - smoothstep(-0.003, 0.009, d);

  color += u_accentA * broadHalo * leftGate * profileMix(0.28, 0.18, 0.22);
  color += u_accentB * innerHalo * leftGate * profileMix(0.92, 0.88, 0.82);
  color += u_glow * colorCore * profileMix(1.02, 0.86, 0.92);

  float whiteStrength = profileMix(0.72, 0.11, 0.25);
  color += vec3(1.0, 0.99, 0.91) * sharpCore * whiteStrength;

  float rightCut = smoothstep(0.006, 0.020, d);
  color = mix(color, rightBase, rightCut);

  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
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
    const message = gl.getProgramInfoLog(program) || 'Unknown shader link error';
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

export class ProgressFlowRenderer {
  constructor(canvas, preset) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance'
    });
    if (!gl) throw new Error('WebGL2 unavailable');

    this.canvas = canvas;
    this.gl = gl;
    this.program = createProgram(gl);
    this.profile = PROFILE_INDEX[preset.id] ?? 2;
    this.seed = stringSeed(`${preset.id}-shader`) * 13.7 + 1.0;
    this.colors = preset.colors.map(hexToRgb01);

    this.position = gl.getAttribLocation(this.program, 'a_position');
    this.uniforms = {
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      time: gl.getUniformLocation(this.program, 'u_time'),
      progress: gl.getUniformLocation(this.program, 'u_progress'),
      seed: gl.getUniformLocation(this.program, 'u_seed'),
      profile: gl.getUniformLocation(this.program, 'u_profile'),
      dark: gl.getUniformLocation(this.program, 'u_dark'),
      accentA: gl.getUniformLocation(this.program, 'u_accentA'),
      accentB: gl.getUniformLocation(this.program, 'u_accentB'),
      glow: gl.getUniformLocation(this.program, 'u_glow')
    };

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
  }

  resize(width, height, dpr) {
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));
    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }
    this.gl.viewport(0, 0, pixelWidth, pixelHeight);
  }

  draw(time, progress) {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.position);
    gl.vertexAttribPointer(this.position, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uniforms.time, time);
    gl.uniform1f(this.uniforms.progress, progress / 100);
    gl.uniform1f(this.uniforms.seed, this.seed);
    gl.uniform1f(this.uniforms.profile, this.profile);
    gl.uniform3fv(this.uniforms.dark, this.colors[0]);
    gl.uniform3fv(this.uniforms.accentA, this.colors[1]);
    gl.uniform3fv(this.uniforms.accentB, this.colors[2]);
    gl.uniform3fv(this.uniforms.glow, this.colors[3]);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose() {
    const gl = this.gl;
    gl.deleteBuffer(this.buffer);
    gl.deleteProgram(this.program);
  }
}

export function createProgressFlowRenderer(canvas, preset) {
  try {
    return new ProgressFlowRenderer(canvas, preset);
  } catch (error) {
    console.warn('[画境观屿] 进度流体 WebGL2 不可用，使用 Canvas 2D 降级。', error);
    return null;
  }
}
