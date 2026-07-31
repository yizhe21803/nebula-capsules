export const PRESETS = [
  {
    id: 'aurora-veil',
    code: 'NC-01',
    name: 'AURORA VEIL',
    group: 'cold',
    seed: 1.7,
    speed: 0.16,
    colors: ['#061326', '#5b38df', '#34d9ff', '#8bffe9']
  },
  {
    id: 'solar-bloom',
    code: 'NC-02',
    name: 'SOLAR BLOOM',
    group: 'warm',
    seed: 8.2,
    speed: 0.13,
    colors: ['#160a24', '#fa5f8b', '#ffb04f', '#fbe3b1']
  },
  {
    id: 'deep-current',
    code: 'NC-03',
    name: 'DEEP CURRENT',
    group: 'cold',
    seed: 14.1,
    speed: 0.12,
    colors: ['#030a19', '#122fc6', '#167bff', '#b9ddff']
  },
  {
    id: 'violet-drift',
    code: 'NC-04',
    name: 'VIOLET DRIFT',
    group: 'cold',
    seed: 23.4,
    speed: 0.14,
    colors: ['#100524', '#6c35ff', '#c451ff', '#6ecbff']
  },
  {
    id: 'lunar-smoke',
    code: 'NC-05',
    name: 'LUNAR SMOKE',
    group: 'cold',
    seed: 37.8,
    speed: 0.1,
    colors: ['#090a10', '#273248', '#8392aa', '#eef5ff']
  },
  {
    id: 'nova-peach',
    code: 'NC-06',
    name: 'NOVA PEACH',
    group: 'warm',
    seed: 51.3,
    speed: 0.15,
    colors: ['#160922', '#ff496f', '#ff8f55', '#ffd58a']
  }
];

export function hexToRgb01(hex) {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255
  ];
}

export function validatePreset(preset) {
  return Boolean(
    preset &&
    typeof preset.id === 'string' &&
    typeof preset.name === 'string' &&
    Number.isFinite(preset.seed) &&
    Number.isFinite(preset.speed) &&
    Array.isArray(preset.colors) &&
    preset.colors.length === 4
  );
}
