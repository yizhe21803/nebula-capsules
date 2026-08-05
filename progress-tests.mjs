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
assert.deepEqual(PROGRESS_PRESETS.map((item) => item.loadRate), [1.10, 1.00, 1.05]);
assert.ok(PROGRESS_PRESETS.every((item) => item.loadRate >= 1.0 && item.loadRate <= 1.1));

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
assert.match(entrySource, /createProgressFlowOverlays/);
assert.match(entrySource, /flowOverlays\.update\(flowTime, paused\)/);
assert.match(entrySource, /function syncProgressLayout\(\)/);
assert.match(entrySource, /is-progress-single-column/);
assert.match(entrySource, /requestAnimationFrame\(syncProgressLayout\)/);

const moduleSource = await readFile(new URL('./src/progress-capsules.js', import.meta.url), 'utf8');
assert.match(moduleSource, /this\.value < 100/);
assert.match(moduleSource, /const forwardStep = Math\.min\(this\.preset\.loadRate \* delta, 0\.060\)/);
assert.match(moduleSource, /this\.value \+ forwardStep/);
assert.match(moduleSource, /Math\.min\(100, this\.value \+ forwardStep\)/);
assert.match(moduleSource, /FORWARD \+ DRAG/);
assert.match(moduleSource, /const BRAND_NAME = '画境观屿'/);
assert.match(moduleSource, /progress-name\">\$\{BRAND_NAME\}<\/span>/);
assert.match(moduleSource, /pointerdown/);
assert.match(moduleSource, /performance\.now\(\) \+ 1800/);
assert.doesNotMatch(moduleSource, /chooseNextTarget/);
assert.doesNotMatch(moduleSource, /targetValue/);
assert.doesNotMatch(moduleSource, /nextTargetAt/);
assert.doesNotMatch(moduleSource, /Math\.exp\(-delta/);
assert.doesNotMatch(moduleSource, /setProgress\(minValue \+ this\.random/);

const randomizeBody = moduleSource.match(/randomize\(\) \{([\s\S]*?)\n  \}\n\}/)?.[1] || '';
assert.match(randomizeBody, /this\.flowTime = this\.random\(\) \* 40/);
assert.doesNotMatch(randomizeBody, /setProgress/);

const motionSource = await readFile(new URL('./src/progress-motion-data.js', import.meta.url), 'utf8');
assert.match(motionSource, /PROGRESS_MOTION_WIDTH = 240/);
assert.match(motionSource, /PROGRESS_MOTION_HEIGHT = 80/);
assert.match(motionSource, /PROGRESS_MOTION_DURATION = 12/);
assert.match(motionSource, /PROFILE_CONFIG/);
assert.match(motionSource, /createMotionData/);
assert.match(motionSource, /getProgressMotionData/);
assert.doesNotMatch(motionSource, /progress-motion-model/);

const rendererSource = await readFile(new URL('./src/progress-flow-renderer.js', import.meta.url), 'utf8');
assert.match(rendererSource, /getContext\('webgl2'/);
assert.match(rendererSource, /getProgressMotionData/);
assert.match(rendererSource, /u_motion/);
assert.match(rendererSource, /u_effect/);
assert.match(rendererSource, /u_hasEffect/);
assert.match(rendererSource, /effectX/);
assert.match(rendererSource, /referenceColor/);
assert.match(rendererSource, /effectImage/);
assert.match(rendererSource, /u_effectFrames/);
assert.match(rendererSource, /atlasFrameA/);
assert.match(rendererSource, /atlasMix/);
assert.match(rendererSource, /Canvas 2D 降级/);

const overlaySource = await readFile(new URL('./src/progress-flow-overlays.js', import.meta.url), 'utf8');
assert.match(overlaySource, /getProgressReferenceAtlas/);
assert.match(overlaySource, /PROGRESS_REFERENCE_DURATION/);
assert.match(overlaySource, /renderer\.draw\(/);
assert.doesNotMatch(overlaySource, /\.webm/);
assert.doesNotMatch(overlaySource, /video\./);

const atlasSource = await readFile(new URL('./src/progress-reference-atlases.js', import.meta.url), 'utf8');
assert.match(atlasSource, /PROGRESS_REFERENCE_FRAME_COUNT = 24/);
assert.match(atlasSource, /function createAtlas/);
assert.match(atlasSource, /canvas\.toDataURL\('image\/png'\)/);
assert.match(atlasSource, /getProgressReferenceAtlas/);
assert.doesNotMatch(atlasSource, /progress-reference-atlas-model/);

const progressStyles = await readFile(new URL('./progress.css', import.meta.url), 'utf8');
assert.match(progressStyles, /grid-template-columns:\s*repeat\(4/);
assert.match(progressStyles, /touch-action:\s*none/);
assert.match(progressStyles, /cursor:\s*ew-resize/);
assert.match(progressStyles, /has-webgl-progress/);
assert.match(progressStyles, /progress-webgl-overlay/);
assert.doesNotMatch(progressStyles, /progress-reference-video/);
assert.match(progressStyles, /#capsule-grid\.is-progress-single-column/);
assert.match(progressStyles, /grid-template-columns:\s*454px/);
assert.match(progressStyles, /width:\s*454px/);
assert.match(progressStyles, /height:\s*104px/);
assert.match(progressStyles, /font-size:\s*44px/);
assert.match(progressStyles, /grid-column:\s*1(?:;|\s)/);
assert.doesNotMatch(progressStyles, /grid-column:\s*1 \/ -1/);

console.log('Progress v2.4.7 lightweight GitHub sync validation passed.');
