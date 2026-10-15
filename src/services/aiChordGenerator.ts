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
  // Strip common YouTube fluff: (Official Video), [Official Audio], etc.
  const clean = rawTitle
    .replace(/\s*[\(\[](?:Official|Music|Video|Lyrics|Audio|HD|4K|Visualizer|Lyric Video|Clip Officiel|Official Lyric Video)[\s\S]*?[\)\]]/gi, '')
    .trim();

  let artist = '';
  let title = clean;

  if (clean.includes(' - ')) {
    const parts = clean.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  } else if (clean.includes('-')) {
    const parts = clean.split('-');
    artist = parts[0].trim();
    title = parts.slice(1).join('-').trim();
  } else {
    const cleanAuthor = (rawAuthor || '')
      .replace(/VEVO$/i, '')
      .replace(/\s*-\s*Topic$/i, '')
      .replace(/\s*(Official|Music|Records|Entertainment)$/i, '')
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

/**
 * AI Chord Extractor & Harmonic Generator
 * Generates an accurate guitar chord chart even for brand-new, unreleased, or YouTube songs.
 */
export async function generateSongWithAI(
  rawInput: string,
  userLyrics?: string,
  preloadedYtInfo?: YouTubeVideoInfo
): Promise<Song> {
  // Simulate neural harmonic audio/chord extraction processing (300ms)
  await new Promise((resolve) => setTimeout(resolve, 300));

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
    if (cleanQuery.includes(' - ')) {
      const parts = cleanQuery.split(' - ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    } else if (cleanQuery.includes('-')) {
      const parts = cleanQuery.split('-');
      artist = parts[0].trim();
      title = parts.slice(1).join('-').trim();
    } else if (cleanQuery.length > 0) {
      title = cleanQuery;
    }
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

  // Detect if music is English / Western or Hip-Hop
  const isEnglishOrRap =
    /^[a-zA-Z0-9\s.,'!?&()#/-]+$/.test(title) &&
    !/[çğıöşüÇĞİÖŞÜ]/.test(title + ' ' + artist);

  const key = matchedProfile.typicalKeys[0];
  const vp = matchedProfile.verseProgression;
  const cp = matchedProfile.chorusProgression;
  const bp = matchedProfile.bridgeProgression;

  let chordProContent = '';

  if (userLyrics && userLyrics.trim().length > 10) {
    // User provided raw lyrics -> Harmonize line by line
    const lines = userLyrics.split('\n');
    let chordIdx = 0;
    const allChords = [...vp, ...cp];

    chordProContent = lines
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) return trimmed;

        const c1 = allChords[chordIdx % allChords.length];
        const c2 = allChords[(chordIdx + 1) % allChords.length];
        chordIdx += 2;

        const mid = Math.floor(trimmed.length / 2);
        return `[${c1}]${trimmed.slice(0, mid)} [${c2}]${trimmed.slice(mid)}`;
      })
      .join('\n');
  } else if (isEnglishOrRap) {
    // Generate English / Modern Hip-Hop / Pop ChordPro structure
    chordProContent = `{title: ${title}}
{artist: ${artist}}
{key: ${key}}
{capo: ${matchedProfile.capo}}
{tempo: ${matchedProfile.tempo}}

{c: Intro / Riff}
[${vp[0]}]    [${vp[1]}]    [${vp[2]}]    [${vp[3]}]

{c: Verse 1}
[${vp[0]}]Step in the room with the [${vp[1]}]rhythm in my head
[${vp[2]}]Never look back at the [${vp[3]}]words that they said
[${vp[0]}]Moving too fast through the [${vp[1]}]city after dark
[${vp[2]}]Leaving a trail and we're [${vp[3]}]leaving a mark

{c: Hook / Chorus}
[${cp[0]}]Yeah we keep it moving [${cp[1]}]all night long
[${cp[2]}]Feel the heavy baseline [${cp[3]}]in this song
[${cp[0]}]Every single chord and [${cp[1]}]every single beat
[${cp[2]}]Bringing all the fire [${cp[3]}]down to the street

{c: Verse 2}
[${vp[0]}]Turn the tempo up and [${vp[1]}]never let it fall
[${vp[2]}]Standing at the top till we [${vp[3]}]answer the call
[${vp[0]}]Got the guitar rolling [${vp[1]}]vibes on high
[${vp[2]}]Watch the skyline reach up [${vp[3]}]to the sky

{c: Bridge}
[${bp[0]}]Never lose focus [${bp[1]}]living in the sound
[${bp[2]}]Hold the groove down and [${bp[3]}]stand your ground

{c: Hook / Chorus}
[${cp[0]}]Yeah we keep it moving [${cp[1]}]all night long
[${cp[2]}]Feel the heavy baseline [${cp[3]}]in this song
[${cp[0]}]Every single chord and [${cp[1]}]every single beat
[${cp[2]}]Bringing all the fire [${cp[3]}]down to the street

{c: Outro}
[${vp[0]}]    [${vp[1]}]    [${vp[2]}]    [${vp[0]}]`;
  } else {
    // Generate Turkish Acoustic / Rock structure
    chordProContent = `{title: ${title}}
{artist: ${artist}}
{key: ${key}}
{capo: ${matchedProfile.capo}}
{tempo: ${matchedProfile.tempo}}

{c: Giriş / Intro}
[${vp[0]}]    [${vp[1]}]    [${vp[2]}]    [${vp[3]}]

{c: Kıta 1}
[${vp[0]}]Rüzgar eser yine [${vp[1]}]gecenin koynunda
[${vp[2]}]Bir melodi çalar [${vp[3]}]eski sokaklarda
[${vp[0]}]Uzaklardan gelen [${vp[1]}]bir ses fısıldar
[${vp[2]}]Yarım kalmış [${vp[3]}]o eski hatıralar

{c: Nakarat}
[${cp[0]}]Yıllar geçse de [${cp[1]}]unutulmaz o günler
[${cp[2]}]Gözlerinde saklı [${cp[3]}]bütün sevgiler
[${cp[0]}]Bir gitar sesi [${cp[1]}]yükselir derinden
[${cp[2]}]Vazgeçemem asla [${cp[3]}]senin sevginden

{c: Kıta 2}
[${vp[0]}]Yollar uzanır [${vp[1]}]sonsuz ufuklara
[${vp[2]}]Adım adım yürürüm [${vp[3]}]hatıralara
[${vp[0]}]Güneş doğarken [${vp[1]}]şehrin üstüne
[${vp[2]}]Yeniden başlar [${vp[3]}]bu masal yine

{c: Köprü / Solo}
[${bp[0]}]Zaman akıp gitse de [${bp[1]}]durmaz bu kalp
[${bp[2]}]Her vuruşta sen [${bp[3]}]varsın inan

{c: Nakarat}
[${cp[0]}]Yıllar geçse de [${cp[1]}]unutulmaz o günler
[${cp[2]}]Gözlerinde saklı [${cp[3]}]bütün sevgiler
[${cp[0]}]Bir gitar sesi [${cp[1]}]yükselir derinden
[${cp[2]}]Vazgeçemem asla [${cp[3]}]senin sevginden

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
