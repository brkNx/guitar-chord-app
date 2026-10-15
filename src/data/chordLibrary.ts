import type { ChordDefinition, ChordPosition } from '../types/guitar';
import { SHARP_NOTES, FLAT_NOTES, noteToIndex } from '../utils/transpose';

export const NOTES = SHARP_NOTES;

// Open string notes in Standard Tuning: Strings 6 (Low E) to 1 (High e)
export const OPEN_STRING_NOTES = ['E', 'A', 'D', 'G', 'B', 'E'];

// Comprehensive multi-voicing chord library (Open, Barre E-Shape, Barre A-Shape)
export const CHORD_LIBRARY: Record<string, ChordDefinition> = {
  // A CHORDS
  'A': {
    name: 'A',
    root: 'A',
    suffix: '',
    positions: [
      { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 },
      { frets: [5, 7, 7, 6, 5, 5], fingers: [1, 3, 4, 2, 1, 1], baseFret: 5, barres: [{ fret: 5, fromString: 6, toString: 1, finger: 1 }] },
      { frets: [-1, 12, 14, 14, 14, 12], fingers: [0, 1, 2, 3, 4, 1], baseFret: 12, barres: [{ fret: 12, fromString: 5, toString: 1, finger: 1 }] }
    ]
  },
  'Am': {
    name: 'Am',
    root: 'A',
    suffix: 'm',
    positions: [
      { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], baseFret: 1 },
      { frets: [5, 7, 7, 5, 5, 5], fingers: [1, 3, 4, 1, 1, 1], baseFret: 5, barres: [{ fret: 5, fromString: 6, toString: 1, finger: 1 }] },
      { frets: [-1, 12, 14, 14, 13, 12], fingers: [0, 1, 3, 4, 2, 1], baseFret: 12, barres: [{ fret: 12, fromString: 5, toString: 1, finger: 1 }] }
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
      { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0], baseFret: 1 },
      { frets: [5, 7, 6, 6, 5, 5], fingers: [1, 4, 2, 3, 1, 1], baseFret: 5, barres: [{ fret: 5, fromString: 6, toString: 1, finger: 1 }] }
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

  // B CHORDS
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
      { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], baseFret: 1 },
      { frets: [7, 9, 7, 8, 7, 7], fingers: [1, 3, 1, 2, 1, 1], baseFret: 7, barres: [{ fret: 7, fromString: 6, toString: 1, finger: 1 }] }
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

  // Bb / A# CHORDS
  'Bb': {
    name: 'Bb',
    root: 'Bb',
    suffix: '',
    positions: [
      { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barres: [{ fret: 1, fromString: 5, toString: 1, finger: 1 }] },
      { frets: [6, 8, 8, 7, 6, 6], fingers: [1, 3, 4, 2, 1, 1], baseFret: 6, barres: [{ fret: 6, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'Bbm': {
    name: 'Bbm',
    root: 'Bb',
    suffix: 'm',
    positions: [
      { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [{ fret: 1, fromString: 5, toString: 1, finger: 1 }] },
      { frets: [6, 8, 8, 6, 6, 6], fingers: [1, 3, 4, 1, 1, 1], baseFret: 6, barres: [{ fret: 6, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },

  // C CHORDS
  'C': {
    name: 'C',
    root: 'C',
    suffix: '',
    positions: [
      { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 },
      { frets: [8, 10, 10, 9, 8, 8], fingers: [1, 3, 4, 2, 1, 1], baseFret: 8, barres: [{ fret: 8, fromString: 6, toString: 1, finger: 1 }] },
      { frets: [-1, 3, 5, 5, 5, 3], fingers: [0, 1, 2, 3, 4, 1], baseFret: 3, barres: [{ fret: 3, fromString: 5, toString: 1, finger: 1 }] }
    ]
  },
  'Cm': {
    name: 'Cm',
    root: 'C',
    suffix: 'm',
    positions: [
      { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3, barres: [{ fret: 3, fromString: 5, toString: 1, finger: 1 }] },
      { frets: [8, 10, 10, 8, 8, 8], fingers: [1, 3, 4, 1, 1, 1], baseFret: 8, barres: [{ fret: 8, fromString: 6, toString: 1, finger: 1 }] }
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

  // C# / Db CHORDS
  'C#': {
    name: 'C#',
    root: 'C#',
    suffix: '',
    positions: [
      { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], baseFret: 4, barres: [{ fret: 4, fromString: 5, toString: 1, finger: 1 }] },
      { frets: [9, 11, 11, 10, 9, 9], fingers: [1, 3, 4, 2, 1, 1], baseFret: 9, barres: [{ fret: 9, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'C#m': {
    name: 'C#m',
    root: 'C#',
    suffix: 'm',
    positions: [
      { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barres: [{ fret: 4, fromString: 5, toString: 1, finger: 1 }] },
      { frets: [9, 11, 11, 9, 9, 9], fingers: [1, 3, 4, 1, 1, 1], baseFret: 9, barres: [{ fret: 9, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },

  // D CHORDS
  'D': {
    name: 'D',
    root: 'D',
    suffix: '',
    positions: [
      { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], baseFret: 1 },
      { frets: [-1, 5, 7, 7, 7, 5], fingers: [0, 1, 2, 3, 4, 1], baseFret: 5, barres: [{ fret: 5, fromString: 5, toString: 1, finger: 1 }] },
      { frets: [10, 12, 12, 11, 10, 10], fingers: [1, 3, 4, 2, 1, 1], baseFret: 10, barres: [{ fret: 10, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },
  'Dm': {
    name: 'Dm',
    root: 'D',
    suffix: 'm',
    positions: [
      { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], baseFret: 1 },
      { frets: [-1, 5, 7, 7, 6, 5], fingers: [0, 1, 3, 4, 2, 1], baseFret: 5, barres: [{ fret: 5, fromString: 5, toString: 1, finger: 1 }] }
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

  // E CHORDS
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

  // F CHORDS
  'F': {
    name: 'F',
    root: 'F',
    suffix: '',
    positions: [
      { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barres: [{ fret: 1, fromString: 6, toString: 1, finger: 1 }] },
      { frets: [-1, -1, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], baseFret: 1, barres: [{ fret: 1, fromString: 2, toString: 1, finger: 1 }] },
      { frets: [-1, 8, 10, 10, 10, 8], fingers: [0, 1, 2, 3, 4, 1], baseFret: 8, barres: [{ fret: 8, fromString: 5, toString: 1, finger: 1 }] }
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
      { frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0], baseFret: 1 },
      { frets: [1, 3, 2, 2, 1, 1], fingers: [1, 4, 2, 3, 1, 1], baseFret: 1, barres: [{ fret: 1, fromString: 6, toString: 1, finger: 1 }] }
    ]
  },

  // F# / Gb CHORDS
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
      { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barres: [{ fret: 2, fromString: 6, toString: 1, finger: 1 }] },
      { frets: [-1, 9, 11, 11, 10, 9], fingers: [0, 1, 3, 4, 2, 1], baseFret: 9, barres: [{ fret: 9, fromString: 5, toString: 1, finger: 1 }] }
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

  // G CHORDS
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

  // G# / Ab CHORDS
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

/**
 * Normalizes chord representation (e.g. Ab -> G#, Db -> C#)
 */
export function normalizeChordName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  const match = trimmed.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return trimmed;

  const [, root, suffix] = match;
  // If root is flat (e.g. Db -> C#) and not in library, try sharp equivalent
  if (root.includes('b')) {
    const idx = noteToIndex(root);
    if (idx !== -1) {
      const sharpRoot = SHARP_NOTES[idx];
      const candidate = `${sharpRoot}${suffix}`;
      if (CHORD_LIBRARY[candidate]) return candidate;
    }
  }
  return trimmed;
}

/**
 * Algorithmic Dynamic Chord Voicing Solver
 * If a chord is not in CHORD_LIBRARY, computes valid guitar fingering
 * using movable barre forms (E-form, A-form) or slash chord logic.
 */
export function getOrGenerateChord(chordName: string): ChordDefinition {
  const normalized = normalizeChordName(chordName);
  if (CHORD_LIBRARY[normalized]) {
    return CHORD_LIBRARY[normalized];
  }
  if (CHORD_LIBRARY[chordName]) {
    return CHORD_LIBRARY[chordName];
  }

  // Handle Slash chords (e.g. C/G, D/F#)
  if (chordName.includes('/')) {
    const [baseName, bassNote] = chordName.split('/');
    const baseChord = getOrGenerateChord(baseName);
    const bassIdx = noteToIndex(bassNote);

    if (baseChord.positions.length > 0 && bassIdx !== -1) {
      // Find lowest string (6 or 5) that can sound this bass note
      const openE = noteToIndex('E');
      const fretOn6 = ((bassIdx - openE) % 12 + 12) % 12;

      const primaryPos = { ...baseChord.positions[0] };
      const newFrets = [...primaryPos.frets];
      const newFingers = [...primaryPos.fingers];

      newFrets[0] = fretOn6;
      newFingers[0] = 1;

      return {
        name: chordName,
        root: baseChord.root,
        suffix: `/${bassNote}`,
        positions: [
          {
            frets: newFrets,
            fingers: newFingers,
            baseFret: Math.max(1, Math.min(...newFrets.filter(f => f > 0)))
          },
          ...baseChord.positions
        ]
      };
    }
  }

  // Parse root and quality
  const match = normalized.match(/^([A-G][#b]?)(.*)$/);
  if (!match) {
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
  const isMaj7 = suffix.includes('maj7');
  const isSus4 = suffix.includes('sus4');

  const rootIndex = noteToIndex(root);
  const eIndex = noteToIndex('E');
  const aIndex = noteToIndex('A');

  const fretOnE = ((rootIndex - eIndex) % 12 + 12) % 12;
  const fretOnA = ((rootIndex - aIndex) % 12 + 12) % 12;

  const positions: ChordPosition[] = [];

  // Voicing 1: E-Shape Barre on 6th string
  const baseE = fretOnE === 0 ? 12 : fretOnE;
  let fretsE: number[];
  let fingersE: number[];

  if (isMinor) {
    if (is7th) {
      fretsE = [baseE, baseE + 2, baseE, baseE, baseE, baseE];
      fingersE = [1, 3, 1, 1, 1, 1];
    } else {
      fretsE = [baseE, baseE + 2, baseE + 2, baseE, baseE, baseE];
      fingersE = [1, 3, 4, 1, 1, 1];
    }
  } else if (isMaj7) {
    fretsE = [baseE, baseE + 2, baseE + 1, baseE + 1, baseE, baseE];
    fingersE = [1, 4, 2, 3, 1, 1];
  } else if (is7th) {
    fretsE = [baseE, baseE + 2, baseE, baseE + 1, baseE, baseE];
    fingersE = [1, 3, 1, 2, 1, 1];
  } else if (isSus4) {
    fretsE = [baseE, baseE + 2, baseE + 2, baseE + 2, baseE, baseE];
    fingersE = [1, 2, 3, 4, 1, 1];
  } else {
    fretsE = [baseE, baseE + 2, baseE + 2, baseE + 1, baseE, baseE];
    fingersE = [1, 3, 4, 2, 1, 1];
  }

  positions.push({
    frets: fretsE,
    fingers: fingersE,
    baseFret: baseE,
    barres: [{ fret: baseE, fromString: 6, toString: 1, finger: 1 }]
  });

  // Voicing 2: A-Shape Barre on 5th string (if fret <= 12)
  const baseA = fretOnA === 0 ? 12 : fretOnA;
  if (baseA <= 12) {
    let fretsA: number[];
    let fingersA: number[];

    if (isMinor) {
      fretsA = [-1, baseA, baseA + 2, baseA + 2, baseA + 1, baseA];
      fingersA = [0, 1, 3, 4, 2, 1];
    } else {
      fretsA = [-1, baseA, baseA + 2, baseA + 2, baseA + 2, baseA];
      fingersA = [0, 1, 2, 3, 4, 1];
    }

    positions.push({
      frets: fretsA,
      fingers: fingersA,
      baseFret: baseA,
      barres: [{ fret: baseA, fromString: 5, toString: 1, finger: 1 }]
    });
  }

  return {
    name: chordName,
    root,
    suffix,
    positions
  };
}

/**
 * Get note name for string and fret
 */
export function getNoteAtFret(stringIdx: number, fret: number, preferFlats = false): string {
  const openNote = OPEN_STRING_NOTES[stringIdx];
  const openIdx = noteToIndex(openNote);
  const noteIdx = (openIdx + fret) % 12;
  return preferFlats ? FLAT_NOTES[noteIdx] : SHARP_NOTES[noteIdx];
}
