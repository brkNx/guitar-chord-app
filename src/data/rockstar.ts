// RockStar Learn Guitar Chords Color Coding Palette & Finger Placement Definitions

export interface RockStarFingerStyle {
  bg: string;
  text: string;
  label: string;
  nameTr: string;
}

export const ROCKSTAR_FINGERS: Record<number, RockStarFingerStyle> = {
  1: { bg: '#0284c7', text: '#ffffff', label: '1', nameTr: 'İşaret Parmağı' }, // Cyan / Sky Blue
  2: { bg: '#059669', text: '#ffffff', label: '2', nameTr: 'Orta Parmak' },     // Emerald Green
  3: { bg: '#d97706', text: '#ffffff', label: '3', nameTr: 'Yüzük Parmağı' },   // Amber Orange
  4: { bg: '#e11d48', text: '#ffffff', label: '4', nameTr: 'Serçe Parmak' },    // Rose Pink
  5: { bg: '#475569', text: '#ffffff', label: 'T', nameTr: 'Başparmak' }        // Slate
};
