import modelMotion from './progress-motion-model.js';
import agentMotion from './progress-motion-agent.js';
import visualMotion from './progress-motion-visual.js';

export const PROGRESS_MOTION_WIDTH = 240;
export const PROGRESS_MOTION_HEIGHT = 80;
export const PROGRESS_MOTION_DURATION = 12.0;
export const PROGRESS_MOTION_MAX_PX = 40.0;

const MOTION_BASE64 = {
  'model-training': modelMotion,
  'agent-migration': agentMotion,
  'visual-training': visualMotion
};

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

const CACHE = new Map();

export function getProgressMotionData(id) {
  if (CACHE.has(id)) return CACHE.get(id);
  const data = decodeBase64(MOTION_BASE64[id] || MOTION_BASE64['visual-training']);
  CACHE.set(id, data);
  return data;
}
