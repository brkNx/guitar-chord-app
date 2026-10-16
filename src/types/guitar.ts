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
  youtubeId?: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  timings?: Array<{ time: number; chord: string }>;
}

export type FretboardDisplayMode = 'fingers' | 'notes' | 'degrees';
export type FretboardViewMode = 'chord' | 'scale';

export interface TuningDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  notes: string[]; // Strings 6 (low) to 1 (high), e.g. ['E', 'A', 'D', 'G', 'B', 'E']
  octaves: number[]; // e.g. [2, 2, 3, 3, 3, 4]
  frequencies: number[]; // e.g. [82.41, 110.00, 146.83, 196.00, 246.94, 329.63]
}

export interface ScaleDefinition {
  id: string;
  name: string;
  category: 'pentatonic' | 'diatonic' | 'blues' | 'minor_variant' | 'mode';
  intervals: number[]; // Semitone intervals from root: [0, 2, 4, 5, 7, 9, 11]
  degreeNames: string[]; // e.g. ['R', '2', '3', '4', '5', '6', '7'] or ['R', 'b3', '4', 'b5', '5', 'b7']
  description: string;
}

export type StrumStrokeType = 'down' | 'up' | 'mute' | 'bass' | 'rest';

export interface StrumStroke {
  type: StrumStrokeType;
  label: string; // '↓' | '↑' | 'X' | 'Bas' | '•'
  accent?: boolean;
  pluckStrings?: number[]; // 0-indexed string indices for fingerpicking/arpeggio
}

export interface StrumPattern {
  id: string;
  name: string;
  timeSignature: '4/4' | '3/4' | '6/8';
  description: string;
  defaultBpm: number;
  strokes: StrumStroke[];
}
