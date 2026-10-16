import { NOTES } from './chordLibrary';
import { extractRootNote } from './scales';

export interface CagedBoxDefinition {
  id: string; // 'all' | 'box1' | 'box2' | 'box3' | 'box4' | 'box5'
  number: number; // 0 for all, 1..5
  name: string; // 'Kutu 1 (E/C Şekli)'
  rootShape: string; // 'C', 'A', 'G', 'E', 'D'
  description: string;
}

export const CAGED_BOXES: CagedBoxDefinition[] = [
  {
    id: 'all',
    number: 0,
    name: 'Tüm Sap (0 - 15. Perde)',
    rootShape: 'Tümü',
    description: 'Tüm klavye boyunca gamın ve aralıkların tam haritası.'
  },
  {
    id: 'box1',
    number: 1,
    name: 'Kutu 1 (Shape 1)',
    rootShape: 'E',
    description: 'En popüler solo kutusu. 6. teldeki kök notadan başlar.'
  },
  {
    id: 'box2',
    number: 2,
    name: 'Kutu 2 (Shape 2)',
    rootShape: 'D',
    description: 'Kutu 1’in tiz tarafına bağlanan akıcı solo geçiş bölgesi.'
  },
  {
    id: 'box3',
    number: 3,
    name: 'Kutu 3 (Shape 3)',
    rootShape: 'C',
    description: '5. ve 3. tel kök notalarıyla karakterize edilen orta klavye kutusu.'
  },
  {
    id: 'box4',
    number: 4,
    name: 'Kutu 4 (Shape 4)',
    rootShape: 'A',
    description: '4. teldeki kök nota etrafında şekillenen zengin arpej bölgesi.'
  },
  {
    id: 'box5',
    number: 5,
    name: 'Kutu 5 (Shape 5)',
    rootShape: 'G',
    description: 'Kutu 1’e geri bağlanan geniş bas ve orta tel bloğu.'
  }
];

/**
 * Calculates fret position for root on 6th string (E)
 */
export function getRootFretOnLowE(root: string): number {
  const clean = extractRootNote(root);
  const rootIdx = NOTES.indexOf(clean);
  const lowEIdx = NOTES.indexOf('E'); // 4
  let fret = (rootIdx - lowEIdx + 12) % 12;
  // If fret is 0, offer 0 or 12
  return fret;
}

/**
 * Returns the active fret range [minFret, maxFret] for a given CAGED box and root note.
 */
export function getCagedBoxFretRange(
  root: string,
  boxNumber: number
): { minFret: number; maxFret: number; label: string } {
  if (boxNumber === 0) {
    return { minFret: 0, maxFret: 15, label: '0 - 15. Perde (Tüm Sap)' };
  }

  const rootFret6 = getRootFretOnLowE(root);
  // Reference offsets relative to 6th string root (Box 1 spans [rootFret, rootFret + 3])
  let baseFret = 0;

  switch (boxNumber) {
    case 1:
      baseFret = rootFret6;
      break;
    case 2:
      baseFret = rootFret6 + 2;
      break;
    case 3:
      baseFret = rootFret6 + 5;
      break;
    case 4:
      baseFret = rootFret6 + 7;
      break;
    case 5:
      baseFret = rootFret6 + 9;
      break;
    default:
      baseFret = rootFret6;
  }

  // Normalize into standard 0..14 guitar display range
  let minFret = baseFret;
  if (minFret >= 12) minFret -= 12;
  if (minFret < 0) minFret += 12;

  let maxFret = minFret + (boxNumber === 1 || boxNumber === 3 ? 3 : 4);
  if (maxFret > 14) maxFret = 14;

  return {
    minFret,
    maxFret,
    label: `${minFret}. - ${maxFret}. Perde`
  };
}

/**
 * Interval color coding synthesized from fretShapes UI:
 * - Root: High-contrast Amber (#f59e0b) with gold crown
 * - 3rd (b3 / 3): Electric Sky Blue (#38bdf8)
 * - 4th: Slate / Cool Silver (#94a3b8)
 * - b5 (Blue note): Deep Purple / Violet (#a855f7)
 * - 5th: Luminous Teal (#14b8a6)
 * - 6th (b6 / 6): Warm Rose (#f43f5e)
 * - 7th (b7 / 7): High-Voltage Emerald Green (#10b981)
 */
export function getFretShapesIntervalStyle(degree: string): {
  fill: string;
  stroke: string;
  text: string;
  badge: string;
  isRoot: boolean;
} {
  const isRoot = degree === 'R' || degree === '1';
  if (isRoot) {
    return {
      fill: '#f59e0b',
      stroke: '#fbbf24',
      text: '#090a0f',
      badge: 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.8)]',
      isRoot: true
    };
  }

  if (degree === 'b3' || degree === '3') {
    return {
      fill: '#38bdf8',
      stroke: '#7dd3fc',
      text: '#090a0f',
      badge: 'bg-sky-400 text-slate-950 border-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.6)]',
      isRoot: false
    };
  }

  if (degree === 'b5' || degree === '#4') {
    return {
      fill: '#a855f7',
      stroke: '#c084fc',
      text: '#ffffff',
      badge: 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.7)]',
      isRoot: false
    };
  }

  if (degree === '5') {
    return {
      fill: '#14b8a6',
      stroke: '#5eead4',
      text: '#090a0f',
      badge: 'bg-teal-400 text-slate-950 border-teal-300 shadow-[0_0_8px_rgba(20,184,166,0.6)]',
      isRoot: false
    };
  }

  if (degree === 'b7' || degree === '7') {
    return {
      fill: '#10b981',
      stroke: '#34d399',
      text: '#090a0f',
      badge: 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
      isRoot: false
    };
  }

  if (degree === 'b6' || degree === '6') {
    return {
      fill: '#f43f5e',
      stroke: '#fb7185',
      text: '#ffffff',
      badge: 'bg-rose-500 text-white border-rose-300',
      isRoot: false
    };
  }

  // 2nd / 4th or other extensions
  return {
    fill: '#94a3b8',
    stroke: '#cbd5e1',
    text: '#090a0f',
    badge: 'bg-slate-400 text-slate-950 border-slate-300',
    isRoot: false
  };
}
