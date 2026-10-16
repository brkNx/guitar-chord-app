import type { StrumPattern } from '../types/guitar';

export const STRUM_PATTERNS: StrumPattern[] = [
  {
    id: 'pop_rock_classic',
    name: 'Pop / Rock Klasik (D - D U - U D U)',
    timeSignature: '4/4',
    description: 'Dünyanın en popüler 4/4 gitar ritmi. Wonderwall, Let It Be ve sayısız şarkıda kullanılır.',
    defaultBpm: 96,
    strokes: [
      { type: 'down', label: '↓', accent: true },
      { type: 'rest', label: '•' },
      { type: 'down', label: '↓', accent: true },
      { type: 'up', label: '↑' },
      { type: 'rest', label: '•' },
      { type: 'up', label: '↑' },
      { type: 'down', label: '↓' },
      { type: 'up', label: '↑' }
    ]
  },
  {
    id: 'acoustic_ballad',
    name: 'Akustik Balad (D - D - D U D U)',
    timeSignature: '4/4',
    description: 'Yumuşak ve akıcı vuruşlar içeren akustik ritim. Duygusal parçalarda çok iyi tınlar.',
    defaultBpm: 84,
    strokes: [
      { type: 'down', label: '↓', accent: true },
      { type: 'rest', label: '•' },
      { type: 'down', label: '↓' },
      { type: 'rest', label: '•' },
      { type: 'down', label: '↓' },
      { type: 'up', label: '↑' },
      { type: 'down', label: '↓' },
      { type: 'up', label: '↑' }
    ]
  },
  {
    id: 'waltz_3_4',
    name: 'Vals / 3-Zamanlı (Bas - Vur - Çek)',
    timeSignature: '3/4',
    description: '3/4 ölçülü vals ve türkülerde kullanılan ritim (1 bas vuruşu ardından 2 arpej/ritim).',
    defaultBpm: 110,
    strokes: [
      { type: 'bass', label: 'BAS', accent: true },
      { type: 'down', label: '↓' },
      { type: 'up', label: '↑' },
      { type: 'down', label: '↓' },
      { type: 'up', label: '↑' },
      { type: 'rest', label: '•' }
    ]
  },
  {
    id: 'slow_rock_6_8_arpeggio',
    name: 'Slow Rock 6/8 Arpej (P-I-M-A-M-I)',
    timeSignature: '6/8',
    description: 'House of the Rising Sun, Hallelujah tarzı 6/8 arpej (Bas - 3. tel - 2. tel - 1. tel - 2. tel - 3. tel).',
    defaultBpm: 68,
    strokes: [
      { type: 'bass', label: 'P (Bas)', accent: true, pluckStrings: [0] },
      { type: 'up', label: 'i (3)', pluckStrings: [3] },
      { type: 'up', label: 'm (2)', pluckStrings: [4] },
      { type: 'down', label: 'a (1)', accent: true, pluckStrings: [5] },
      { type: 'up', label: 'm (2)', pluckStrings: [4] },
      { type: 'up', label: 'i (3)', pluckStrings: [3] }
    ]
  },
  {
    id: 'folk_country',
    name: 'Folk & Country (Bas-Vur-Bas-Çek)',
    timeSignature: '4/4',
    description: 'Johnny Cash tarzı hızlı, ritmik bas-akor vuruşları.',
    defaultBpm: 116,
    strokes: [
      { type: 'bass', label: 'BAS', accent: true },
      { type: 'down', label: '↓' },
      { type: 'bass', label: 'BAS', accent: true },
      { type: 'up', label: '↑' }
    ]
  },
  {
    id: 'acoustic_fingerpicking_4_4',
    name: 'Akustik Parmak Stili / Arpej (P - 3 - 2 - 1 - 2 - 3 - 2 - 1)',
    timeSignature: '4/4',
    description: 'Sufle - Pus ve balad parçalarının stüdyo kayıtlarındaki orijinal akustik parmak stili arpej ritmi.',
    defaultBpm: 96,
    strokes: [
      { type: 'bass', label: 'P (Bas)', accent: true, pluckStrings: [0] },
      { type: 'up', label: 'i (3)', pluckStrings: [3] },
      { type: 'up', label: 'm (2)', pluckStrings: [4] },
      { type: 'down', label: 'a (1)', accent: true, pluckStrings: [5] },
      { type: 'up', label: 'm (2)', pluckStrings: [4] },
      { type: 'up', label: 'i (3)', pluckStrings: [3] },
      { type: 'up', label: 'm (2)', pluckStrings: [4] },
      { type: 'down', label: 'a (1)', pluckStrings: [5] }
    ]
  },
  {
    id: 'rumba_flamenco',
    name: 'Rumba / Akdeniz Ritmi (Vur-Sustur)',
    timeSignature: '4/4',
    description: 'Gipsy Kings ve Akdeniz pop şarkılarında perküsif slap/susturma ile çalan canlı ritim.',
    defaultBpm: 104,
    strokes: [
      { type: 'down', label: '↓', accent: true },
      { type: 'mute', label: 'X', accent: true },
      { type: 'up', label: '↑' },
      { type: 'down', label: '↓' },
      { type: 'mute', label: 'X', accent: true },
      { type: 'up', label: '↑' }
    ]
  }
];

export const DEFAULT_STRUM_PATTERN = STRUM_PATTERNS[0];
