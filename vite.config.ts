import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
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

async function resolveSongLyricsServer(query: string): Promise<{
  artist: string;
  title: string;
  lyrics: string | null;
  thumbnailUrl?: string;
}> {
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
