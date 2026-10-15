import type { ChordDefinition } from '../types/guitar';

// Primary note chromatic scale
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_TO_SHARP: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#'
};

// Open string notes from 6th (low E) to 1st (high E)
export const OPEN_STRING_NOTES = ['E', 'A', 'D', 'G', 'B', 'E'];

// Comprehensive library of guitar chords with accurate voicings and fingerings
export const CHORD_LIBRARY: Record<string, ChordDefinition> = {
  // A chords
  'A': {
    name: 'A',
    root: 'A',
    suffix: '',
    positions: [
      { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 },
      { frets: [5, 7, 7, 6, 5, 5], fingers: [1, 3, 4, 2, 1, 1], baseFret: 5, barres: [{ fret: 5, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'Am': {
    name: 'Am',
    root: 'A',
    suffix: 'm',
    positions: [
      { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], baseFret: 1 },
      { frets: [5, 7, 7, 5, 5, 5], fingers: [1, 3, 4, 1, 1, 1], baseFret: 5, barres: [{ fret: 5, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'A7': {
    name: 'A7',
    root: 'A',
    suffix: '7',
    positions: [
      { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0], baseFret: 1 },
      { frets: [5, 7, 5, 6, 5, 5], fingers: [1, 3, 1, 2, 1, 1], baseFret: 5, barres: [{ fret: 5, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'Am7': {
    name: 'Am7',
    root: 'A',
    suffix: 'm7',
    positions: [
      { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], baseFret: 1 },
      { frets: [5, 7, 5, 5, 5, 5], fingers: [1, 3, 1, 1, 1, 1], baseFret: 5, barres: [{ fret: 5, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'Amaj7': {
    name: 'Amaj7',
    root: 'A',
    suffix: 'maj7',
    positions: [
      { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0], baseFret: 1 }
    ]
  },
  'Asus4': {
    name: 'Asus4',
    root: 'A',
    suffix: 'sus4',
    positions: [
      { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 4, 0], baseFret: 1 }
    ]
  },
  'Asus2': {
    name: 'Asus2',
    root: 'A',
    suffix: 'sus2',
    positions: [
      { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0], baseFret: 1 }
    ]
  },

  // B chords
  'B': {
    name: 'B',
    root: 'B',
    suffix: '',
    positions: [
      { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barres: [{ fret: 2, fromString: 5, toString: 1, finger: 1 }] },
      { frets: [7, 9, 9, 8, 7, 7], fingers: [1, 3, 4, 2, 1, 1], baseFret: 7, barres: [{ fret: 7, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'Bm': {
    name: 'Bm',
    root: 'B',
    suffix: 'm',
    positions: [
      { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barres: [{ fret: 2, fromString: 5, toString: 1, finger: 1 }] },
      { frets: [7, 9, 9, 7, 7, 7], fingers: [1, 3, 4, 1, 1, 1], baseFret: 7, barres: [{ fret: 7, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'B7': {
    name: 'B7',
    root: 'B',
    suffix: '7',
    positions: [
      { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], baseFret: 1 }
    ]
  },
  'Bm7': {
    name: 'Bm7',
    root: 'B',
    suffix: 'm7',
    positions: [
      { frets: [-1, 2, 0, 2, 0, 2], fingers: [0, 1, 0, 2, 0, 3], baseFret: 1 },
      { frets: [-1, 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], baseFret: 2, barres: [{ fret: 2, fromString: 5, toString: 1, finger: 1 }] }
    ]
  },

  // Bb chords
  'Bb': {
    name: 'Bb',
    root: 'Bb',
    suffix: '',
    positions: [
      { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barres: [{ fret: 1, fromString: 5, toString: 1, finger: 1 }] }
    ]
  },
  'Bbm': {
    name: 'Bbm',
    root: 'Bb',
    suffix: 'm',
    positions: [
      { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [{ fret: 1, fromString: 5, toString: 1, finger: 1 }] }
    ]
  },

  // C chords
  'C': {
    name: 'C',
    root: 'C',
    suffix: '',
    positions: [
      { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 },
      { frets: [8, 10, 10, 9, 8, 8], fingers: [1, 3, 4, 2, 1, 1], baseFret: 8, barres: [{ fret: 8, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'Cm': {
    name: 'Cm',
    root: 'C',
    suffix: 'm',
    positions: [
      { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3, barres: [{ fret: 3, fromString: 5, toString: 1, finger: 1 }] }
    ]
  },
  'C7': {
    name: 'C7',
    root: 'C',
    suffix: '7',
    positions: [
      { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], baseFret: 1 }
    ]
  },
  'Cmaj7': {
    name: 'Cmaj7',
    root: 'C',
    suffix: 'maj7',
    positions: [
      { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], baseFret: 1 }
    ]
  },
  'Cadd9': {
    name: 'Cadd9',
    root: 'C',
    suffix: 'add9',
    positions: [
      { frets: [-1, 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0], baseFret: 1 }
    ]
  },

  // C# / Db
  'C#': {
    name: 'C#',
    root: 'C#',
    suffix: '',
    positions: [
      { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], baseFret: 4, barres: [{ fret: 4, fromString: 5, toString: 1, finger: 1 }] }
    ]
  },
  'C#m': {
    name: 'C#m',
    root: 'C#',
    suffix: 'm',
    positions: [
      { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barres: [{ fret: 4, fromString: 5, toString: 1, finger: 1 }] }
    ]
  },
  'C#m7': {
    name: 'C#m7',
    root: 'C#',
    suffix: 'm7',
    positions: [
      { frets: [-1, 4, 6, 4, 5, 4], fingers: [0, 1, 3, 1, 2, 1], baseFret: 4, barres: [{ fret: 4, fromString: 5, toString: 1, finger: 1 }] }
    ]
  },

  // D chords
  'D': {
    name: 'D',
    root: 'D',
    suffix: '',
    positions: [
      { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], baseFret: 1 },
      { frets: [10, 12, 12, 11, 10, 10], fingers: [1, 3, 4, 2, 1, 1], baseFret: 10, barres: [{ fret: 10, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'Dm': {
    name: 'Dm',
    root: 'D',
    suffix: 'm',
    positions: [
      { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], baseFret: 1 }
    ]
  },
  'D7': {
    name: 'D7',
    root: 'D',
    suffix: '7',
    positions: [
      { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], baseFret: 1 }
    ]
  },
  'Dsus4': {
    name: 'Dsus4',
    root: 'D',
    suffix: 'sus4',
    positions: [
      { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3], baseFret: 1 }
    ]
  },
  'Dsus2': {
    name: 'Dsus2',
    root: 'D',
    suffix: 'sus2',
    positions: [
      { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0], baseFret: 1 }
    ]
  },
  'D/F#': {
    name: 'D/F#',
    root: 'D',
    suffix: '/F#',
    positions: [
      { frets: [2, 0, 0, 2, 3, 2], fingers: [1, 0, 0, 2, 4, 3], baseFret: 1 }
    ]
  },

  // E chords
  'E': {
    name: 'E',
    root: 'E',
    suffix: '',
    positions: [
      { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], baseFret: 1 },
      { frets: [7, 7, 9, 9, 9, 7], fingers: [1, 1, 2, 3, 4, 1], baseFret: 7, barres: [{ fret: 7, fromString: 5, toString: 1, finger: 1 }] }
    ]
  },
  'Em': {
    name: 'Em',
    root: 'E',
    suffix: 'm',
    positions: [
      { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], baseFret: 1 },
      { frets: [7, 7, 9, 9, 8, 7], fingers: [1, 1, 3, 4, 2, 1], baseFret: 7, barres: [{ fret: 7, fromString: 5, toString: 1, finger: 1 }] }
    ]
  },
  'E7': {
    name: 'E7',
    root: 'E',
    suffix: '7',
    positions: [
      { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], baseFret: 1 }
    ]
  },
  'Em7': {
    name: 'Em7',
    root: 'E',
    suffix: 'm7',
    positions: [
      { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 1, 0, 0, 0, 0], baseFret: 1 },
      { frets: [0, 2, 2, 0, 3, 0], fingers: [0, 1, 2, 0, 3, 0], baseFret: 1 }
    ]
  },
  'Esus4': {
    name: 'Esus4',
    root: 'E',
    suffix: 'sus4',
    positions: [
      { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0], baseFret: 1 }
    ]
  },

  // F chords
  'F': {
    name: 'F',
    root: 'F',
    suffix: '',
    positions: [
      { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barres: [{ fret: 1, fromString: 6, toString: 1, finger: 1 }] },
      { frets: [-1, -1, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], baseFret: 1, barres: [{ fret: 1, fromString: 2, toString: 1, finger: 1 }] }
    ]
  },
  'Fm': {
    name: 'Fm',
    root: 'F',
    suffix: 'm',
    positions: [
      { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1, barres: [{ fret: 1, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'Fmaj7': {
    name: 'Fmaj7',
    root: 'F',
    suffix: 'maj7',
    positions: [
      { frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0], baseFret: 1 }
    ]
  },

  // F# / Gb
  'F#': {
    name: 'F#',
    root: 'F#',
    suffix: '',
    positions: [
      { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barres: [{ fret: 2, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'F#m': {
    name: 'F#m',
    root: 'F#',
    suffix: 'm',
    positions: [
      { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barres: [{ fret: 2, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'F#7': {
    name: 'F#7',
    root: 'F#',
    suffix: '7',
    positions: [
      { frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], baseFret: 2, barres: [{ fret: 2, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'F#m7': {
    name: 'F#m7',
    root: 'F#',
    suffix: 'm7',
    positions: [
      { frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1], baseFret: 2, barres: [{ fret: 2, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },

  // G chords
  'G': {
    name: 'G',
    root: 'G',
    suffix: '',
    positions: [
      { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], baseFret: 1 },
      { frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4], baseFret: 1 },
      { frets: [3, 5, 5, 4, 3, 3], fingers: [1, 3, 4, 2, 1, 1], baseFret: 3, barres: [{ fret: 3, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'Gm': {
    name: 'Gm',
    root: 'G',
    suffix: 'm',
    positions: [
      { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3, barres: [{ fret: 3, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'G7': {
    name: 'G7',
    root: 'G',
    suffix: '7',
    positions: [
      { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], baseFret: 1 }
    ]
  },
  'Gsus4': {
    name: 'Gsus4',
    root: 'G',
    suffix: 'sus4',
    positions: [
      { frets: [3, 3, 0, 0, 1, 3], fingers: [2, 3, 0, 0, 1, 4], baseFret: 1 }
    ]
  },

  // G# / Ab
  'G#': {
    name: 'G#',
    root: 'G#',
    suffix: '',
    positions: [
      { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barres: [{ fret: 4, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'G#m': {
    name: 'G#m',
    root: 'G#',
    suffix: 'm',
    positions: [
      { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barres: [{ fret: 4, fromString: 6, toString: 1, finger: 1 }] }
    ]
  }
};

// Aliases for flat notations (e.g. Db -> C#, Eb -> D#, Ab -> G#)
export function normalizeChordName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  // Check if starts with flat note
  if (trimmed.length >= 2 && trimmed[1] === 'b' && trimmed.slice(0, 2) !== 'Bb') {
    const flatRoot = trimmed.slice(0, 2);
    const sharpRoot = FLAT_TO_SHARP[flatRoot];
    if (sharpRoot) {
      return sharpRoot + trimmed.slice(2);
    }
  }
  return trimmed;
}

// Fallback algorithm: Generates barre chord position dynamically if not explicitly in library
export function getOrGenerateChord(chordName: string): ChordDefinition {
  const normalized = normalizeChordName(chordName);
  if (CHORD_LIBRARY[normalized]) {
    return CHORD_LIBRARY[normalized];
  }

  // Parse root and quality
  const match = normalized.match(/^([A-G][#b]?)(.*)$/);
  if (!match) {
    // Return empty fallback
    return {
      name: chordName,
      root: 'C',
      suffix: '',
      positions: [{ frets: [-1, -1, -1, -1, -1, -1], fingers: [0, 0, 0, 0, 0, 0], baseFret: 1 }]
    };
  }

  const [, root, suffix] = match;
  const isMinor = suffix.toLowerCase().startsWith('m') && !suffix.toLowerCase().startsWith('maj');
  const is7th = suffix.includes('7');

  // Find root on 6th string (E)
  const rootIndex = NOTES.indexOf(root);
  const eIndex = NOTES.indexOf('E');
  const fretOnE = (rootIndex - eIndex + 12) % 12;

  // Generate E-shape barre chord
  const baseFret = fretOnE === 0 ? 12 : fretOnE;
  let frets: number[];
  let fingers: number[];

  if (isMinor) {
    if (is7th) {
      frets = [baseFret, baseFret + 2, baseFret, baseFret, baseFret, baseFret];
      fingers = [1, 3, 1, 1, 1, 1];
    } else {
      frets = [baseFret, baseFret + 2, baseFret + 2, baseFret, baseFret, baseFret];
      fingers = [1, 3, 4, 1, 1, 1];
    }
  } else {
    if (is7th) {
      frets = [baseFret, baseFret + 2, baseFret, baseFret + 1, baseFret, baseFret];
      fingers = [1, 3, 1, 2, 1, 1];
    } else {
      frets = [baseFret, baseFret + 2, baseFret + 2, baseFret + 1, baseFret, baseFret];
      fingers = [1, 3, 4, 2, 1, 1];
    }
  }

  return {
    name: chordName,
    root,
    suffix,
    positions: [
      {
        frets,
        fingers,
        baseFret: Math.max(1, baseFret),
        barres: [{ fret: baseFret, fromString: 6, toString: 1, finger: 1 }]
      }
    ]
  };
}

// Get pitch note name for string and fret
export function getNoteAtFret(stringIdx: number, fret: number): string {
  const openNote = OPEN_STRING_NOTES[stringIdx];
  const openIdx = NOTES.indexOf(openNote);
  const noteIdx = (openIdx + fret) % 12;
  return NOTES[noteIdx];
}
