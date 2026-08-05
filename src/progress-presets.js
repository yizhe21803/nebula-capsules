export const PROGRESS_PRESETS = [
  {
    id: 'model-training',
    code: 'NC-10',
    name: 'MODEL TRAINING',
    subtitle: 'SHA 4.5 + 100 2026 TKN',
    group: 'progress',
    initialProgress: 43,
    loadRate: 1.10,
    colors: ['#2B1025', '#FF3F94', '#FF8A3D', '#FFF06A']
  },
  {
    id: 'agent-migration',
    code: 'NC-11',
    name: 'AGENT MIGRATION',
    subtitle: 'TRANSFERRING PROTOCOL',
    group: 'progress',
    initialProgress: 33,
    loadRate: 1.00,
    colors: ['#101C37', '#245BFF', '#00CFFF', '#5DFFE6']
  },
  {
    id: 'visual-training',
    code: 'NC-12',
    name: 'VISUAL TRAINING',
    subtitle: 'GENERATING POWER ++',
    group: 'progress',
    initialProgress: 58,
    loadRate: 1.05,
    colors: ['#21142D', '#7042FF', '#42F58D', '#C4FF8A']
  }
];

export function validateProgressPreset(preset) {
  return Boolean(
    preset &&
    typeof preset.id === 'string' &&
    typeof preset.code === 'string' &&
    typeof preset.name === 'string' &&
    preset.group === 'progress' &&
    Number.isFinite(preset.initialProgress) &&
    Number.isFinite(preset.loadRate) &&
    Array.isArray(preset.colors) &&
    preset.colors.length === 4
  );
}
