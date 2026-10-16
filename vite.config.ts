import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function decodeHtmlEntities(str: string): string {
  const namedEntities: Record<string, string> = {
    '&uuml;': 'ü',
    '&Uuml;': 'Ü',
    '&ouml;': 'ö',
    '&Ouml;': 'Ö',
    '&ccedil;': 'ç',
    '&Ccedil;': 'Ç',
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&rdquo;': '"',
    '&ldquo;': '"',
  };
  return str
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&[a-zA-Z]+;/g, (match) => namedEntities[match] ?? match)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function extractGeniusLyricsFromHtml(html: string): string {
  const parts = html.split('data-lyrics-container="true"').slice(1);
  const blocks: string[] = [];

  for (const part of parts) {
    let depth = 1;
    let i = part.indexOf('>') + 1;
    const start = i;
    while (i < part.length && depth > 0) {
      const nextOpen = part.indexOf('<div', i);
      const nextClose = part.indexOf('</div>', i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + 4;
      } else {
        depth--;
        if (depth === 0) {
          const inner = part.slice(start, nextClose);
          const cleanedInner = inner.replace(
            /<div[^>]*LyricsHeader__Container[\s\S]*?<\/div><\/div>/gi,
            ''
          );
          const text = decodeHtmlEntities(
            cleanedInner.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
          );
          blocks.push(text.trim());
        }
        i = nextClose + 6;
      }
    }
  }

  return blocks
    .join('\n\n')
    .replace(/^[\s\S]*?Lyrics\s*/i, '')
    .replace(/^\s*\[[^\]]*şarkı sözleri[^\]]*\]\s*/i, '')
    .replace(/\u2005|\u200b/g, ' ')
    .trim();
}

function normalizeChordSymbol(raw: string): string {
  const trimmed = raw.trim().replace(/^H(#|b)?/i, 'B$1');
  return trimmed;
}

function mergeChordLineWithLyricLine(
  chords: Array<{ chord: string; col: number }>,
  lyricLine: string
): string {
  const text = lyricLine.replace(/\t/g, '    ');
  if (!text.trim()) {
    return chords.map((c) => `[${c.chord}]`).join('    ');
  }

  // Snap each column to the nearest word start so we never cut a word in the middle
  const wordStarts: number[] = [0];
  for (let i = 1; i < text.length; i++) {
    if (text[i] !== ' ' && text[i - 1] === ' ') {
      wordStarts.push(i);
    }
  }

  const insertions: Array<{ pos: number; chord: string }> = chords.map(({ chord, col }) => {
    if (col >= text.length) {
      return { pos: text.length, chord };
    }
    let bestStart = 0;
    let bestDist = Math.abs(col - 0);
    for (const ws of wordStarts) {
      const dist = Math.abs(col - ws);
      if (dist <= bestDist) {
        bestDist = dist;
        bestStart = ws;
      }
    }
    return { pos: bestStart, chord };
  });

  // Insert from right to left so positions don't shift
  let result = text;
  for (let i = insertions.length - 1; i >= 0; i--) {
    const { pos, chord } = insertions[i];
    if (pos >= result.length) {
      result = `${result.trimEnd()} [${chord}]`;
    } else {
      result = `${result.slice(0, pos)}[${chord}]${result.slice(pos)}`;
    }
  }
  return result.trim();
}

function parseChordPositionsFromUgLine(line: string): {
  isChordOnlyLine: boolean;
  chords: Array<{ chord: string; col: number }>;
} {
  const chords: Array<{ chord: string; col: number }> = [];
  let visualCol = 0;
  let idx = 0;
  const tagRegex = /\[ch\]([^\[]+?)\[\/ch\]/gi;
  let match: RegExpExecArray | null;
  let strippedRemainder = '';

  while ((match = tagRegex.exec(line)) !== null) {
    const before = line.slice(idx, match.index);
    visualCol += before.length;
    strippedRemainder += before;
    const chord = normalizeChordSymbol(match[1]);
    if (chord) {
      chords.push({ chord, col: visualCol });
    }
    visualCol += chord.length;
    idx = match.index + match[0].length;
  }
  strippedRemainder += line.slice(idx);

  // Strip repeat markers like x2, 2x, |, -, / to check if line has only chords
  const nonChordText = strippedRemainder
    .replace(/[\|\-\/\\(\)\[\]xX×0-9\s:.,]/g, '')
    .trim();

  return {
    isChordOnlyLine: chords.length > 0 && nonChordText.length === 0,
    chords,
  };
}

function convertUgWikiTabToChordPro(
  rawContent: string,
  title: string,
  artist: string,
  key: string,
  capo: number
): string {
  const cleaned = decodeHtmlEntities(rawContent)
    .replace(/\r\n/g, '\n')
    .replace(/\[\/?tab\]/gi, '');

  const rawLines = cleaned.split('\n');
  const outLines: string[] = [
    `{title: ${title}}`,
    `{artist: ${artist}}`,
    `{key: ${key}}`,
    `{capo: ${capo}}`,
    '{tempo: 105}',
    '',
  ];

  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i].replace(/\t/g, '    ');
    const trimmed = line.trim();

    // Skip ASCII guitar tab lines (e|---, B|---, etc.) or Capo/Tuning header lines
    if (
      /^[eBGDAE1-6]\s*[\|:][\-\d\h\p\/\\~x\s\|]+$/i.test(trimmed) ||
      /^(?:capo|tuning|akort|ton|ritim)\s*[:\-]/i.test(trimmed)
    ) {
      i++;
      continue;
    }

    if (!trimmed) {
      if (outLines[outLines.length - 1] !== '') {
        outLines.push('');
      }
      i++;
      continue;
    }

    // Section headers like [Intro], [Verse 1], [Nakarat], Nakarat:
    const sectionMatch =
      trimmed.match(/^\[([A-Za-zÇĞİÖŞÜçğıöşü0-9\s\-\/#]+)\]$/) ||
      trimmed.match(/^(Intro|Giriş|Verse|Kıta|Chorus|Nakarat|Pre-Chorus|Ön Nakarat|Bridge|Köprü|Solo|Outro|Çıkış|Ara)\s*[0-9]*\s*:?$/i);
    if (sectionMatch && !/\[ch\]/i.test(trimmed)) {
      outLines.push(`{c: ${sectionMatch[1].trim()}}`);
      i++;
      continue;
    }

    const parsed = parseChordPositionsFromUgLine(line);
    if (parsed.isChordOnlyLine) {
      // Check if next non-empty line is a lyric line without [ch] tags
      const nextLine = i + 1 < rawLines.length ? rawLines[i + 1].replace(/\t/g, '    ') : '';
      const nextTrimmed = nextLine.trim();
      const nextParsed = nextTrimmed ? parseChordPositionsFromUgLine(nextLine) : null;
      const nextIsSection =
        /^\[[^\]]+\]$/.test(nextTrimmed) && !/\[ch\]/i.test(nextTrimmed);
      const nextIsAsciiTab = /^[eBGDAE1-6]\s*[\|:][\-\d\h\p\/\\~x\s\|]+$/i.test(nextTrimmed);

      if (
        nextTrimmed &&
        nextParsed &&
        !nextParsed.isChordOnlyLine &&
        nextParsed.chords.length === 0 &&
        !nextIsSection &&
        !nextIsAsciiTab
      ) {
        outLines.push(mergeChordLineWithLyricLine(parsed.chords, nextLine));
        i += 2;
        continue;
      } else {
        outLines.push(parsed.chords.map((c) => `[${c.chord}]`).join('    '));
        i++;
        continue;
      }
    }

    // Inline [ch] tags or plain lyric line
    const inlineConverted = line
      .replace(/\[ch\]([^\[]+?)\[\/ch\]/gi, (_, ch) => `[${normalizeChordSymbol(ch)}]`)
      .trim();
    if (inlineConverted) {
      outLines.push(inlineConverted);
    }
    i++;
  }

  return outLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function resolveUltimateGuitarChordPro(query: string): Promise<{
  artist: string;
  title: string;
  chordPro: string;
  key: string;
  capo: number;
} | null> {
  try {
    const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const html = await res.text();
    const storeMatch = html.match(/<div class="js-store" data-content="([^"]+)"/);
    if (!storeMatch) return null;

    const storeJson = JSON.parse(decodeHtmlEntities(storeMatch[1])) as {
      store?: {
        page?: {
          data?: {
            results?: Array<{
              type?: string;
              Marketing_type?: string;
              tab_access_type?: string;
              artist_name?: string;
              song_name?: string;
              tab_url?: string;
              tonality_name?: string;
              votes?: number;
              rating?: number;
            }>;
          };
        };
      };
    };

    const results = storeJson.store?.page?.data?.results || [];
    const chordTabs = results
      .filter(
        (r) =>
          r.type === 'Chords' &&
          !r.Marketing_type &&
          r.tab_url &&
          r.tab_access_type !== 'tab_pro'
      )
      .sort((a, b) => (b.votes || 0) - (a.votes || 0));

    const bestTab = chordTabs[0];
    if (!bestTab?.tab_url) return null;

    const tabRes = await fetch(bestTab.tab_url, { headers: { 'User-Agent': USER_AGENT } });
    if (!tabRes.ok) return null;
    const tabHtml = await tabRes.text();
    const tabStoreMatch = tabHtml.match(/<div class="js-store" data-content="([^"]+)"/);
    if (!tabStoreMatch) return null;

    const tabData = JSON.parse(decodeHtmlEntities(tabStoreMatch[1])) as {
      store?: {
        page?: {
          data?: {
            tab?: {
              artist_name?: string;
              song_name?: string;
              tonality_name?: string;
            };
            tab_view?: {
              meta?: {
                capo?: number;
                tonality?: string;
              };
              wiki_tab?: {
                content?: string;
              };
            };
          };
        };
      };
    };

    const pageData = tabData.store?.page?.data;
    const rawWiki = pageData?.tab_view?.wiki_tab?.content;
    if (!rawWiki || !/\[ch\]/i.test(rawWiki)) return null;

    const artist = pageData?.tab?.artist_name || bestTab.artist_name || '';
    const title = pageData?.tab?.song_name || bestTab.song_name || query;
    const rawCapo = Number(pageData?.tab_view?.meta?.capo || 0);
    const capo = Number.isFinite(rawCapo) && rawCapo >= 0 && rawCapo <= 12 ? rawCapo : 0;

    // Infer key from tonality or first chord in tab
    const firstChordMatch = rawWiki.match(/\[ch\]([A-G][#b]?m?)/i);
    const rawKey =
      pageData?.tab_view?.meta?.tonality ||
      pageData?.tab?.tonality_name ||
      bestTab.tonality_name ||
      (firstChordMatch ? normalizeChordSymbol(firstChordMatch[1]) : 'Am');

    const chordPro = convertUgWikiTabToChordPro(rawWiki, title, artist, rawKey, capo);
    if (chordPro.length < 60) return null;

    return {
      artist,
      title,
      chordPro,
      key: rawKey,
      capo,
    };
  } catch {
    return null;
  }
}

async function resolveSongLyricsServer(query: string): Promise<{
  artist: string;
  title: string;
  lyrics: string | null;
  chordPro?: string;
  key?: string;
  capo?: number;
  thumbnailUrl?: string;
}> {
  // 0. Try Ultimate Guitar Real Chords Sheet first
  const ugResult = await resolveUltimateGuitarChordPro(query);
  if (ugResult) {
    return {
      artist: ugResult.artist,
      title: ugResult.title,
      lyrics: null,
      chordPro: ugResult.chordPro,
      key: ugResult.key,
      capo: ugResult.capo,
    };
  }

  // 1. Genius Multi Search + Balanced Container Extraction
  try {
    const searchUrl = `https://genius.com/api/search/multi?per_page=5&q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (res.ok) {
      const data = (await res.json()) as {
        response?: {
          sections?: Array<{
            type: string;
            hits?: Array<{
              type?: string;
              result?: {
                artist_names?: string;
                title?: string;
                url?: string;
                song_art_image_thumbnail_url?: string;
              };
            }>;
          }>;
        };
      };
      const sections = data.response?.sections || [];
      const songSectionHits = sections.find((s) => s.type === 'song')?.hits || [];
      const topSectionHits = (sections.find((s) => s.type === 'top_hit')?.hits || []).filter(
        (h) => h.type === 'song'
      );
      const allHits = [...songSectionHits, ...topSectionHits];

      const preferredHit =
        allHits.find(
          (h) =>
            !/translation|romanized|genius|çeviri/i.test(
              `${h.result?.artist_names || ''} ${h.result?.title || ''}`
            )
        ) || allHits[0];

      const top = preferredHit?.result;
      if (top?.url) {
        const pageHtml = await fetch(top.url, { headers: { 'User-Agent': USER_AGENT } }).then((r) =>
          r.text()
        );
        const lyrics = extractGeniusLyricsFromHtml(pageHtml);
        if (lyrics && lyrics.length > 30) {
          return {
            artist: top.artist_names || '',
            title: top.title || query,
            lyrics,
            thumbnailUrl: top.song_art_image_thumbnail_url,
          };
        }
      }
    }
  } catch {
    // Fallback below
  }

  // 2. Fallback: iTunes TR + LRCLIB / lyrics.ovh
  try {
    const itunesRes = await fetch(
      `https://itunes.apple.com/search?entity=song&limit=3&country=TR&term=${encodeURIComponent(query)}`
    );
    if (itunesRes.ok) {
      const itunesData = (await itunesRes.json()) as {
        results?: Array<{ artistName?: string; trackName?: string }>;
      };
      const hit = itunesData.results?.[0];
      if (hit?.artistName && hit?.trackName) {
        const artist = hit.artistName;
        const title = hit.trackName.replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '').trim() || hit.trackName;
        // Also retry Ultimate Guitar with canonical iTunes artist + title!
        const canonicalUg = await resolveUltimateGuitarChordPro(`${artist} ${title}`);
        if (canonicalUg) {
          return {
            artist: canonicalUg.artist || artist,
            title: canonicalUg.title || title,
            lyrics: null,
            chordPro: canonicalUg.chordPro,
            key: canonicalUg.key,
            capo: canonicalUg.capo,
          };
        }
        const lrcRes = await fetch(
          `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
        );
        if (lrcRes.ok) {
          const lrcData = (await lrcRes.json()) as { plainLyrics?: string };
          if (lrcData.plainLyrics && lrcData.plainLyrics.length > 25) {
            return { artist, title, lyrics: lrcData.plainLyrics.trim() };
          }
        }
      }
    }
  } catch {
    // Ignore
  }

  return { artist: '', title: query, lyrics: null };
}

function lyricsResolverPlugin(): Plugin {
  return {
    name: 'vite-plugin-lyrics-resolver',
    configureServer(server) {
      server.middlewares.use('/api/lyrics', async (req, res) => {
        try {
          const url = new URL(req.url || '', 'http://localhost');
          const q = (url.searchParams.get('q') || '').trim();
          if (!q) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing query parameter q' }));
            return;
          }

          const result = await resolveSongLyricsServer(q);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(result));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), lyricsResolverPlugin()],
});
