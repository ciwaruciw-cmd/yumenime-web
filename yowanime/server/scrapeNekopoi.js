/**
 * scrapeNekopoi.js — Nekopoi Hentai Scraper for Yowanime
 * Bypasses Indonesian ISP / Telkomsel DNS block using Cloudflare DoH & SNI.
 * Scrapes 1,000+ Hentai anime titles and their episodes with streaming iframes.
 *
 * Usage:
 *   node server/scrapeNekopoi.js          (Scrapes new/missing anime + episodes)
 *   node server/scrapeNekopoi.js --test   (Scrapes 3 titles for verification)
 *   node server/scrapeNekopoi.js --full   (Scrapes/refreshes all titles & streams)
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, '../database');
const EP_JSON = path.join(DB_DIR, 'scraped_episodes.json');
const ANIME_JSON = path.join(DB_DIR, 'scraped_animes.json');
const NEKOPOI_BACKUP = path.join(DB_DIR, 'nekopoi_scraped.json');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

let cachedNekopoiIp = '104.21.14.33';

async function resolveNekopoiIp() {
  try {
    const res = await new Promise((resolve, reject) => {
      https.get(
        'https://1.1.1.1/dns-query?name=nekopoi.care&type=A',
        { headers: { Accept: 'application/dns-json' }, timeout: 5000 },
        (res) => {
          let d = '';
          res.on('data', (c) => (d += c));
          res.on('end', () => resolve(d));
        }
      ).on('error', reject);
    });
    const parsed = JSON.parse(res);
    const ip = parsed.Answer?.find((a) => a.type === 1)?.data;
    if (ip) {
      cachedNekopoiIp = ip;
      console.log(`[Nekopoi] DoH resolved IP: ${cachedNekopoiIp}`);
    }
  } catch {
    console.log(`[Nekopoi] Using fallback IP: ${cachedNekopoiIp}`);
  }
  return cachedNekopoiIp;
}

function fetchNekopoi(urlOrPath, timeout = 15000) {
  return new Promise((resolve, reject) => {
    let p = urlOrPath;
    if (p.startsWith('http')) {
      try {
        const u = new URL(p);
        p = u.pathname + u.search;
      } catch {}
    }
    if (!p.startsWith('/')) p = '/' + p;

    const req = https.request(
      {
        host: cachedNekopoiIp,
        port: 443,
        servername: 'nekopoi.care',
        path: p,
        headers: {
          Host: 'nekopoi.care',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'id,en-US;q=0.7,en;q=0.3',
          Referer: 'https://nekopoi.care/',
        },
        rejectUnauthorized: false,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchNekopoi(res.headers.location, timeout).then(resolve).catch(reject);
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      }
    );

    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${p}`));
    });
    req.end();
  });
}

function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function pMap(items, concurrency, fn) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      try {
        const r = await fn(items[i], i);
        if (r !== undefined) results.push(r);
      } catch (err) {
        // continue
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return results;
}

function parseSeriesDetail(html, detailUrl) {
  const titleM =
    html.match(/<span class=["']nk-series-synopsis["']>\s*<b>([^<]+)<\/b>/i) ||
    html.match(/<h1[^>]*>Unduh ["']([^"']+)["']/i) ||
    html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  let rawTitle = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';
  if (!rawTitle) {
    const slug = detailUrl.split('/').filter(Boolean).pop() || '';
    rawTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const posterM =
    html.match(
      /class=["']nk-series-poster["'][^>]*style=["'][^"']*url\(['"]?([^'")]+)['"]?\)/i
    ) ||
    html.match(
      /<div class=["']nk-series-detail["'][\s\S]*?<img[^>]+src=["']([^"']+)["']/i
    ) ||
    html.match(/<img[^>]+class=["'][^"']*thumb[^"']*["'][^>]+src=["']([^"']+)["']/i);
  const poster = posterM
    ? posterM[1]
    : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600';

  const jpM = html.match(/<li><b>Judul Jepang<\/b>\s*:\s*([^<]+)<\/li>/i);
  const epCountM = html.match(/<li><b>Episode<\/b>\s*:\s*(\d+)<\/li>/i);
  const scoreM = html.match(/<li><b>Skor<\/b>\s*:\s*([\d.]+)<\/li>/i);
  const prodM = html.match(/<li><b>Produser<\/b>\s*:\s*([^<]+)<\/li>/i);
  const statusM = html.match(/<li><b>Status<\/b>\s*:\s*([^<]+)<\/li>/i);
  const genreMatches = [
    ...html.matchAll(
      /href=["']https:\/\/nekopoi\.care\/genres\/[^"']+["'][^>]*>([^<]+)<\/a>/gi
    ),
  ].map((m) => m[1].trim());

  const pM = html.match(/<div class=["']nk-series-detail["']>[\s\S]*?<p>([\s\S]*?)<\/p>/i);
  const synopsis = pM
    ? pM[1].replace(/<[^>]+>/g, '').trim()
    : `${rawTitle} Subtitle Indonesia`;

  const epCards = [
    ...html.matchAll(
      /<a href=["'](https:\/\/nekopoi\.care\/[^"']+)["'][^>]*class=["']nk-episode-card["']>([\s\S]*?)<\/a>/gi
    ),
  ];

  const eps = epCards
    .map((c) => {
      const url = c[1];
      const thumbM = c[2].match(/url\(['"]?([^'")]+)['"]?\)/i);
      const epTitleM = c[2].match(/class=["']nk-episode-card-title["']>([^<]+)<\/span>/i);
      const numM =
        url.match(/episode-(\d+)/i) ||
        (epTitleM ? epTitleM[1].match(/episode\s*(\d+)/i) : null);
      return {
        url,
        number: numM ? parseInt(numM[1]) : 1,
        thumbnail: thumbM ? thumbM[1] : poster,
        title: epTitleM ? epTitleM[1].trim() : `Episode 1: ${rawTitle}`,
      };
    })
    .reverse(); // Chronological order (Ep 1, Ep 2, etc.)

  const genres = Array.from(new Set(['Hentai', 'Ecchi', ...genreMatches]));

  return {
    title: rawTitle,
    titleJapanese: jpM ? jpM[1].trim() : rawTitle,
    poster,
    banner: poster,
    synopsis,
    score: scoreM ? parseFloat(scoreM[1]) || 8.0 : 8.0,
    studio: prodM ? prodM[1].trim() : 'Nekopoi',
    status: (statusM ? statusM[1] : '').toLowerCase().includes('ongoing')
      ? 'ongoing'
      : 'completed',
    genres,
    episodesCount: eps.length || (epCountM ? parseInt(epCountM[1]) : 1),
    episodes: eps,
  };
}

export async function scrapeNekopoi(
  existingAnimeMap = new Map(),
  existingEpSet = new Set(),
  isFull = false
) {
  console.log('='.repeat(60));
  console.log('🔞 [Nekopoi] Starting Nekopoi Hentai Scrape...');
  console.log('='.repeat(60));

  await resolveNekopoiIp();

  console.log('[Nekopoi] Fetching A-Z Hentai Directory from /hentai-list/ ...');
  let listHtml = '';
  try {
    const res = await fetchNekopoi('/hentai-list/');
    listHtml = res.body;
  } catch (err) {
    console.error('[Nekopoi] Failed to fetch /hentai-list/:', err.message);
    return { animes: [], episodes: [] };
  }

  const links = [
    ...listHtml.matchAll(/href=["'](https:\/\/nekopoi\.care\/hentai\/[^"']+)["']/g),
  ].map((m) => m[1]);
  const uniqueUrls = Array.from(new Set(links));
  console.log(`[Nekopoi] Discovered: ${uniqueUrls.length} Hentai series titles!`);

  const isTest = process.argv.includes('--test');
  const targetUrls = isTest ? uniqueUrls.slice(0, 3) : uniqueUrls;

  const animes = [];
  const episodes = [];

  let processedCount = 0;
  const saveProgressInterval = 25;

  const saveCurrentProgress = () => {
    animes.forEach((a) => existingAnimeMap.set(a.id, a));
    episodes.forEach((e) => existingEpSet.add(e.id));
    const allAnimes = Array.from(existingAnimeMap.values());
    fs.writeFileSync(ANIME_JSON, JSON.stringify(allAnimes, null, 2), 'utf8');
    fs.writeFileSync(
      EP_JSON,
      JSON.stringify(Array.from(existingEpSet.values ? [] : []), null, 2),
      'utf8'
    );
  };

  await pMap(targetUrls, 5, async (seriesUrl, idx) => {
    try {
      const slug = slugify(seriesUrl.split('/').filter(Boolean).pop());
      const animeId = `nekopoi-${slug}`;

      const existingAnime = existingAnimeMap.get(animeId);
      if (existingAnime && existingAnime.episodes > 0 && !isFull && !isTest) {
        animes.push(existingAnime);
        return;
      }

      const res = await fetchNekopoi(seriesUrl);
      if (res.statusCode !== 200 || !res.body) return;

      const parsed = parseSeriesDetail(res.body, seriesUrl);
      const cleanTitle = parsed.title;
      const animeData = {
        id: animeId,
        slug,
        title: cleanTitle,
        titleEnglish: cleanTitle,
        titleJapanese: parsed.titleJapanese,
        synopsis: parsed.synopsis,
        synopsisShort: parsed.synopsis.slice(0, 120) + '...',
        poster: parsed.poster,
        banner: parsed.banner,
        genres: parsed.genres,
        status: parsed.status,
        type: 'OVA',
        year: 2026,
        season: 'All Seasons',
        studio: parsed.studio,
        rating: '18+',
        score: parsed.score,
        episodes: parsed.episodes.length || parsed.episodesCount,
        duration: 25,
        isFeatured: false,
        isTrending: true,
        isNewUpdate: parsed.status === 'ongoing',
        createdAt: existingAnime?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      animes.push(animeData);

      // Scrape streams for episodes
      const epsToScrape = parsed.episodes.filter(
        (ep) => isFull || isTest || !existingEpSet.has(`${animeId}-ep-${ep.number}`)
      );

      for (const ep of epsToScrape) {
        let stream1080 = '';
        let stream720 = '';
        let stream480 = '';

        try {
          const epRes = await fetchNekopoi(ep.url);
          const epHtml = epRes.body;
          const iframes = [
            ...epHtml.matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi),
          ].map((m) => m[1]);

          const validStreams = iframes.filter(
            (u) =>
              u.includes('streampoi') ||
              u.includes('playmogo') ||
              u.includes('embed') ||
              u.includes('player')
          );

          if (validStreams.length > 0) {
            stream1080 = validStreams[0];
            stream720 = validStreams[1] || validStreams[0];
            stream480 = validStreams[2] || stream720;
          }
        } catch {}

        const bestStream =
          stream1080 ||
          stream720 ||
          `https://nekopoi.care${new URL(ep.url).pathname}`;

        episodes.push({
          id: `${animeId}-ep-${ep.number}`,
          animeId,
          number: ep.number,
          title: ep.title,
          thumbnail: ep.thumbnail || parsed.poster,
          duration: 1500,
          aired: new Date().toISOString().split('T')[0],
          sources: [
            { quality: '1080p', url: stream1080 || bestStream },
            { quality: '720p', url: stream720 || bestStream },
            { quality: '480p', url: stream480 || bestStream },
          ],
        });
      }

      processedCount++;
      if (processedCount % saveProgressInterval === 0 || isTest) {
        console.log(
          `[Nekopoi] Progress: ${processedCount}/${targetUrls.length} anime parsed (${animes.length} animes, ${episodes.length} episodes)`
        );
      }
    } catch (err) {
      console.warn(`[Nekopoi] Failed parsing ${seriesUrl}:`, err.message);
    }
  });

  console.log(
    `\n✅ [Nekopoi] Completed! Scraped ${animes.length} titles & ${episodes.length} episodes.`
  );
  return { animes, episodes };
}

// CLI runner
if (process.argv[1] && process.argv[1].endsWith('scrapeNekopoi.js')) {
  (async () => {
    let existingAnimes = [];
    let existingEps = [];
    try {
      existingAnimes = JSON.parse(fs.readFileSync(ANIME_JSON, 'utf8'));
    } catch {}
    try {
      existingEps = JSON.parse(fs.readFileSync(EP_JSON, 'utf8'));
    } catch {}

    const animeMap = new Map(existingAnimes.map((a) => [a.id, a]));
    const epMap = new Map(existingEps.map((e) => [e.id, e]));
    const epSet = new Set(epMap.keys());

    const isFull = process.argv.includes('--full');
    const { animes, episodes } = await scrapeNekopoi(animeMap, epSet, isFull);

    // Merge into database
    animes.forEach((a) => animeMap.set(a.id, a));
    episodes.forEach((e) => epMap.set(e.id, e));

    const finalAnimes = Array.from(animeMap.values());
    const finalEps = Array.from(epMap.values());

    fs.writeFileSync(ANIME_JSON, JSON.stringify(finalAnimes, null, 2), 'utf8');
    fs.writeFileSync(EP_JSON, JSON.stringify(finalEps, null, 2), 'utf8');
    fs.writeFileSync(
      NEKOPOI_BACKUP,
      JSON.stringify({ items: animes, episodes }, null, 2),
      'utf8'
    );

    console.log(`\n💾 Saved to ${ANIME_JSON} (Total: ${finalAnimes.length} anime)`);
    console.log(`💾 Saved to ${EP_JSON} (Total: ${finalEps.length} episodes)`);
    console.log(`💾 Saved backup to ${NEKOPOI_BACKUP}`);
  })().catch(console.error);
}
