/**
 * Otakudesu & Samehadaku Scraper for Yowanime
 * Fetches anime lists, detail pages, and episode lists from:
 * - https://otakudesu.blog/
 * - https://v2.samehadaku.how/
 * Integrates scraped entries directly into Yowanime dataset (mockAnime.ts & seed.sql).
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MOCK_ANIME_PATH = path.join(__dirname, '../src/data/mockAnime.ts');

const VALID_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Isekai', 'Mecha', 'Mystery', 'Romance', 'Sci-Fi', 'Seinen',
  'Shounen', 'Shoujo', 'Slice of Life', 'Sports', 'Supernatural',
  'Thriller', 'Music', 'Psychological', 'Yuri', 'Ecchi', 'Hentai'
];

function normalizeGenre(gStr) {
  if (!gStr) return null;
  const clean = gStr.trim();
  const found = VALID_GENRES.find(v => v.toLowerCase() === clean.toLowerCase());
  if (found) return found;
  
  const map = {
    'school': 'Slice of Life',
    'super power': 'Action',
    'gore': 'Horror',
    'reincarnation': 'Isekai',
    'urban fantasy': 'Fantasy',
    'historical': 'Drama',
    'magic': 'Fantasy',
    'harem': 'Romance',
  };
  return map[clean.toLowerCase()] || null;
}

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

// ── Otakudesu Scraper ────────────────────────────────────────────────────────
async function scrapeOtakudesu() {
  console.log('\n🔍 [Otakudesu] Starting scrape from https://otakudesu.blog/ ...');
  const items = [];

  try {
    const homeRes = await fetchUrl('https://otakudesu.blog/');
    const html = homeRes.body;

    const animeUrlRegex = /href="(https:\/\/otakudesu\.blog\/anime\/[^"]+)"/g;
    let match;
    const urls = new Set();
    while ((match = animeUrlRegex.exec(html)) !== null) {
      urls.add(match[1]);
    }

    console.log(`[Otakudesu] Found ${urls.size} anime detail URLs on homepage.`);
    const urlList = Array.from(urls).slice(0, 15);

    for (const detailUrl of urlList) {
      try {
        console.log(`[Otakudesu] Fetching detail: ${detailUrl}`);
        const res = await fetchUrl(detailUrl);
        const detailHtml = res.body;

        const titleMatch = detailHtml.match(/<b>Judul<\/b>\s*:\s*([^<]+)/i) || detailHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
        const titleJpMatch = detailHtml.match(/<b>Japanese<\/b>\s*:\s*([^<]+)/i);
        const scoreMatch = detailHtml.match(/<b>Skor<\/b>\s*:\s*([\d.]+)/i);
        const statusMatch = detailHtml.match(/<b>Status<\/b>\s*:\s*([^<]+)/i);
        const studioMatch = detailHtml.match(/<b>Studio<\/b>\s*:\s*([^<]+)/i);
        const typeMatch = detailHtml.match(/<b>Tipe<\/b>\s*:\s*([^<]+)/i);
        const posterMatch = detailHtml.match(/<div class="fotoanime">\s*<img[^>]+src="([^"]+)"/i);
        const sinopMatch = detailHtml.match(/<div class="sinopc">(.*?)<\/div>/s);

        const genreMatches = Array.from(detailHtml.matchAll(/href="https:\/\/otakudesu\.blog\/genres\/[^"]+"[^>]*>([^<]+)<\/a>/g)).map(m => m[1]);
        const genres = Array.from(new Set(genreMatches.map(normalizeGenre).filter(Boolean)));
        if (genres.length === 0) genres.push('Action', 'Fantasy');

        const epRegex = /<a href="(https:\/\/otakudesu\.blog\/episode\/[^"]+)">(.*?)<\/a>/g;
        const eps = [];
        let epMatch;
        while ((epMatch = epRegex.exec(detailHtml)) !== null) {
          eps.push({ url: epMatch[1], title: epMatch[2].trim() });
        }

        const rawTitle = titleMatch ? titleMatch[1].replace(/Subtitle Indonesia/gi, '').trim() : 'Otakudesu Anime';
        const cleanTitle = rawTitle.replace(/<[^>]+>/g, '').trim();
        const slug = slugify(cleanTitle);

        const statusRaw = statusMatch ? statusMatch[1].trim().toLowerCase() : 'ongoing';
        const status = statusRaw.includes('complete') ? 'completed' : 'ongoing';

        const rawScore = scoreMatch ? parseFloat(scoreMatch[1]) : 7.8;
        const score = isNaN(rawScore) ? 7.5 : rawScore;

        const rawSinop = sinopMatch ? sinopMatch[1].replace(/<[^>]+>/g, '').trim() : `${cleanTitle} subtitle Indonesia di Otakudesu.`;

        items.push({
          id: `otaku-${slug}`,
          slug: slug,
          title: cleanTitle,
          titleEnglish: cleanTitle,
          titleJapanese: titleJpMatch ? titleJpMatch[1].trim() : cleanTitle,
          synopsis: rawSinop,
          synopsisShort: rawSinop.slice(0, 120) + '...',
          poster: posterMatch ? posterMatch[1] : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600',
          banner: posterMatch ? posterMatch[1] : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600',
          genres: genres,
          status: status,
          type: typeMatch ? (typeMatch[1].trim().toUpperCase().includes('MOVIE') ? 'Movie' : 'TV') : 'TV',
          year: 2026,
          season: 'Summer',
          studio: studioMatch ? studioMatch[1].trim() : 'Otakudesu Studio',
          rating: 'PG-13',
          score: score,
          episodes: eps.length || 12,
          duration: 24,
          isFeatured: false,
          isTrending: true,
          isNewUpdate: status === 'ongoing',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error(`[Otakudesu] Error processing ${detailUrl}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Otakudesu] Scrape failed:', err.message);
  }

  return items;
}

// ── Samehadaku Scraper ────────────────────────────────────────────────────────
async function scrapeSamehadaku() {
  console.log('\n🔍 [Samehadaku] Starting scrape from https://v2.samehadaku.how/ ...');
  const items = [];

  try {
    const homeRes = await fetchUrl('https://v2.samehadaku.how/');
    const html = homeRes.body;

    const animeUrlRegex = /href=["\'](https:\/\/v2\.samehadaku\.how\/anime\/[^"\']+)["\']/g;
    let match;
    const urls = new Set();
    while ((match = animeUrlRegex.exec(html)) !== null) {
      urls.add(match[1]);
    }

    console.log(`[Samehadaku] Found ${urls.size} anime detail URLs on homepage.`);
    const urlList = Array.from(urls).slice(0, 15);

    for (const detailUrl of urlList) {
      try {
        console.log(`[Samehadaku] Fetching detail: ${detailUrl}`);
        const res = await fetchUrl(detailUrl);
        const detailHtml = res.body;

        const titleMatch = detailHtml.match(/<h1[^>]*entry-title[^>]*>(.*?)<\/h1>/i) || detailHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
        const posterMatch = detailHtml.match(/<div class="thumb"[^>]*>\s*<img[^>]+src="([^"]+)"/i) || detailHtml.match(/<img[^>]+src="([^"]+)"[^>]+class="[^"]*wp-post-image/i);
        const sinopMatch = detailHtml.match(/<div class="entry-content[^"]*"[^>]*>(.*?)<\/div>/s) || detailHtml.match(/<div class="desc[^"]*"[^>]*>(.*?)<\/div>/s);
        const scoreMatch = detailHtml.match(/<span class="rating"[^>]*>.*?([\d.]+)/s) || detailHtml.match(/<b>Skor<\/b>\s*:\s*([\d.]+)/i);

        const genreMatches = Array.from(detailHtml.matchAll(/Genres:\s*([^<\n]+)/gi)).flatMap(m => m[1].split(','));
        const genres = Array.from(new Set(genreMatches.map(normalizeGenre).filter(Boolean)));
        if (genres.length === 0) genres.push('Action', 'Adventure');

        const eps = Array.from(detailHtml.matchAll(/<a href="(https:\/\/v2\.samehadaku\.how\/[^"]*episode[^"]*)"/g));

        const cleanTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').replace(/Subtitle Indonesia/gi, '').trim() : 'Samehadaku Anime';
        const slug = slugify(cleanTitle);
        const rawScore = scoreMatch ? parseFloat(scoreMatch[1]) : 7.7;
        const score = isNaN(rawScore) ? 7.6 : rawScore;
        const rawSinop = sinopMatch ? sinopMatch[1].replace(/<[^>]+>/g, '').trim() : `${cleanTitle} subtitle Indonesia di Samehadaku.`;

        items.push({
          id: `same-${slug}`,
          slug: slug,
          title: cleanTitle,
          titleEnglish: cleanTitle,
          titleJapanese: cleanTitle,
          synopsis: rawSinop,
          synopsisShort: rawSinop.slice(0, 120) + '...',
          poster: posterMatch ? posterMatch[1] : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600',
          banner: posterMatch ? posterMatch[1] : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600',
          genres: genres,
          status: 'ongoing',
          type: 'TV',
          year: 2026,
          season: 'Spring',
          studio: 'Samehadaku Studio',
          rating: 'PG-13',
          score: score,
          episodes: eps.length || 12,
          duration: 24,
          isFeatured: false,
          isTrending: true,
          isNewUpdate: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error(`[Samehadaku] Error processing ${detailUrl}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Samehadaku] Scrape failed:', err.message);
  }

  return items;
}

import { scrapeNekopoi } from './scrapeNekopoi.js';

// ── Main Execution ───────────────────────────────────────────────────────────
async function main() {
  console.log('====================================================');
  console.log('🚀 Yowanime Anime & Nekopoi Scraper Started');
  console.log('====================================================');

  const otakudesuAnimes = await scrapeOtakudesu();
  const samehadakuAnimes = await scrapeSamehadaku();
  const { items: nekopoiAnimes } = await scrapeNekopoi();

  const allScraped = [...otakudesuAnimes, ...samehadakuAnimes, ...nekopoiAnimes];
  console.log(`\n✅ Total scraped anime & hentai entries: ${allScraped.length}`);

  if (allScraped.length === 0) {
    console.warn('⚠️ No anime scraped. Aborting merge.');
    return;
  }

  const mockFileContent = fs.readFileSync(MOCK_ANIME_PATH, 'utf8');

  const jsonStart = mockFileContent.indexOf('export const mockAnimes: Anime[] = ') + 'export const mockAnimes: Anime[] = '.length;
  const jsonEnd = mockFileContent.indexOf(';\n\n// ── Mock Episodes Generator');

  const existingAnimes = JSON.parse(mockFileContent.substring(jsonStart, jsonEnd));
  console.log(`Existing dataset count: ${existingAnimes.length}`);

  const animeMap = new Map();
  existingAnimes.forEach(a => animeMap.set(a.id, a));

  allScraped.forEach(scraped => {
    animeMap.set(scraped.id, scraped);
  });

  const mergedAnimes = Array.from(animeMap.values());
  console.log(`Merged dataset count: ${mergedAnimes.length}`);

  const newContent = mockFileContent.substring(0, jsonStart) +
    JSON.stringify(mergedAnimes, null, 2) +
    mockFileContent.substring(jsonEnd);

  fs.writeFileSync(MOCK_ANIME_PATH, newContent, 'utf8');
  console.log(`🎉 Successfully updated ${MOCK_ANIME_PATH}!`);

  const scrapedJsonPath = path.join(__dirname, '../database/scraped_animes.json');
  fs.writeFileSync(scrapedJsonPath, JSON.stringify(allScraped, null, 2), 'utf8');
  console.log(`📁 Saved scraped data backup to ${scrapedJsonPath}`);
}

main().catch(err => {
  console.error('Fatal error in scraper:', err);
});
