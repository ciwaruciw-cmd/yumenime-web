/**
 * Nekopoi Scraper for Yowanime
 * Fetches Hentai titles and episode lists from:
 * - https://nekopoi.care/
 * - Alternative Nekopoi proxies & fallback curated feeds
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MOCK_ANIME_PATH = path.join(__dirname, '../src/data/mockAnime.ts');

function fetchUrl(url, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'id,en-US;q=0.7,en;q=0.3',
        ...customHeaders
      },
      rejectUnauthorized: false
    };

    const req = client.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          const urlObj = new URL(url);
          redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
        }
        return fetchUrl(redirectUrl, customHeaders).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export async function scrapeNekopoi() {
  console.log('\n🔍 [Nekopoi] Starting scrape from https://nekopoi.care/ ...');
  const items = [];
  const episodesMap = [];

  try {
    const targets = [
      'https://nekopoi.care/',
      'https://nekopoi.care/category/hentai/',
      'https://nekopoi.site/'
    ];

    let html = '';
    for (const targetUrl of targets) {
      try {
        console.log(`[Nekopoi] Attempting fetch: ${targetUrl}`);
        const res = await fetchUrl(targetUrl);
        if (res.body && !res.body.includes('internet sehat') && !res.body.includes('Telkomsel')) {
          html = res.body;
          console.log(`[Nekopoi] Successfully retrieved homepage HTML from ${targetUrl}`);
          break;
        }
      } catch (err) {
        console.warn(`[Nekopoi] Fetch failed for ${targetUrl}:`, err.message);
      }
    }

    if (html) {
      const postUrlRegex = /href=["\'](https?:\/\/nekopoi\.(?:care|site|club|app)\/([^"\'\?]+))["\']/g;
      const urls = new Set();
      let match;
      while ((match = postUrlRegex.exec(html)) !== null) {
        const u = match[1];
        if (!u.includes('/category/') && !u.includes('/tag/') && !u.includes('/page/')) {
          urls.add(u);
        }
      }

      console.log(`[Nekopoi] Found ${urls.size} detail post links.`);
      const urlList = Array.from(urls).slice(0, 15);

      for (const detailUrl of urlList) {
        try {
          const res = await fetchUrl(detailUrl);
          const detailHtml = res.body;

          const titleMatch = detailHtml.match(/<h1[^>]*>(.*?)<\/h1>/i) || detailHtml.match(/<title>(.*?)<\/title>/i);
          const posterMatch = detailHtml.match(/<img[^>]+src=["\']([^"\']+\.(?:jpg|png|webp|jpeg))["\']/i);
          const sinopMatch = detailHtml.match(/<div class="entry-content[^"]*"[^>]*>(.*?)<\/div>/s) || detailHtml.match(/<p>(.*?)<\/p>/s);

          const cleanTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').replace(/Subtitle Indonesia/gi, '').trim() : 'Nekopoi Hentai';
          const slug = slugify(cleanTitle);
          const animeId = `nekopoi-${slug}`;

          const epRegex = /<a [^>]*href=["\']([^"\']+)["\'][^>]*>(Episode \d+|Download|Stream)[^<]*<\/a>/gi;
          const parsedEps = [];
          let epMatch;
          while ((epMatch = epRegex.exec(detailHtml)) !== null) {
            parsedEps.push({ url: epMatch[1], title: epMatch[2] });
          }

          const epCount = parsedEps.length || 4;

          items.push({
            id: animeId,
            slug: slug,
            title: cleanTitle,
            titleEnglish: cleanTitle,
            titleJapanese: cleanTitle,
            synopsis: sinopMatch ? sinopMatch[1].replace(/<[^>]+>/g, '').trim() : `Nonton streaming & download ${cleanTitle} Subtitle Indonesia 1080p uncensored di Nekopoi Care.`,
            synopsisShort: (sinopMatch ? sinopMatch[1].replace(/<[^>]+>/g, '').trim() : cleanTitle).slice(0, 120) + '...',
            poster: posterMatch ? posterMatch[1] : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600',
            banner: posterMatch ? posterMatch[1] : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600',
            genres: ['Hentai', 'Ecchi', 'Romance'],
            status: 'completed',
            type: 'OVA',
            year: 2026,
            season: 'Spring',
            studio: 'Nekopoi Animation',
            rating: '18+',
            score: 8.6,
            episodes: epCount,
            duration: 25,
            isFeatured: false,
            isTrending: true,
            isNewUpdate: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          // Generate episode metadata objects
          for (let i = 1; i <= epCount; i++) {
            episodesMap.push({
              id: `${animeId}-ep-${i}`,
              animeId: animeId,
              number: i,
              title: `Episode ${i}: ${cleanTitle} (Uncensored Nekopoi)`,
              thumbnail: posterMatch ? posterMatch[1] : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600',
              duration: 1500,
              aired: '2026-08-01',
              sources: [
                { quality: '1080p', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
                { quality: '720p', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
                { quality: '480p', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' }
              ]
            });
          }

        } catch (err) {
          console.error(`[Nekopoi] Error parsing post ${detailUrl}:`, err.message);
        }
      }
    }

    // Fallback if network/ISP blocks live site
    if (items.length === 0) {
      console.log('⚠️ [Nekopoi] Live website request returned ISP internet-sehat page or connection error.');
      console.log('📦 Loading curated Nekopoi Hentai releases with full episode list...');

      const curatedData = [
        {
          id: 'nekopoi-overflow-uncensored-episodes',
          slug: 'overflow-uncensored-episodes',
          title: 'Overflow (Uncensored Nekopoi Edition)',
          titleEnglish: 'Overflow (Full Uncensored)',
          titleJapanese: 'おーばーふろぉ',
          synopsis: 'Nonton Streaming & Download Anime Hentai Overflow Subtitle Indonesia Full Episode 1 - 8 Uncensored HD di Nekopoi Care. Mengikuti kisah komedi romantis penuh gairah.',
          synopsisShort: 'Nonton Anime Hentai Overflow Sub Indo Full Episode Uncensored di Nekopoi.',
          poster: 'https://cdn.myanimelist.net/images/anime/1844/104928.jpg',
          banner: 'https://cdn.myanimelist.net/images/anime/1844/104928.jpg',
          genres: ['Hentai', 'Ecchi', 'Romance', 'Comedy'],
          status: 'completed',
          type: 'OVA',
          year: 2020,
          season: 'Winter',
          studio: 'Studio Houkiboshi / Nekopoi',
          rating: '18+',
          score: 8.9,
          episodes: 8,
          duration: 12,
          isFeatured: true,
          isTrending: true,
          isNewUpdate: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'nekopoi-kyuuketsuki-no-erotic-night',
          slug: 'kyuuketsuki-no-erotic-night',
          title: 'Kyuuketsuki no Erotic Night Sub Indo',
          titleEnglish: 'Vampire Erotic Night (Uncensored)',
          titleJapanese: '吸血鬼のエロティックナイト',
          synopsis: 'Nonton Anime Hentai Kyuuketsuki no Erotic Night Subtitle Indonesia HD. Cerita misteri vampir fantasi penuh gairah episode 1-4 di Nekopoi Care.',
          synopsisShort: 'Hentai Vampir Fantasi Uncensored Sub Indo di Nekopoi.',
          poster: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
          banner: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
          genres: ['Hentai', 'Supernatural', 'Fantasy', 'Ecchi'],
          status: 'completed',
          type: 'OVA',
          year: 2025,
          season: 'Fall',
          studio: 'Nekopoi Passion Studio',
          rating: '18+',
          score: 8.7,
          episodes: 4,
          duration: 28,
          isFeatured: false,
          isTrending: true,
          isNewUpdate: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'nekopoi-isekai-harem-monogatari',
          slug: 'isekai-harem-monogatari-nekopoi',
          title: 'Isekai Harem Monogatari Sub Indo',
          titleEnglish: 'Isekai Harem Monogatari',
          titleJapanese: '異世界ハーレム物語',
          synopsis: 'Nonton Anime Hentai Isekai Harem Monogatari Episode 1 - 4 Subtitle Indonesia 1080p Uncensored MP4 360p 480p 720p 1080p di Nekopoi Care.',
          synopsisShort: 'Nonton Isekai Harem Monogatari Sub Indo Full Episode Uncensored di Nekopoi.',
          poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
          banner: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
          genres: ['Hentai', 'Isekai', 'Fantasy', 'Ecchi'],
          status: 'completed',
          type: 'OVA',
          year: 2024,
          season: 'Summer',
          studio: 'Passione Hentai',
          rating: '18+',
          score: 9.1,
          episodes: 4,
          duration: 25,
          isFeatured: true,
          isTrending: true,
          isNewUpdate: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'nekopoi-resort-botti-sekatsu',
          slug: 'resort-botti-sekatsu-sub-indo',
          title: 'Resort Botti Seikatsu Sub Indo',
          titleEnglish: 'Resort Botti Seikatsu',
          titleJapanese: 'リゾートボッチ生活',
          synopsis: 'Nonton Streaming Anime Hentai Resort Botti Seikatsu Subtitle Indonesia Full Episode uncensored mp4 stream di Nekopoi.',
          synopsisShort: 'Resort Botti Seikatsu Hentai Sub Indo Uncensored di Nekopoi.',
          poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
          banner: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
          genres: ['Hentai', 'Slice of Life', 'Ecchi', 'Romance'],
          status: 'completed',
          type: 'OVA',
          year: 2024,
          season: 'Spring',
          studio: 'Nekopoi Media',
          rating: '18+',
          score: 8.4,
          episodes: 2,
          duration: 30,
          isFeatured: false,
          isTrending: true,
          isNewUpdate: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      curatedData.forEach(item => {
        items.push(item);
        for (let i = 1; i <= item.episodes; i++) {
          episodesMap.push({
            id: `${item.id}-ep-${i}`,
            animeId: item.id,
            number: i,
            title: `Episode ${i}: ${item.title} (Uncensored Nekopoi)`,
            thumbnail: item.poster,
            duration: item.duration * 60,
            aired: '2026-08-01',
            sources: [
              { quality: '1080p', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
              { quality: '720p', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
              { quality: '480p', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' }
            ]
          });
        }
      });
    }

  } catch (err) {
    console.error('[Nekopoi] Scrape process encountered error:', err.message);
  }

  return { items, episodes: episodesMap };
}

// ── Main CLI Runner ───────────────────────────────────────────────────────────
if (process.argv[1] && process.argv[1].endsWith('scrapeNekopoi.js')) {
  (async () => {
    console.log('====================================================');
    console.log('🚀 Yowanime Nekopoi Hentai Scraper Started');
    console.log('====================================================');

    const { items, episodes } = await scrapeNekopoi();
    console.log(`\n✅ Scraped ${items.length} Nekopoi Hentai titles & ${episodes.length} episodes.`);

    const mockFileContent = fs.readFileSync(MOCK_ANIME_PATH, 'utf8');

    const jsonStart = mockFileContent.indexOf('export const mockAnimes: Anime[] = ') + 'export const mockAnimes: Anime[] = '.length;
    const jsonEnd = mockFileContent.indexOf(';\n\n// ── Mock Episodes Generator');

    const existingAnimes = JSON.parse(mockFileContent.substring(jsonStart, jsonEnd));
    const animeMap = new Map();
    existingAnimes.forEach(a => animeMap.set(a.id, a));
    items.forEach(scraped => animeMap.set(scraped.id, scraped));

    const mergedAnimes = Array.from(animeMap.values());

    // Update mockEpisodes list
    const epStart = mockFileContent.indexOf('export const mockEpisodes: Episode[] = [') + 'export const mockEpisodes: Episode[] = ['.length;
    const epEnd = mockFileContent.lastIndexOf('];\n\nexport function getAllGenres()');

    let existingEpStr = mockFileContent.substring(epStart, epEnd).trim();
    let existingEps = [];
    try {
      if (existingEpStr) {
        existingEps = eval('[' + existingEpStr + ']');
      }
    } catch (e) {
      existingEps = [];
    }

    const epMap = new Map();
    existingEps.forEach(e => epMap.set(e.id, e));
    episodes.forEach(e => epMap.set(e.id, e));
    const mergedEpisodes = Array.from(epMap.values());

    let formattedEps = JSON.stringify(mergedEpisodes, null, 2);
    // clean up indentation for mockEpisodes export
    formattedEps = formattedEps.substring(1, formattedEps.length - 1);

    const newContent = mockFileContent.substring(0, jsonStart) +
      JSON.stringify(mergedAnimes, null, 2) +
      mockFileContent.substring(jsonEnd, epStart) +
      formattedEps +
      mockFileContent.substring(epEnd);

    fs.writeFileSync(MOCK_ANIME_PATH, newContent, 'utf8');
    console.log(`🎉 Successfully integrated Nekopoi titles & episode data into ${MOCK_ANIME_PATH}!`);

    const scrapedJsonPath = path.join(__dirname, '../database/nekopoi_scraped.json');
    fs.writeFileSync(scrapedJsonPath, JSON.stringify({ items, episodes }, null, 2), 'utf8');
    console.log(`📁 Backup saved to ${scrapedJsonPath}`);
  })();
}
