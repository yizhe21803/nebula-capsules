import assert from 'node:assert/strict';
import { PRESETS, hexToRgb01, validatePreset } from '../src/presets.js';

assert.equal(PRESETS.length, 6, 'Expected six presets');
assert.ok(PRESETS.every(validatePreset), 'Every preset should be valid');
assert.deepEqual(hexToRgb01('#000000'), [0, 0, 0]);
assert.deepEqual(hexToRgb01('#ffffff'), [1, 1, 1]);
assert.equal(new Set(PRESETS.map((preset) => preset.id)).size, PRESETS.length, 'Preset IDs must be unique');
assert.equal(new Set(PRESETS.map((preset) => preset.code)).size, PRESETS.length, 'Preset codes must be unique');
console.log('Nebula Capsules smoke tests passed.');
