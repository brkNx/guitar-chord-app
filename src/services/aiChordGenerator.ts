import type { Song } from '../types/guitar';

// Knowledge base of popular Turkish and International artist musical styles & chord formulas
interface ArtistProfile {
  typicalKeys: string[];
  verseProgression: string[];
  chorusProgression: string[];
  bridgeProgression: string[];
  capo: number;
  tempo: number;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
  suggestedPattern?: string;
}

const ARTIST_PROFILES: Record<string, ArtistProfile> = {
  'duman': {
    typicalKeys: ['Em', 'Am'],
    verseProgression: ['Em', 'G', 'D', 'Am'],
    chorusProgression: ['C', 'G', 'D', 'Em'],
    bridgeProgression: ['Am', 'C', 'D', 'Em'],
    capo: 0,
    tempo: 110,
    difficulty: 'Kolay',
    suggestedPattern: 'Pop / Rock Klasik (D - D U - U D U)'
  },
  'manga': {
    typicalKeys: ['Em', 'Am', 'Dm'],
    verseProgression: ['Em', 'C', 'G', 'D'],
    chorusProgression: ['C', 'D', 'Em', 'Bm'],
    bridgeProgression: ['Am', 'Em', 'D', 'C'],
    capo: 0,
    tempo: 128,
    difficulty: 'Orta',
    suggestedPattern: 'Rock Drive 4/4'
  },
  'şebnem ferah': {
    typicalKeys: ['Am', 'Dm', 'Em'],
    verseProgression: ['Am', 'F', 'C', 'G'],
    chorusProgression: ['F', 'G', 'Am', 'Em'],
    bridgeProgression: ['Dm', 'G', 'C', 'E7'],
    capo: 0,
    tempo: 92,
    difficulty: 'Orta',
    suggestedPattern: 'Akustik Balad (D - D - D U D U)'
  },
  'athena': {
    typicalKeys: ['A', 'D', 'E'],
    verseProgression: ['A', 'D', 'E', 'A'],
    chorusProgression: ['D', 'E', 'A', 'F#m'],
    bridgeProgression: ['Bm', 'E', 'A', 'D'],
    capo: 0,
    tempo: 140,
    difficulty: 'Kolay',
    suggestedPattern: 'Ska / Punk Upstroke (Upbeat)'
  },
  'pinhani': {
    typicalKeys: ['G', 'C', 'Am'],
    verseProgression: ['G', 'Em', 'C', 'D'],
    chorusProgression: ['C', 'D', 'G', 'Em'],
    bridgeProgression: ['Am', 'D', 'G', 'C'],
    capo: 0,
    tempo: 98,
    difficulty: 'Kolay',
    suggestedPattern: 'Akustik Balad'
  },
  'yüzyüzeyken konuşuruz': {
    typicalKeys: ['Am', 'C', 'F'],
    verseProgression: ['Am', 'Fmaj7', 'C', 'G'],
    chorusProgression: ['Fmaj7', 'G', 'Am', 'C'],
    bridgeProgression: ['Dm7', 'G', 'C', 'Am'],
    capo: 0,
    tempo: 104,
    difficulty: 'Orta',
    suggestedPattern: 'Indie Fingerstyle'
  },
  'madrigal': {
    typicalKeys: ['Bm', 'F#m', 'Em'],
    verseProgression: ['Bm', 'G', 'D', 'A'],
    chorusProgression: ['G', 'A', 'Bm', 'F#m'],
    bridgeProgression: ['Em', 'F#m', 'G', 'A'],
    capo: 2,
    tempo: 112,
    difficulty: 'Orta',
    suggestedPattern: 'Pop Groove 4/4'
  },
  'adamlar': {
    typicalKeys: ['Am', 'Dm', 'E7'],
    verseProgression: ['Am', 'E7', 'Am', 'Dm'],
    chorusProgression: ['F', 'G', 'C', 'E7'],
    bridgeProgression: ['Dm', 'Am', 'E7', 'Am'],
    capo: 0,
    tempo: 120,
    difficulty: 'Orta',
    suggestedPattern: 'Funky Strum'
  },
  'barış manço': {
    typicalKeys: ['Am', 'Dm'],
    verseProgression: ['Am', 'Dm', 'G', 'C'],
    chorusProgression: ['Dm', 'G', 'C', 'Am', 'E7'],
    bridgeProgression: ['F', 'G', 'Em', 'Am'],
    capo: 0,
    tempo: 105,
    difficulty: 'Orta',
    suggestedPattern: 'Slow Rock 6/8 Arpej'
  },
  'haluk levent': {
    typicalKeys: ['Am', 'Em'],
    verseProgression: ['Am', 'G', 'F', 'Em'],
    chorusProgression: ['Am', 'C', 'G', 'F', 'Em'],
    bridgeProgression: ['Dm', 'Am', 'E7', 'Am'],
    capo: 0,
    tempo: 96,
    difficulty: 'Kolay',
    suggestedPattern: 'Anadolu Rock 4/4'
  },
  'mor ve ötesi': {
    typicalKeys: ['Dm', 'Bm'],
    verseProgression: ['Dm', 'Bb', 'C', 'Dm'],
    chorusProgression: ['F', 'C', 'Dm', 'Bb'],
    bridgeProgression: ['Gm', 'Dm', 'A7', 'Dm'],
    capo: 0,
    tempo: 120,
    difficulty: 'Orta',
    suggestedPattern: 'Modern Rock'
  },
  'sezen aksu': {
    typicalKeys: ['Dm', 'Am', 'Em'],
    verseProgression: ['Am', 'Dm7', 'G7', 'Cmaj7'],
    chorusProgression: ['F', 'Dm', 'E7', 'Am'],
    bridgeProgression: ['Dm', 'G', 'C', 'F', 'Bdim', 'E7'],
    capo: 2,
    tempo: 88,
    difficulty: 'Orta',
    suggestedPattern: 'Vals / 3-Zamanlı'
  },
  'teoman': {
    typicalKeys: ['Am', 'Em'],
    verseProgression: ['Am', 'F', 'C', 'G'],
    chorusProgression: ['F', 'G', 'Am', 'Em'],
    bridgeProgression: ['Dm', 'Am', 'G', 'F'],
    capo: 0,
    tempo: 115,
    difficulty: 'Kolay',
    suggestedPattern: 'Pop / Rock Klasik'
  },
  'nirvana': {
    typicalKeys: ['Em', 'E', 'A'],
    verseProgression: ['Em', 'G', 'C', 'D'],
    chorusProgression: ['C', 'A', 'C', 'A'],
    bridgeProgression: ['F#', 'A', 'C', 'D'],
    capo: 0,
    tempo: 118,
    difficulty: 'Kolay',
    suggestedPattern: 'Grunge Power Strum'
  },
  'coldplay': {
    typicalKeys: ['G', 'C', 'D'],
    verseProgression: ['G', 'Em7', 'Cadd9', 'D'],
    chorusProgression: ['Cadd9', 'D', 'G', 'Em7'],
    bridgeProgression: ['Am', 'C', 'G', 'D'],
    capo: 1,
    tempo: 86,
    difficulty: 'Kolay',
    suggestedPattern: 'Akustik Balad'
  },
  'metallica': {
    typicalKeys: ['Em'],
    verseProgression: ['Em', 'D', 'C', 'G', 'B7'],
    chorusProgression: ['C', 'A', 'D', 'Em'],
    bridgeProgression: ['Em', 'D', 'C', 'B7'],
    capo: 0,
    tempo: 108,
    difficulty: 'Orta',
    suggestedPattern: 'Slow Rock 6/8 Arpej'
  },
  'arctic monkeys': {
    typicalKeys: ['F#m', 'Am', 'Em'],
    verseProgression: ['F#m', 'D', 'Bm', 'C#7'],
    chorusProgression: ['A', 'C#m', 'D', 'E'],
    bridgeProgression: ['Bm', 'D', 'F#m', 'E'],
    capo: 0,
    tempo: 122,
    difficulty: 'Orta',
    suggestedPattern: 'Indie Rock'
  },
  'ed sheeran': {
    typicalKeys: ['G', 'C', 'D'],
    verseProgression: ['G', 'Em', 'C', 'D'],
    chorusProgression: ['Em', 'C', 'G', 'D'],
    bridgeProgression: ['C', 'D', 'Em', 'G'],
    capo: 2,
    tempo: 95,
    difficulty: 'Kolay',
    suggestedPattern: 'Pop / Rock Klasik'
  },
  'oasis': {
    typicalKeys: ['G', 'Em'],
    verseProgression: ['Em7', 'G', 'Dsus4', 'A7sus4'],
    chorusProgression: ['Cadd9', 'Dsus4', 'Em7', 'G'],
    bridgeProgression: ['C', 'D', 'G', 'Em'],
    capo: 0,
    tempo: 85,
    difficulty: 'Kolay',
    suggestedPattern: 'Pop / Rock Klasik'
  },
  'lil baby': {
    typicalKeys: ['Dm', 'Am', 'Cm'],
    verseProgression: ['Dm', 'Bb', 'F', 'C'],
    chorusProgression: ['Dm', 'Bb', 'C', 'Am'],
    bridgeProgression: ['Bb', 'C', 'Dm', 'Am'],
    capo: 1,
    tempo: 130,
    difficulty: 'Kolay',
    suggestedPattern: 'Trap / Hip-Hop Guitar Loop (Fingerpicked Arpeggio)'
  },
  'drake': {
    typicalKeys: ['Em', 'Bm', 'Am'],
    verseProgression: ['Em', 'C', 'G', 'D'],
    chorusProgression: ['C', 'D', 'Em', 'Bm'],
    bridgeProgression: ['Am', 'Em', 'D', 'C'],
    capo: 0,
    tempo: 110,
    difficulty: 'Kolay',
    suggestedPattern: 'R&B / Hip-Hop Chill'
  },
  'travis scott': {
    typicalKeys: ['Dm', 'Gm', 'Am'],
    verseProgression: ['Dm', 'Am', 'Bb', 'C'],
    chorusProgression: ['Dm', 'F', 'C', 'Bb'],
    bridgeProgression: ['Gm', 'Dm', 'C', 'Bb'],
    capo: 0,
    tempo: 135,
    difficulty: 'Orta',
    suggestedPattern: 'Psychedelic Trap Beat'
  },
  'eminem': {
    typicalKeys: ['Am', 'Dm', 'Em'],
    verseProgression: ['Am', 'F', 'C', 'G'],
    chorusProgression: ['F', 'C', 'G', 'Am'],
    bridgeProgression: ['Dm', 'Am', 'E7', 'Am'],
    capo: 0,
    tempo: 88,
    difficulty: 'Orta',
    suggestedPattern: 'Rap Rock Strum'
  },
  'billie eilish': {
    typicalKeys: ['Em', 'Am', 'C'],
    verseProgression: ['Em', 'G', 'C', 'B7'],
    chorusProgression: ['C', 'D', 'Em', 'G'],
    bridgeProgression: ['Am', 'Em', 'B7', 'Em'],
    capo: 2,
    tempo: 82,
    difficulty: 'Kolay',
    suggestedPattern: 'Soft Fingerpicking'
  },
  'taylor swift': {
    typicalKeys: ['C', 'G', 'D'],
    verseProgression: ['C', 'G', 'Am', 'F'],
    chorusProgression: ['F', 'G', 'C', 'Am'],
    bridgeProgression: ['Dm', 'F', 'C', 'G'],
    capo: 3,
    tempo: 96,
    difficulty: 'Kolay',
    suggestedPattern: 'Pop Akustik Strum'
  },
  'the weeknd': {
    typicalKeys: ['Dm', 'Am', 'Em'],
    verseProgression: ['Dm', 'Bb', 'C', 'Am'],
    chorusProgression: ['F', 'C', 'Dm', 'Bb'],
    bridgeProgression: ['Gm', 'C', 'Dm', 'Am'],
    capo: 0,
    tempo: 124,
    difficulty: 'Kolay',
    suggestedPattern: 'Synthpop 80s Drive'
  }
};

const DEFAULT_PROFILE: ArtistProfile = {
  typicalKeys: ['Am', 'Em', 'C', 'G'],
  verseProgression: ['Am', 'F', 'C', 'G'],
  chorusProgression: ['F', 'G', 'Am', 'C'],
  bridgeProgression: ['Dm', 'G', 'C', 'Am'],
  capo: 0,
  tempo: 100,
  difficulty: 'Kolay',
  suggestedPattern: 'Pop / Rock Klasik (D - D U - U D U)'
};

export interface YouTubeVideoInfo {
  videoId: string;
  url: string;
  rawTitle: string;
  title: string;
  artist: string;
  authorName: string;
  thumbnailUrl: string;
}

/**
 * Extracts 11-char YouTube Video ID from any URL or string
 */
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  const ytMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|v\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  return ytMatch ? ytMatch[1] : null;
}

/**
 * Cleans YouTube video title and splits into Artist and Song Title
 */
export function parseTitleAndArtist(rawTitle: string, rawAuthor?: string): { artist: string; title: string } {
  // Strip common YouTube fluff in Turkish and English: (Official Video), (Resmi Klip), etc.
  const clean = rawTitle
    .replace(
      /\s*[\(\[](?:Official|Music|Video|Lyrics|Audio|HD|4K|Visualizer|Lyric Video|Clip Officiel|Official Lyric Video|Resmi|Klip|Orjinal|Orijinal|Sözleri|Şarkı Sözleri|Canlı|Live|Akustik)[\s\S]*?[\)\]]/gi,
      ''
    )
    .replace(/\s*\|\s*.*$/g, '')
    .trim();

  let artist = '';
  let title = clean;

  if (clean.includes(' - ')) {
    const parts = clean.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  } else if (clean.includes(' – ')) {
    const parts = clean.split(' – ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' – ').trim();
  } else if (clean.includes('-')) {
    const parts = clean.split('-');
    artist = parts[0].trim();
    title = parts.slice(1).join('-').trim();
  } else {
    const cleanAuthor = (rawAuthor || '')
      .replace(/VEVO$/i, '')
      .replace(/\s*-\s*Topic$/i, '')
      .replace(/\s*(Official|Music|Records|Entertainment|Müzik|Yapım|Prodüksiyon)$/i, '')
      .trim();
    artist = cleanAuthor || 'YouTube Sanatçısı';
    title = clean;
  }

  return { artist, title };
}

/**
 * Fetches real video title, channel, and thumbnail from YouTube oEmbed API
 */
export async function fetchYouTubeMetadata(input: string): Promise<YouTubeVideoInfo | null> {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) return null;

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const defaultThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const { artist, title } = parseTitleAndArtist(data.title || '', data.author_name || '');
      return {
        videoId,
        url,
        rawTitle: data.title || '',
        title: title || data.title || `YouTube Video (${videoId})`,
        artist: artist || data.author_name || 'YouTube Sanatçısı',
        authorName: data.author_name || '',
        thumbnailUrl: data.thumbnail_url || defaultThumbnail
      };
    }
  } catch {
    // Fallback if blocked or offline
  }

  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.title) {
        const { artist, title } = parseTitleAndArtist(data.title, data.author_name);
        return {
          videoId,
          url,
          rawTitle: data.title,
          title: title || data.title,
          artist: artist || data.author_name || 'YouTube Sanatçısı',
          authorName: data.author_name || '',
          thumbnailUrl: data.thumbnail_url || defaultThumbnail
        };
      }
    }
  } catch {
    // Secondary fallback
  }

  return {
    videoId,
    url,
    rawTitle: `YouTube Video (${videoId})`,
    title: `YouTube Parçası (${videoId.slice(0, 6)})`,
    artist: 'YouTube Sanatçısı',
    authorName: 'YouTube',
    thumbnailUrl: defaultThumbnail
  };
}

/**
 * Checks if input is a YouTube URL and cleans/extracts song title info
 */
export function parseYouTubeOrSearchInput(input: string): {
  isYouTube: boolean;
  cleanQuery: string;
  videoId?: string;
} {
  const trimmed = input.trim();
  const videoId = extractYouTubeVideoId(trimmed);

  if (videoId) {
    const withoutUrl = trimmed.replace(
      /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|v\/|embed\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}[^\s]*/gi,
      ''
    ).trim();

    return {
      isYouTube: true,
      cleanQuery: withoutUrl || `YouTube Video (${videoId})`,
      videoId
    };
  }

  return {
    isYouTube: false,
    cleanQuery: trimmed
  };
}

async function fetchLyricsFromApis(artist: string, title: string): Promise<string | null> {
  if (!artist || !title || artist === 'Bilinmeyen Sanatçı' || artist === 'YouTube Sanatçısı') {
    return null;
  }

  // 1. Try LRCLIB exact get endpoint
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.plainLyrics === 'string' && data.plainLyrics.trim().length > 25) {
        return data.plainLyrics.trim();
      }
    }
  } catch {
    // Ignore and try fallback
  }

  // 2. Try lyrics.ovh
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.lyrics === 'string' && data.lyrics.trim().length > 25) {
        return data.lyrics
          .replace(/^Paroles de la chanson[\s\S]*?\n/i, '')
          .trim();
      }
    }
  } catch {
    // Ignore
  }

  return null;
}

async function resolveCanonicalTrackAndLyrics(
  initialArtist: string,
  initialTitle: string
): Promise<{ artist: string; title: string; lyrics: string | null }> {
  let artist = initialArtist;
  let title = initialTitle;

  const query =
    artist && artist !== 'Bilinmeyen Sanatçı' && artist !== 'YouTube Sanatçısı'
      ? `${artist} ${title}`
      : title;

  // 1. Try local Vite backend lyrics resolver (/api/lyrics -> Genius + LRCLIB, zero CORS)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`/api/lyrics?q=${encodeURIComponent(query)}`, {
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.lyrics === 'string' && data.lyrics.trim().length > 25) {
        return {
          artist: data.artist || artist,
          title: data.title || title,
          lyrics: data.lyrics.trim()
        };
      }
    }
  } catch {
    // Fallback to client-side APIs below
  }

  // 2. Try direct client-side fetch if artist looks valid
  const directLyrics = await fetchLyricsFromApis(artist, title);
  if (directLyrics) {
    return { artist, title, lyrics: directLyrics };
  }

  // 3. Canonicalize via iTunes Search API (handles missing Turkish diacritics & YouTube channel names)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://itunes.apple.com/search?entity=song&limit=3&country=TR&term=${encodeURIComponent(query)}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const hit = data?.results?.[0];
      if (hit?.artistName && hit?.trackName) {
        artist = hit.artistName;
        title = hit.trackName.replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '').trim() || hit.trackName;
        const resolvedLyrics = await fetchLyricsFromApis(artist, title);
        if (resolvedLyrics) {
          return { artist, title, lyrics: resolvedLyrics };
        }
      }
    }
  } catch {
    // Ignore
  }

  return { artist, title, lyrics: null };
}

/**
 * Places two chords on a lyric line at clean word boundaries (never splits a word in half).
 */
function harmonizeLyricLine(line: string, c1: string, c2: string): string {
  const words = line.trim().split(/\s+/);
  if (words.length <= 2) {
    return `[${c1}]${line.trim()} [${c2}]`;
  }
  const midWordIdx = Math.max(1, Math.floor(words.length / 2));
  const firstHalf = words.slice(0, midWordIdx).join(' ');
  const secondHalf = words.slice(midWordIdx).join(' ');
  return `[${c1}]${firstHalf} [${c2}]${secondHalf}`;
}

function isGeniusSectionTag(line: string): string | null {
  const m = line.trim().match(/^\[([^\]]+)\]$/);
  if (!m) return null;
  const inside = m[1].trim();
  // Real single chord is short like Am, F#m7, Cadd9; section headers contain words/spaces/colons
  if (/^[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|[0-9]|\/[A-G][#b]?)*$/.test(inside)) {
    return null;
  }
  return inside;
}

function buildChordProFromLyrics(
  title: string,
  artist: string,
  key: string,
  capo: number,
  tempo: number,
  rawLyrics: string,
  vp: string[],
  cp: string[],
  bp: string[]
): string {
  const blocks = rawLyrics
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((b) =>
      b
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
    )
    .filter((b) => b.length > 0);

  const sectionLines: string[] = [
    `{title: ${title}}`,
    `{artist: ${artist}}`,
    `{key: ${key}}`,
    `{capo: ${capo}}`,
    `{tempo: ${tempo}}`,
    '',
    '{c: Giriş / Intro}',
    `[${vp[0]}]    [${vp[1]}]    [${vp[2]}]    [${vp[3]}]`,
    ''
  ];

  let verseCount = 0;
  blocks.slice(0, 9).forEach((lines, blockIdx) => {
    const firstTag = isGeniusSectionTag(lines[0]);
    const headerLower = (firstTag || '').toLowerCase();

    const isChorus =
      /nakarat|chorus|hook/i.test(headerLower) ||
      (!firstTag && (blockIdx === 1 || blockIdx === 3 || blockIdx === 5));
    const isBridge =
      /köprü|ön nakarat|pre-chorus|bridge|solo|ara/i.test(headerLower) ||
      (!firstTag && blockIdx === 4 && blocks.length >= 6);

    const prog = isChorus ? cp : isBridge ? bp : vp;

    if (!firstTag) {
      if (isChorus) {
        sectionLines.push('{c: Nakarat}');
      } else if (isBridge) {
        sectionLines.push('{c: Köprü / Solo}');
      } else {
        verseCount += 1;
        sectionLines.push(`{c: Kıta ${verseCount}}`);
      }
    }

    let chordCursor = 0;
    for (const line of lines) {
      const sectionTag = isGeniusSectionTag(line);
      if (sectionTag) {
        sectionLines.push(`{c: ${sectionTag}}`);
      } else if (line.startsWith('{')) {
        sectionLines.push(line);
      } else {
        const c1 = prog[chordCursor % prog.length];
        const c2 = prog[(chordCursor + 1) % prog.length];
        chordCursor += 2;
        sectionLines.push(harmonizeLyricLine(line, c1, c2));
      }
    }
    sectionLines.push('');
  });

  sectionLines.push('{c: Çıkış / Outro}');
  sectionLines.push(`[${vp[0]}]    [${vp[1]}]    [${vp[2]}]    [${vp[0]}]`);

  return sectionLines.join('\n');
}

/**
 * AI Chord Extractor & Harmonic Generator
 * Resolves real track metadata and real lyrics (Turkish & International), harmonizing them into ChordPro.
 */
export async function generateSongWithAI(
  rawInput: string,
  userLyrics?: string,
  preloadedYtInfo?: YouTubeVideoInfo
): Promise<Song> {
  let ytInfo: YouTubeVideoInfo | null = preloadedYtInfo || null;
  const videoId = extractYouTubeVideoId(rawInput);
  const isYouTube = !!videoId || !!ytInfo;

  if (isYouTube && !ytInfo) {
    try {
      ytInfo = await fetchYouTubeMetadata(rawInput);
    } catch {
      // Continue with fallback
    }
  }

  let artist = 'Bilinmeyen Sanatçı';
  let title = rawInput.trim();

  if (ytInfo) {
    artist = ytInfo.artist;
    title = ytInfo.title;
  } else {
    const { cleanQuery } = parseYouTubeOrSearchInput(rawInput);
    const parsed = parseTitleAndArtist(cleanQuery);
    if (parsed.artist && parsed.artist !== 'YouTube Sanatçısı') {
      artist = parsed.artist;
      title = parsed.title;
    } else if (cleanQuery.length > 0) {
      title = parsed.title || cleanQuery;
    }
  }

  // Resolve real artist, canonical Turkish/International title, and real lyrics from APIs
  let fetchedLyrics: string | null = null;
  if (!userLyrics || userLyrics.trim().length <= 10) {
    const resolved = await resolveCanonicalTrackAndLyrics(artist, title);
    artist = resolved.artist;
    title = resolved.title;
    fetchedLyrics = resolved.lyrics;
  }

  const artistLower = artist.toLowerCase();
  const titleLower = title.toLowerCase();

  let matchedProfile = DEFAULT_PROFILE;
  for (const [key, profile] of Object.entries(ARTIST_PROFILES)) {
    if (artistLower.includes(key) || titleLower.includes(key)) {
      matchedProfile = profile;
      if (artist === 'Bilinmeyen Sanatçı' || artist === 'YouTube Sanatçısı') {
        artist = key.charAt(0).toUpperCase() + key.slice(1);
      }
      break;
    }
  }

  const key = matchedProfile.typicalKeys[0];
  const vp = matchedProfile.verseProgression;
  const cp = matchedProfile.chorusProgression;
  const bp = matchedProfile.bridgeProgression;

  const effectiveLyrics =
    userLyrics && userLyrics.trim().length > 10 ? userLyrics.trim() : fetchedLyrics;

  let chordProContent = '';

  if (effectiveLyrics) {
    chordProContent = buildChordProFromLyrics(
      title,
      artist,
      key,
      matchedProfile.capo,
      matchedProfile.tempo,
      effectiveLyrics,
      vp,
      cp,
      bp
    );
  } else {
    // Instrumental / Unlisted Lyrics Fallback (Always clean Turkish Studio Structure)
    chordProContent = `{title: ${title}}
{artist: ${artist}}
{key: ${key}}
{capo: ${matchedProfile.capo}}
{tempo: ${matchedProfile.tempo}}

{c: Giriş / Ana Riff}
[${vp[0]}]    [${vp[1]}]    [${vp[2]}]    [${vp[3]}]

{c: Kıta 1 (Akor Akışı)}
[${vp[0]}]1. Ölçü (${vp[0]})        [${vp[1]}]2. Ölçü (${vp[1]})
[${vp[2]}]3. Ölçü (${vp[2]})        [${vp[3]}]4. Ölçü (${vp[3]})
[${vp[0]}]5. Ölçü (${vp[0]})        [${vp[1]}]6. Ölçü (${vp[1]})
[${vp[2]}]7. Ölçü (${vp[2]})        [${vp[3]}]8. Ölçü (${vp[3]})

{c: Nakarat}
[${cp[0]}]1. Ölçü (${cp[0]})        [${cp[1]}]2. Ölçü (${cp[1]})
[${cp[2]}]3. Ölçü (${cp[2]})        [${cp[3]}]4. Ölçü (${cp[3]})
[${cp[0]}]5. Ölçü (${cp[0]})        [${cp[1]}]6. Ölçü (${cp[1]})
[${cp[2]}]7. Ölçü (${cp[2]})        [${cp[3]}]8. Ölçü (${cp[3]})

{c: Köprü / Solo}
[${bp[0]}]    [${bp[1]}]    [${bp[2]}]    [${bp[3]}]

{c: Çıkış / Outro}
[${vp[0]}]    [${vp[1]}]    [${vp[2]}]    [${vp[0]}]`;
  }

  const generatedSong: Song = {
    id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    title,
    artist,
    key,
    capo: matchedProfile.capo,
    tempo: matchedProfile.tempo,
    difficulty: matchedProfile.difficulty,
    content: chordProContent,
    isCustom: true,
    isAiGenerated: true,
    youtubeId: ytInfo?.videoId || videoId || undefined,
    youtubeUrl: ytInfo?.url || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined),
    thumbnailUrl: ytInfo?.thumbnailUrl,
    tags: [
      'Yapay Zeka',
      isYouTube ? 'YouTube' : 'Yeni Şarkı',
      key,
      matchedProfile.suggestedPattern || '4/4'
    ]
  };

  return generatedSong;
}
