import type { ScaleDefinition } from '../types/guitar';
import { NOTES, normalizeChordName } from './chordLibrary';

export const GUITAR_SCALES: ScaleDefinition[] = [
  {
    id: 'minor_pentatonic',
    name: 'Pentatonik Minör',
    category: 'pentatonic',
    intervals: [0, 3, 5, 7, 10],
    degreeNames: ['R', 'b3', '4', '5', 'b7'],
    description: 'Rock, blues ve pop sololarının temel taşı. Çalması en doğal ve etkili gam.'
  },
  {
    id: 'blues',
    name: 'Blues Gamı (Blue Note)',
    category: 'blues',
    intervals: [0, 3, 5, 6, 7, 10],
    degreeNames: ['R', 'b3', '4', 'b5', '5', 'b7'],
    description: 'Pentatonik minöre eklenen eksik 5’li (blue note / şeytan aralığı) ile otantik blues tınısı.'
  },
  {
    id: 'major_pentatonic',
    name: 'Pentatonik Majör',
    category: 'pentatonic',
    intervals: [0, 2, 4, 7, 9],
    degreeNames: ['R', '2', '3', '5', '6'],
    description: 'Country, southern rock ve neşeli pop melodileri için parlak, pürüzsüz gam.'
  },
  {
    id: 'major',
    name: 'Majör (İyonik)',
    category: 'diatonic',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degreeNames: ['R', '2', '3', '4', '5', '6', '7'],
    description: 'Batı müziğinin temel anahtarı. Do-Re-Mi-Fa-Sol-La-Si doğal dizi.'
  },
  {
    id: 'natural_minor',
    name: 'Doğal Minör (Eolyen)',
    category: 'diatonic',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degreeNames: ['R', '2', 'b3', '4', '5', 'b6', 'b7'],
    description: 'Duygusal, epik ve hüzünlü tınılar. Anadolu rock ve klasik baladların özü.'
  },
  {
    id: 'harmonic_minor',
    name: 'Harmonik Minör',
    category: 'minor_variant',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    degreeNames: ['R', '2', 'b3', '4', '5', 'b6', '7'],
    description: 'Neo-klasik rock (Yngwie Malmsteen) ve Doğu/Flamenko tınılı karakteristik 7’li çekim.'
  },
  {
    id: 'dorian',
    name: 'Dorian Modu',
    category: 'mode',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degreeNames: ['R', '2', 'b3', '4', '5', '6', 'b7'],
    description: 'Santana, Pink Floyd ve funk rifflerinde sıkça duyulan sofistike minör mod.'
  },
  {
    id: 'mixolydian',
    name: 'Miksolidyen Modu',
    category: 'mode',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    degreeNames: ['R', '2', '3', '4', '5', '6', 'b7'],
    description: 'Klasik rock ve blues-rock eşliklerinde majör akorlar üzerine çalınan modal dizi.'
  }
];

export const DEFAULT_SCALE = GUITAR_SCALES[0]; // Pentatonik Minör

// Clean and normalize root note (e.g. 'Am' -> 'A', 'F#' -> 'F#')
export function extractRootNote(input: string): string {
  if (!input) return 'A';
  const clean = normalizeChordName(input);
  const match = clean.match(/^[A-G][#b]?/);
  return match ? match[0] : 'A';
}

// Get the notes present in the scale for a given root note
export function getScaleNotes(root: string, scaleOrDef?: ScaleDefinition | string): string[] {
  const cleanRoot = extractRootNote(root);
  const rootIdx = NOTES.indexOf(cleanRoot);
  if (rootIdx === -1) return [];

  const scale =
    typeof scaleOrDef === 'string'
      ? GUITAR_SCALES.find((s) => s.id === scaleOrDef) || DEFAULT_SCALE
      : scaleOrDef || DEFAULT_SCALE;

  if (!scale || !scale.intervals) return [];

  return scale.intervals.map((interval) => {
    const noteIdx = (rootIdx + interval) % 12;
    return NOTES[noteIdx];
  });
}

// Check if a note is in the scale, return degree and whether it is root
export function getScaleNoteInfo(
  note: string,
  root: string,
  scaleOrDef?: ScaleDefinition | string
): { inScale: boolean; degreeName?: string; isRoot?: boolean } {
  const cleanRoot = extractRootNote(root);
  const rootIdx = NOTES.indexOf(cleanRoot);
  const noteIdx = NOTES.indexOf(note);

  if (rootIdx === -1 || noteIdx === -1) return { inScale: false };

  const scale =
    typeof scaleOrDef === 'string'
      ? GUITAR_SCALES.find((s) => s.id === scaleOrDef) || DEFAULT_SCALE
      : scaleOrDef || DEFAULT_SCALE;

  if (!scale || !scale.intervals) return { inScale: false };

  let semitones = (noteIdx - rootIdx) % 12;
  if (semitones < 0) semitones += 12;

  const intervalIndex = scale.intervals.indexOf(semitones);
  if (intervalIndex === -1) {
    return { inScale: false };
  }

  return {
    inScale: true,
    degreeName: scale.degreeNames?.[intervalIndex] || `d${intervalIndex + 1}`,
    isRoot: semitones === 0
  };
}
