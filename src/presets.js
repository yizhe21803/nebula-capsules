export const PRESETS = [
  {
    id: 'aurora-veil',
    code: 'NC-01',
    name: 'AURORA VEIL',
    group: 'cold',
    seed: 1.7,
    speed: 0.5,
    colors: ['#071321', '#244E78', '#3F91A6', '#A9D9D4']
  },
  {
    id: 'solar-bloom',
    code: 'NC-02',
    name: 'SOLAR BLOOM',
    group: 'warm',
    seed: 8.2,
    speed: 0.46,
    colors: ['#1A0E14', '#7D3740', '#C56B55', '#E8B88E']
  },
  {
    id: 'deep-current',
    code: 'NC-03',
    name: 'DEEP CURRENT',
    group: 'cold',
    seed: 14.1,
    speed: 0.44,
    colors: ['#040B13', '#173654', '#2B6685', '#9BC1CF']
  },
  {
    id: 'violet-drift',
    code: 'NC-04',
    name: 'VIOLET DRIFT',
    group: 'cold',
    seed: 23.4,
    speed: 0.48,
    colors: ['#100B18', '#403268', '#715D91', '#C1B5D1']
  },
  {
    id: 'lunar-smoke',
    code: 'NC-05',
    name: 'LUNAR SMOKE',
    group: 'cold',
    seed: 37.8,
    speed: 0.4,
    colors: ['#090B0E', '#29323A', '#69747C', '#D0D5D8']
  },
  {
    id: 'nova-peach',
    code: 'NC-06',
    name: 'NOVA PEACH',
    group: 'warm',
    seed: 51.3,
    speed: 0.47,
    colors: ['#190D12', '#743A42', '#AF625B', '#E2B48D']
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
