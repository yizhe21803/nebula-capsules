import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PRESETS } from './src/presets.js';
import { PROGRESS_PRESETS, validateProgressPreset } from './src/progress-presets.js';

assert.deepEqual(
  PRESETS.map((item) => item.code),
  ['NC-01', 'NC-02', 'NC-03', 'NC-04', 'NC-05', 'NC-06', 'NC-07', 'NC-08', 'NC-09'],
  'NC-01 through NC-09 must remain the only entries in the original preset module'
);

assert.deepEqual(
  PROGRESS_PRESETS.map((item) => item.code),
  ['NC-10', 'NC-11', 'NC-12']
);

assert.ok(PROGRESS_PRESETS.every(validateProgressPreset));
assert.equal(new Set([...PRESETS, ...PROGRESS_PRESETS].map((item) => item.code)).size, 12);

const mainSource = await readFile(new URL('./src/main.js', import.meta.url), 'utf8');
assert.doesNotMatch(mainSource, /progress-presets|progress-capsules|PROGRESS_PRESETS/);

const indexSource = await readFile(new URL('./index.html', import.meta.url), 'utf8');
assert.match(indexSource, /data-filter="progress"/);
assert.match(indexSource, /src\/progress-entry\.js/);
assert.match(indexSource, /progress\.css/);

const entrySource = await readFile(new URL('./src/progress-entry.js', import.meta.url), 'utf8');
assert.match(entrySource, /LEGACY_CAPSULE_COUNT = 9/);
assert.match(entrySource, /requestAnimationFrame\(mountProgressCapsules\)/);
assert.match(entrySource, /grid\.dataset\.progressMounted/);
assert.match(entrySource, /createProgressCapsules/);
assert.match(entrySource, /aria-pressed/);

const moduleSource = await readFile(new URL('./src/progress-capsules.js', import.meta.url), 'utf8');
assert.match(moduleSource, /pointerdown/);
assert.match(moduleSource, /pointermove/);
assert.match(moduleSource, /loadRate \* delta/);
assert.match(moduleSource, /performance\.now\(\) \+ 1800/);
assert.match(moduleSource, /progress-wave-canvas/);
assert.match(moduleSource, /drawBeachWaves/);
assert.match(moduleSource, /drawWaveLayer/);
assert.match(moduleSource, /createBoundaryPath/);
assert.match(moduleSource, /createFoamPath/);
assert.match(moduleSource, /Math\.sin/);
assert.match(moduleSource, /globalCompositeOperation = 'screen'/);
assert.match(moduleSource, /ResizeObserver/);

const progressStyles = await readFile(new URL('./progress.css', import.meta.url), 'utf8');
assert.match(progressStyles, /grid-template-columns:\s*repeat\(4/);
assert.match(progressStyles, /touch-action:\s*none/);
assert.match(progressStyles, /cursor:\s*ew-resize/);
assert.match(progressStyles, /\.progress-wave-canvas/);
assert.doesNotMatch(progressStyles, /\.progress-interface/);
assert.doesNotMatch(progressStyles, /clip-path:/);

console.log('Progress capsule beach-wave isolation tests passed.');
