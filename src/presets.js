export const PRESETS = [
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
  },
  {
    id: 'polar',
    code: 'NC-07',
    name: 'POLAR',
    subtitle: 'YOU MADE A SALE',
    group: 'warm',
    mode: 'aurora',
    motionProfile: 'polar',
    theme: 'dark',
    seed: 67.4,
    speed: 0.23,
    colors: ['#202126', '#FF7A1A', '#FF22D3', '#FFF7A3']
  },
  {
    id: 'dubdot',
    code: 'NC-08',
    name: 'DUBDOT',
    subtitle: '$2000 COMMISSION',
    group: 'cold',
    mode: 'aurora',
    motionProfile: 'dubdot',
    theme: 'light',
    seed: 78.6,
    speed: 0.2,
    colors: ['#FFFFFF', '#DDEEFF', '#A7DBFF', '#27B8F3']
  },
  {
    id: 'vercel',
    code: 'NC-09',
    name: 'VERCEL',
    subtitle: 'DEPLOYMENT IN 24H',
    group: 'warm',
    mode: 'aurora',
    motionProfile: 'vercel',
    theme: 'light',
    seed: 89.9,
    speed: 0.18,
    colors: ['#FFFFFF', '#BCEFEA', '#FFD76A', '#FF8BB6']
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
    ['nebula', 'aurora'].includes(preset.mode || 'nebula') &&
    (!preset.motionProfile || ['polar', 'dubdot', 'vercel'].includes(preset.motionProfile)) &&
    Number.isFinite(preset.seed) &&
    Number.isFinite(preset.speed) &&
    Array.isArray(preset.colors) &&
    preset.colors.length === 4
  );
}
