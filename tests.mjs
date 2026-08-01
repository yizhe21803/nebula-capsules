import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PRESETS, hexToRgb01, validatePreset } from './src/presets.js';

assert.equal(PRESETS.length, 9);
assert.ok(PRESETS.every(validatePreset));
assert.equal(new Set(PRESETS.map((item) => item.id)).size, 9);
assert.equal(new Set(PRESETS.map((item) => item.code)).size, 9);
assert.deepEqual(PRESETS.map((item) => item.name), [
  'ORIGINAL',
  'OCEAN',
  'KLEIN',
  'ULTRAVIOLET',
  'CHROME',
  'PLUS',
  'POLAR',
  'DUBDOT',
  'VERCEL'
]);
assert.deepEqual(PRESETS.slice(-3).map((item) => item.mode), ['aurora', 'aurora', 'aurora']);
assert.deepEqual(PRESETS.slice(-3).map((item) => item.code), ['NC-07', 'NC-08', 'NC-09']);
assert.deepEqual(hexToRgb01('#000000'), [0, 0, 0]);
assert.deepEqual(hexToRgb01('#ffffff'), [1, 1, 1]);

const styles = await readFile(new URL('./styles.css', import.meta.url), 'utf8');
assert.match(styles, /\.capsule-stage\s*\{[\s\S]*?height:\s*clamp\(126px,\s*11vw,\s*148px\);[\s\S]*?border-radius:\s*999px;/);
assert.match(styles, /\.text-action,\s*\n\.primary-action\s*\{[\s\S]*?height:\s*34px;[\s\S]*?border-radius:\s*17px;/);

assert.doesNotMatch(styles, /\.orbit-control/);
const mainSource = await readFile(new URL('./src/main.js', import.meta.url), 'utf8');
assert.doesNotMatch(mainSource, /orbit-control/);
assert.match(mainSource, /SOFT AURORA CAPSULE/);
assert.match(mainSource, /total-count/);

const shaderSource = await readFile(new URL('./src/cosmic-shader.js', import.meta.url), 'utf8');
assert.match(shaderSource, /renderAurora/);
assert.match(shaderSource, /u_mode/);

const readmeZh = await readFile(new URL('./README.md', import.meta.url), 'utf8');
const readmeEn = await readFile(new URL('./README.en.md', import.meta.url), 'utf8');
assert.match(readmeZh, /一键启动（推荐）/);
assert.match(readmeEn, /One-click launchers \(recommended\)/);

console.log('All smoke tests passed.');
