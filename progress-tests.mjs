import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PRESETS } from './src/presets.js';
import { PROGRESS_PRESETS, validateProgressPreset } from './src/progress-presets.js';

assert.deepEqual(
  PRESETS.map((item) => item.code),
  ['NC-01', 'NC-02', 'NC-03', 'NC-04', 'NC-05', 'NC-06', 'NC-07', 'NC-08', 'NC-09'],
  'NC-01 through NC-09 must remain frozen in the original preset module'
);
assert.deepEqual(PROGRESS_PRESETS.map((item) => item.code), ['NC-10', 'NC-11', 'NC-12']);
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

const moduleSource = await readFile(new URL('./src/progress-capsules.js', import.meta.url), 'utf8');
assert.match(moduleSource, /FLOW_PROFILES/);
assert.match(moduleSource, /edgeOffset/);
assert.match(moduleSource, /localBulge/);
assert.match(moduleSource, /drawPathBand/);
assert.match(moduleSource, /drawDarkEllipticalShadow/);
assert.match(moduleSource, /chooseNextTarget/);
assert.match(moduleSource, /Math\.exp\(-delta \* 3\.25\)/);
assert.match(moduleSource, /pointerdown/);
assert.match(moduleSource, /performance\.now\(\) \+ 1800/);
assert.doesNotMatch(moduleSource, /this\.value \+ this\.preset\.loadRate \* delta/);

const progressStyles = await readFile(new URL('./progress.css', import.meta.url), 'utf8');
assert.match(progressStyles, /grid-template-columns:\s*repeat\(4/);
assert.match(progressStyles, /touch-action:\s*none/);
assert.match(progressStyles, /cursor:\s*ew-resize/);
assert.doesNotMatch(progressStyles, /\.progress-stage::after/);

console.log('Progress reference comparison tests passed.');
