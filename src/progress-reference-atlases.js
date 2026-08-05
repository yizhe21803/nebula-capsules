import model0 from './progress-reference-atlas-model-0.js';
import model1 from './progress-reference-atlas-model-1.js';
import model2 from './progress-reference-atlas-model-2.js';
import agent0 from './progress-reference-atlas-agent-0.js';
import agent1 from './progress-reference-atlas-agent-1.js';
import agent2 from './progress-reference-atlas-agent-2.js';
import visual0 from './progress-reference-atlas-visual-0.js';
import visual1 from './progress-reference-atlas-visual-1.js';
import visual2 from './progress-reference-atlas-visual-2.js';

export const PROGRESS_REFERENCE_DURATION = 12;
export const PROGRESS_REFERENCE_FRAME_COUNT = 24;

const URLS = {
  'model-training': `data:image/png;base64,${model0}${model1}${model2}`,
  'agent-migration': `data:image/png;base64,${agent0}${agent1}${agent2}`,
  'visual-training': `data:image/png;base64,${visual0}${visual1}${visual2}`
};

const CACHE = new Map();

export function getProgressReferenceAtlas(id) {
  if (CACHE.has(id)) return CACHE.get(id);

  const image = new Image();
  image.decoding = 'async';
  const state = { image, ready: false };
  image.addEventListener('load', () => { state.ready = true; }, { once: true });
  image.addEventListener('error', () => { state.ready = false; }, { once: true });
  image.src = URLS[id] || URLS['visual-training'];
  CACHE.set(id, state);
  return state;
}
