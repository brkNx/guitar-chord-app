import { NOTES, normalizeChordName, getNoteAtFret } from '../data/chordLibrary';
import type { ChordPosition } from '../types/guitar';

export interface ChordTone {
  degree: string;
  intervalName: string;
  semitones: number;
  note: string;
  role: string;
  isRoot: boolean;
}

export interface StringAnalysis {
  stringIdx: number; // 0 (Low E) to 5 (High E)
  stringNumber: number; // 6 to 1
  stringName: string;
  openNote: string;
  fret: number; // -1 for mute, 0 for open, >0 for fret
  note: string;
  degree: string;
  finger: number;
  fingerName: string;
  status: 'muted' | 'open' | 'fretted';
}

export interface ChordTheoryDetails {
  chordName: string;
  root: string;
  suffix: string;
  fullName: string;
  typeCategory: string;
  formula: string;
  tones: ChordTone[];
  mood: string;
  stringsAnalysis: StringAnalysis[];
}

const DEGREE_INFO: Record<number, { degree: string; name: string; role: string }> = {
  0: { degree: '1', name: 'Kök Ses (Root)', role: 'Akorun temel kimliğini belirleyen ana ses' },
  1: { degree: 'b2', name: 'Küçük İkili', role: 'Dissonant, egzotik gerilim' },
  2: { degree: '2', name: 'Büyük İkili / 9’lu', role: 'Açık, havadar ve akıcı renk' },
  3: { degree: 'b3', name: 'Küçük Üçlü (Minör 3)', role: 'Hüzünlü, duygusal minör karakteri' },
  4: { degree: '3', name: 'Büyük Üçlü (Majör 3)', role: 'Aydınlık, neşeli majör karakteri' },
  5: { degree: '4', name: 'Tam Dörtlü (Sus4)', role: 'Çözülme bekleyen askıda gerilim' },
  6: { degree: 'b5', name: 'Eksik Beşli (Tritone)', role: 'Blues & caz gerilim sesi' },
  7: { degree: '5', name: 'Tam Beşli (Perfect 5th)', role: 'Güçlü, kararlı ve gövdeli temel uyum' },
  8: { degree: '#5 / b6', name: 'Artık Beşli / Küçük Altılı', role: 'Mistik ve sürrealist ton' },
  9: { degree: '6', name: 'Büyük Altılı (6th)', role: 'Sıcak, cazip ve nostaljik tını' },
  10: { degree: 'b7', name: 'Küçük Yedili (Dominant 7)', role: 'Blues, funk ve çözülüm çekimi' },
  11: { degree: '7', name: 'Büyük Yedili (Maj7)', role: 'Rüya gibi, lüks ve dinlendirici akor rengi' }
};

const CHORD_FORMULAS: Record<
  string,
  {
    category: string;
    intervals: number[];
    fullName: string;
    mood: string;
  }
> = {
  '': {
    category: 'Majör Triad',
    intervals: [0, 4, 7],
    fullName: 'Majör Akoru',
    mood: 'Parlak, kararlı, neşeli ve aydınlık.'
  },
  'm': {
    category: 'Minör Triad',
    intervals: [0, 3, 7],
    fullName: 'Doğal Minör Akoru',
    mood: 'Duygusal, içe dönük, hüzünlü ve derin.'
  },
  '7': {
    category: 'Dominant Yedili',
    intervals: [0, 4, 7, 10],
    fullName: 'Dominant 7’li Akor',
    mood: 'Blues ve rock çekimi, bir sonraki akora çözülme arzusu taşır.'
  },
  'm7': {
    category: 'Minör Yedili',
    intervals: [0, 3, 7, 10],
    fullName: 'Minör 7’li Akor',
    mood: 'Sakin, cazımsı, baladlar ve modern akustik parçalar için kusursuz.'
  },
  'maj7': {
    category: 'Majör Yedili',
    intervals: [0, 4, 7, 11],
    fullName: 'Büyük Majör 7’li Akor',
    mood: 'Rüya gibi, sofistike, nostaljik ve dingin tını.'
  },
  'sus4': {
    category: 'Askıda Dörtlü (Suspended)',
    intervals: [0, 5, 7],
    fullName: 'Gecikmeli 4’lü (Sus4)',
    mood: 'Üçlüsü olmayan, majöre çözülmeyi bekleyen havadar gerilim.'
  },
  'sus2': {
    category: 'Askıda İkili (Suspended)',
    intervals: [0, 2, 7],
    fullName: 'Gecikmeli 2’li (Sus2)',
    mood: 'Açık, akıcı, modern pop ve akustik ritimlerde sıkça parlayan ses.'
  },
  'add9': {
    category: 'Dokuzlu Eklemeli',
    intervals: [0, 4, 7, 2], // 14 % 12 = 2
    fullName: 'Majör Add9 Akoru',
    mood: 'Geniş, zengin ve modern stüdyo prodüksiyonu hissi veren akor.'
  },
  'dim': {
    category: 'Eksilmiş (Diminished)',
    intervals: [0, 3, 6],
    fullName: 'Eksilmiş Triad',
    mood: 'Karanlık, gizemli ve gerilim dolu geçiş akoru.'
  },
  'dim7': {
    category: 'Tam Eksilmiş 7’li',
    intervals: [0, 3, 6, 9],
    fullName: 'Eksilmiş 7’li Akor',
    mood: 'Dramatik, gerilimli ve sinematik geçiş.'
  },
  'aug': {
    category: 'Artırılmış (Augmented)',
    intervals: [0, 4, 8],
    fullName: 'Artırılmış Triad',
    mood: 'Beklenti dolu, asılı kalan ve sürpriz çözülümlü renk.'
  },
  '5': {
    category: 'Power Chord (Beşli)',
    intervals: [0, 7],
    fullName: 'Power Chord',
    mood: 'Güçlü, saf ve distorsiyon dostu ham rock gücü.'
  }
};

const STRING_LABELS = [
  '6. Tel (Kalın E)',
  '5. Tel (A)',
  '4. Tel (D)',
  '3. Tel (G)',
  '2. Tel (B)',
  '1. Tel (İnce E)'
];

const FINGER_NAMES: Record<number, string> = {
  0: 'Boş Tel',
  1: 'İşaret (1)',
  2: 'Orta (2)',
  3: 'Yüzük (3)',
  4: 'Serçe (4)',
  5: 'Başparmak (T)'
};

export function getChordTheoryDetails(
  chordName: string,
  position?: ChordPosition
): ChordTheoryDetails {
  const normalized = normalizeChordName(chordName);
  const match = normalized.match(/^([A-G][#b]?)(.*)$/);

  let root = 'A';
  let suffix = 'm';

  if (match) {
    root = match[1];
    suffix = match[2];
  }

  // Look up formula or fallback
  const formulaInfo =
    CHORD_FORMULAS[suffix] ||
    (suffix.toLowerCase().startsWith('m') ? CHORD_FORMULAS['m'] : CHORD_FORMULAS['']);

  const rootIdx = NOTES.indexOf(root);
  const safeRootIdx = rootIdx >= 0 ? rootIdx : 0;

  // Build tones
  const tones: ChordTone[] = formulaInfo.intervals.map((semitones, idx) => {
    const noteIdx = (safeRootIdx + semitones) % 12;
    const note = NOTES[noteIdx];
    const info = DEGREE_INFO[semitones % 12] || {
      degree: `${idx + 1}`,
      name: `Derece ${idx + 1}`,
      role: 'Uyumlu ses'
    };

    return {
      degree: info.degree,
      intervalName: info.name,
      semitones,
      note,
      role: info.role,
      isRoot: semitones === 0
    };
  });

  const formulaStr = tones.map((t) => t.degree).join(' - ');

  // String analysis if position provided
  const stringsAnalysis: StringAnalysis[] = [];
  if (position && position.frets) {
    for (let strIdx = 0; strIdx < 6; strIdx++) {
      const fret = position.frets[strIdx];
      const finger = position.fingers ? position.fingers[strIdx] : 0;
      const openNote = getNoteAtFret(strIdx, 0);

      if (fret === -1) {
        stringsAnalysis.push({
          stringIdx: strIdx,
          stringNumber: 6 - strIdx,
          stringName: STRING_LABELS[strIdx],
          openNote,
          fret: -1,
          note: '✕',
          degree: 'Susturulur',
          finger: 0,
          fingerName: 'Çalınmaz',
          status: 'muted'
        });
      } else {
        const note = getNoteAtFret(strIdx, fret);
        const noteIdx = NOTES.indexOf(note);
        const semitoneFromRoot = (noteIdx - safeRootIdx + 12) % 12;
        const toneMatch = tones.find((t) => t.note === note);
        const degree = toneMatch
          ? toneMatch.degree
          : DEGREE_INFO[semitoneFromRoot]?.degree || 'Uyum';

        stringsAnalysis.push({
          stringIdx: strIdx,
          stringNumber: 6 - strIdx,
          stringName: STRING_LABELS[strIdx],
          openNote,
          fret,
          note,
          degree,
          finger,
          fingerName: fret === 0 ? 'Boş Tel' : FINGER_NAMES[finger] || `Parmak ${finger}`,
          status: fret === 0 ? 'open' : 'fretted'
        });
      }
    }
  }

  return {
    chordName,
    root,
    suffix,
    fullName: `${root} ${formulaInfo.fullName}`,
    typeCategory: formulaInfo.category,
    formula: formulaStr,
    tones,
    mood: formulaInfo.mood,
    stringsAnalysis
  };
}
