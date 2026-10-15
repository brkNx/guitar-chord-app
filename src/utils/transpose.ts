import { NOTES, normalizeChordName } from '../data/chordLibrary';

// Transpose a single chord name by semitones delta (-11 to +11)
export function transposeChord(chord: string, semitones: number): string {
  if (!chord || semitones === 0) return chord;

  const normalized = normalizeChordName(chord);
  const match = normalized.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const [, root, suffix] = match;
  let idx = NOTES.indexOf(root);
  if (idx === -1) return chord;

  idx = (idx + semitones) % 12;
  if (idx < 0) idx += 12;

  const newRoot = NOTES[idx];
  return newRoot + suffix;
}

// Calculate sounding key when Capo is applied
export function getCapoSoundingKey(originalKey: string, capoFret: number): string {
  if (!originalKey || capoFret === 0) return originalKey;
  return transposeChord(originalKey, capoFret);
}
