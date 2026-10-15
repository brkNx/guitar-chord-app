import type { TuningDefinition } from '../types/guitar';

export const GUITAR_TUNINGS: TuningDefinition[] = [
  {
    id: 'standard',
    name: 'Standart (E A D G B E)',
    shortName: 'Standart',
    description: 'En yaygın gitar akort düzeni. Pop, rock ve klasik müzik için standart.',
    notes: ['E', 'A', 'D', 'G', 'B', 'E'],
    octaves: [2, 2, 3, 3, 3, 4],
    frequencies: [82.41, 110.00, 146.83, 196.00, 246.94, 329.63]
  },
  {
    id: 'drop_d',
    name: 'Drop D (D A D G B E)',
    shortName: 'Drop D',
    description: 'En kalın E teli D sesine pesleştirilir. Güçlü rock/metal powerchordları için idealdir.',
    notes: ['D', 'A', 'D', 'G', 'B', 'E'],
    octaves: [2, 2, 3, 3, 3, 4],
    frequencies: [73.42, 110.00, 146.83, 196.00, 246.94, 329.63]
  },
  {
    id: 'dadgad',
    name: 'DADGAD (D A D G A D)',
    shortName: 'DADGAD',
    description: 'Kelt, folk ve modern parmak stili (fingerstyle) müziğin vazgeçilmez akort düzeni.',
    notes: ['D', 'A', 'D', 'G', 'A', 'D'],
    octaves: [2, 2, 3, 3, 3, 4],
    frequencies: [73.42, 110.00, 146.83, 196.00, 220.00, 293.66]
  },
  {
    id: 'open_g',
    name: 'Açık G / Open G (D G D G B D)',
    shortName: 'Open G',
    description: 'Boş tellere vurulduğunda G majör akoru verir. Rolling Stones & blues tarzı çalım için mükemmeldir.',
    notes: ['D', 'G', 'D', 'G', 'B', 'D'],
    octaves: [2, 2, 3, 3, 3, 4],
    frequencies: [73.42, 98.00, 146.83, 196.00, 246.94, 293.66]
  },
  {
    id: 'open_d',
    name: 'Açık D / Open D (D A D F# A D)',
    shortName: 'Open D',
    description: 'Slide (darbuka camı/metal) gitar ve zengin açık D tınıları için kullanılır.',
    notes: ['D', 'A', 'D', 'F#', 'A', 'D'],
    octaves: [2, 2, 3, 3, 3, 4],
    frequencies: [73.42, 110.00, 146.83, 185.00, 220.00, 293.66]
  },
  {
    id: 'half_step_down',
    name: 'Yarım Ses Pes / Eb (Eb Ab Db Gb Bb Eb)',
    shortName: 'Eb Standart',
    description: 'Jimi Hendrix, Stevie Ray Vaughan ve Guns N Roses tarafından vokal rahatlığı ve sıcak tını için tercih edilir.',
    notes: ['D#', 'G#', 'C#', 'F#', 'A#', 'D#'],
    octaves: [2, 2, 3, 3, 3, 4],
    frequencies: [77.78, 103.83, 138.59, 185.00, 233.08, 311.13]
  },
  {
    id: 'd_standard',
    name: 'D Standart / Tam Ses Pes (D G C F A D)',
    shortName: 'D Standart',
    description: 'Tüm teller 1 tam ses pesleştirilmiştir. Kalın, dolgun akustik ve modern rock tonu sağlar.',
    notes: ['D', 'G', 'C', 'F', 'A', 'D'],
    octaves: [2, 2, 3, 3, 3, 4],
    frequencies: [73.42, 98.00, 130.81, 174.61, 220.00, 293.66]
  }
];

export const DEFAULT_TUNING = GUITAR_TUNINGS[0];

export function getTuningById(id: string): TuningDefinition {
  return GUITAR_TUNINGS.find((t) => t.id === id) || DEFAULT_TUNING;
}
