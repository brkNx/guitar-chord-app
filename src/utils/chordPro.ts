import type { ParsedLine, SongSegment } from '../types/guitar';
import { transposeChord } from './transpose';

// Comprehensive regex to validate guitar chord tokens (including 7sus4, add9, slash chords, etc.)
const CHORD_REGEX = /^[A-G][#b]?(m|min|maj|dim|aug|sus[24]?|7sus[24]|add[249]|maj[79]|m7b5|dim7|aug7|[m]?[679]|11|13|5)?(\/[A-G][#b]?)?$/;

export function isChordToken(token: string): boolean {
  if (!token) return false;
  const clean = token.replace(/[()[\],]/g, '').trim();
  return CHORD_REGEX.test(clean);
}

// Check if a line consists predominantly of chords
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  const chordCount = tokens.filter(isChordToken).length;
  return chordCount / tokens.length >= 0.6;
}

// Convert plain two-line tab into clean ChordPro format
export function convertTwoLineToChordPro(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    const next = lines[i + 1];

    if (isChordLine(current) && next !== undefined && !isChordLine(next) && next.trim().length > 0) {
      let merged = '';
      let lyricIdx = 0;

      const regex = /\S+/g;
      let match;
      const chords: { chord: string; index: number }[] = [];
      while ((match = regex.exec(current)) !== null) {
        chords.push({ chord: match[0], index: match.index });
      }

      for (const item of chords) {
        if (item.index > lyricIdx) {
          merged += next.slice(lyricIdx, item.index);
          lyricIdx = item.index;
        }
        merged += `[${item.chord}]`;
      }

      if (lyricIdx < next.length) {
        merged += next.slice(lyricIdx);
      }

      result.push(merged);
      i++; // Skip merged lyric line
    } else {
      result.push(current);
    }
  }

  return result.join('\n');
}

/**
 * Robust ChordPro parser with:
 * - Word boundary preservation
 * - Adjacent chord spacing
 * - Fault tolerance against unclosed brackets
 */
export function parseChordPro(chordProContent: string, transposeOffset = 0, targetKey = ''): ParsedLine[] {
  if (!chordProContent) return [];

  // Convert raw two-line tab if needed
  let content = chordProContent;
  if (!content.includes('[') && content.split('\n').some(isChordLine)) {
    content = convertTwoLineToChordPro(content);
  }

  const lines = content.split('\n');
  const parsedLines: ParsedLine[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      parsedLines.push({ type: 'empty' });
      continue;
    }

    // Section headers like {comment: Nakarat} or {c: Chorus} or [Nakarat]
    const commentMatch = trimmed.match(/^\{(?:comment|c|sov|eov|soc|eoc|start_of_chorus|end_of_chorus):\s*(.*?)\}$/i);
    const bracketHeaderMatch = trimmed.match(/^\[(Nakarat|Chorus|Kıta|Verse|Intro|Giriş|Outro|Çıkış|Köprü|Bridge|Solo|Bölüm\s*\d*|\d+)\]$/i);

    if (commentMatch) {
      parsedLines.push({
        type: 'section',
        sectionName: commentMatch[1] || 'Bölüm'
      });
      continue;
    }

    if (bracketHeaderMatch) {
      parsedLines.push({
        type: 'section',
        sectionName: bracketHeaderMatch[1]
      });
      continue;
    }

    // Metadata lines like {title: ...} or {key: ...}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      continue;
    }

    // Line with chords and lyrics
    if (rawLine.includes('[')) {
      const segments: SongSegment[] = [];

      // Safe regex matching balanced [Chord] tokens or plain text
      const regex = /\[([^\]]+)\]|([^[]+)/g;
      let match: RegExpExecArray | null;
      let currentChord = '';

      while ((match = regex.exec(rawLine)) !== null) {
        if (match[1] !== undefined) {
          // Chord token
          let chordName = match[1].trim();
          if (transposeOffset !== 0) {
            chordName = transposeChord(chordName, transposeOffset, targetKey);
          }

          if (currentChord) {
            // Adjacent consecutive chord without lyrics between them (e.g. [Em][C])
            segments.push({
              chord: currentChord,
              lyric: '    ' // Visual rhythmic spacing
            });
          }
          currentChord = chordName;
        } else if (match[2] !== undefined) {
          // Lyric text
          const lyricText = match[2];
          segments.push({
            chord: currentChord,
            lyric: lyricText
          });
          currentChord = '';
        }
      }

      // Trailing chord at the very end of the line
      if (currentChord) {
        segments.push({
          chord: currentChord,
          lyric: ' '
        });
      }

      parsedLines.push({
        type: 'chord-lyric',
        segments
      });
    } else {
      // Plain lyric line
      parsedLines.push({
        type: 'chord-lyric',
        segments: [{ chord: '', lyric: rawLine }]
      });
    }
  }

  return parsedLines;
}

// Extract unique list of chords in a song
export function extractUniqueChords(chordProContent: string, transposeOffset = 0, targetKey = ''): string[] {
  if (!chordProContent) return [];
  const chords = new Set<string>();
  const matches = chordProContent.match(/\[([^\]]+)\]/g);

  if (matches) {
    for (const m of matches) {
      let chord = m.slice(1, -1).trim();
      // Ignore section headers that were bracketed like [Nakarat]
      const isHeader = /^(Nakarat|Chorus|Kıta|Verse|Intro|Giriş|Outro|Çıkış|Köprü|Bridge|Solo)$/i.test(chord);
      if (!isHeader && isChordToken(chord)) {
        if (transposeOffset !== 0) {
          chord = transposeChord(chord, transposeOffset, targetKey);
        }
        chords.add(chord);
      }
    }
  }

  return Array.from(chords);
}
