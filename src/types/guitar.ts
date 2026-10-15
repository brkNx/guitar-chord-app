export type StringNumber = 1 | 2 | 3 | 4 | 5 | 6; // 6: Low E, 1: High E

export interface BarreDefinition {
  fret: number;
  fromString: number; // 6 to 1
  toString: number;   // 6 to 1
  finger: number;     // 1 to 4
}

export interface ChordPosition {
  frets: number[];    // 6 elements, from 6th (low E) to 1st (high E). -1: muted (X), 0: open (O), >0: fret
  fingers: number[];  // 6 elements, finger number (0: open/none, 1: index, 2: middle, 3: ring, 4: pinky, 5: thumb)
  baseFret: number;   // Starting fret (usually 1, higher for barre chords like Bm at fret 2 or C at fret 8)
  barres?: BarreDefinition[];
  capo?: boolean;
}

export interface ChordDefinition {
  name: string;        // e.g. "Am", "C", "F#m", "Dsus4"
  root: string;        // e.g. "A", "C", "F#", "D"
  suffix: string;      // e.g. "m", "7", "maj7", "sus4"
  positions: ChordPosition[];
}

export interface SongSegment {
  chord: string;       // e.g. "Am"
  lyric: string;       // e.g. "Gözlerin "
}

export interface ParsedLine {
  type: 'chord-lyric' | 'section' | 'comment' | 'empty';
  sectionName?: string; // e.g. "Kıta 1", "Nakarat", "Chorus", "Intro"
  segments?: SongSegment[];
  rawText?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  capo: number;
  tempo?: number;      // BPM
  difficulty?: 'Kolay' | 'Orta' | 'Zor';
  content: string;     // ChordPro formatted string
  tags?: string[];
  isCustom?: boolean;
  isAiGenerated?: boolean;
}

export type FretboardDisplayMode = 'fingers' | 'notes' | 'degrees';
