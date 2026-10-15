import type { ParsedLine, SongSegment } from '../types/guitar';
import { transposeChord } from './transpose';

// Regex to test if a token looks like a guitar chord
const CHORD_REGEX = /^[A-G][#b]?(m|maj|min|dim|aug|sus[24]|add[9]|7|9|11|13|m7|maj7|m7b5)?(\/[A-G][#b]?)?$/;

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

// Convert plain two-line tab (chord line followed by lyric line) into ChordPro format
export function convertTwoLineToChordPro(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    const next = lines[i + 1];

    if (isChordLine(current) && next !== undefined && !isChordLine(next) && next.trim().length > 0) {
      // Merge chord line with next lyric line based on character positions
      let merged = '';
      let lyricIdx = 0;

      // Extract chords and their string indices in current line
      const regex = /\S+/g;
      let match;
      const chords: { chord: string; index: number }[] = [];
      while ((match = regex.exec(current)) !== null) {
        chords.push({ chord: match[0], index: match.index });
      }

      for (const item of chords) {
        // Append lyrics up to this chord's position
        if (item.index > lyricIdx) {
          merged += next.slice(lyricIdx, item.index);
          lyricIdx = item.index;
        }
        merged += `[${item.chord}]`;
      }

      // Append remaining lyrics
      if (lyricIdx < next.length) {
        merged += next.slice(lyricIdx);
      }

      result.push(merged);
      i++; // Skip next lyric line since it's merged
    } else {
      result.push(current);
    }
  }

  return result.join('\n');
}

// Parse ChordPro string into structured lines with optional transposition
export function parseChordPro(chordProContent: string, transposeOffset = 0): ParsedLine[] {
  // First normalize if it looks like raw two-line text
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

    // Section headers like {comment: Nakarat} or [Nakarat] or [Chorus]
    const commentMatch = trimmed.match(/^\{(?:comment|c|sov|eov|soc|eoc|start_of_chorus|end_of_chorus):\s*(.*?)\}$/i);
    const bracketHeaderMatch = trimmed.match(/^\[(Nakarat|Chorus|Kıta|Verse|Intro|Outro|Köprü|Bridge|Solo|Bölüm\s*\d*|\d+)\]$/i);

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

    // Metadata like {title: ...} or {artist: ...}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      continue;
    }

    // Line with chords and lyrics [Am]Hello [C]World
    if (rawLine.includes('[')) {
      const segments: SongSegment[] = [];
      const parts = rawLine.split(/(\[[^\]]+\])/);

      let currentChord = '';

      for (const part of parts) {
        if (!part) continue;

        if (part.startsWith('[') && part.endsWith(']')) {
          let chordName = part.slice(1, -1).trim();
          if (transposeOffset !== 0) {
            chordName = transposeChord(chordName, transposeOffset);
          }
          currentChord = chordName;
        } else {
          segments.push({
            chord: currentChord,
            lyric: part
          });
          currentChord = ''; // Reset after associating with lyric
        }
      }

      // Trailing chord without lyrics
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
      // Plain lyric line without chords
      parsedLines.push({
        type: 'chord-lyric',
        segments: [{ chord: '', lyric: rawLine }]
      });
    }
  }

  return parsedLines;
}

// Extract unique list of chords used in a song
export function extractUniqueChords(chordProContent: string, transposeOffset = 0): string[] {
  const chords = new Set<string>();
  const matches = chordProContent.match(/\[([^\]]+)\]/g);

  if (matches) {
    for (const m of matches) {
      let chord = m.slice(1, -1).trim();
      if (isChordToken(chord)) {
        if (transposeOffset !== 0) {
          chord = transposeChord(chord, transposeOffset);
        }
        chords.add(chord);
      }
    }
  }

  return Array.from(chords);
}
