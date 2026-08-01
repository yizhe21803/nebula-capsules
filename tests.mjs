import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PRESETS, hexToRgb01, validatePreset } from './src/presets.js';

const LEGACY_PRESETS = [
  {
    id: 'original',
    code: 'NC-01',
    name: 'ORIGINAL',
    group: 'warm',
    seed: 1.7,
    speed: 0.5,
    colors: ['#FFF3EA', '#F5B27A', '#F67BC6', '#A978E8']
  },
  {
    id: 'ocean',
    code: 'NC-02',
    name: 'OCEAN',
    group: 'cold',
    seed: 8.2,
    speed: 0.48,
    colors: ['#EAF6FF', '#8FD0FF', '#3B87F6', '#6B58E9']
  },
  {
    id: 'klein',
    code: 'NC-03',
    name: 'KLEIN',
    group: 'cold',
    seed: 14.1,
    speed: 0.49,
    colors: ['#EDF2FF', '#2F58D5', '#1B2040', '#E07A43']
  },
  {
    id: 'ultraviolet',
    code: 'NC-04',
    name: 'ULTRAVIOLET',
    group: 'cold',
    seed: 23.4,
    speed: 0.47,
    colors: ['#F2EEFF', '#B99AF1', '#8F74DB', '#D7D85C']
  },
  {
    id: 'chrome',
    code: 'NC-05',
    name: 'CHROME',
    group: 'cold',
    seed: 37.8,
    speed: 0.42,
    colors: ['#F5F6F8', '#B9C0CC', '#7F8793', '#4A4F59']
  },
  {
    id: 'plus',
    code: 'NC-06',
    name: 'PLUS',
    group: 'warm',
    seed: 51.3,
    speed: 0.5,
    colors: ['#FFF0E6', '#F6C26B', '#F98A64', '#E86D74']
  }
];

assert.equal(PRESETS.length, 9);
assert.ok(PRESETS.every(validatePreset));
assert.equal(new Set(PRESETS.map((item) => item.id)).size, 9);
assert.equal(new Set(PRESETS.map((item) => item.code)).size, 9);
assert.deepEqual(PRESETS.slice(0, 6), LEGACY_PRESETS, 'NC-01 through NC-06 must remain byte-for-byte equivalent at the data level');
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
assert.deepEqual(PRESETS.slice(-3).map((item) => item.motionProfile), ['polar', 'dubdot', 'vercel']);
assert.deepEqual(PRESETS.slice(-3).map((item) => item.code), ['NC-07', 'NC-08', 'NC-09']);
assert.deepEqual(PRESETS.slice(-3).map((item) => item.colors), [
  ['#202126', '#FF7A1A', '#FF22D3', '#FFF7A3'],
  ['#FFFFFF', '#DDEEFF', '#A7DBFF', '#27B8F3'],
  ['#FFFFFF', '#BCEFEA', '#FFD76A', '#FF8BB6']
]);
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
assert.match(shaderSource, /renderPolar/);
assert.match(shaderSource, /renderDubdot/);
assert.match(shaderSource, /renderVercel/);
assert.match(shaderSource, /u_profile/);
assert.match(shaderSource, /AURORA_PROFILE/);

const fallbackSource = await readFile(new URL('./src/fallback.js', import.meta.url), 'utf8');
assert.match(fallbackSource, /drawPolar/);
assert.match(fallbackSource, /drawDubdot/);
assert.match(fallbackSource, /drawVercel/);

const readmeZh = await readFile(new URL('./README.md', import.meta.url), 'utf8');
const readmeEn = await readFile(new URL('./README.en.md', import.meta.url), 'utf8');
assert.match(readmeZh, /一键启动（推荐）/);
assert.match(readmeEn, /One-click launchers \(recommended\)/);

console.log('All smoke tests passed.');
