/**
 * patchThumbnails.js
 * Script untuk mengisi ulang thumbnail episode di scraped_episodes.json
 * dengan scraping halaman episode secara langsung.
 * 
 * Hanya memproses episode yang thumbnail-nya kosong ("") atau sama dengan poster anime.
 * Ambil thumbnail dari: og:image → JSON-LD thumbnailUrl → twitter:image → content img
 * 
 * Jalankan: node server/patchThumbnails.js
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EPISODES_PATH = path.join(__dirname, '../database/scraped_episodes.json');
const ANIME_PATH = path.join(__dirname, '../src/data/mockAnime.ts');

// Baca poster anime dari mockAnime.ts untuk tahu mana thumbnail yang cuma poster
function extractAnimePosters(tsContent) {
  const posterMap = {};
  const animeBlocks = tsContent.matchAll(/"id"\s*:\s*"([^"]+)"[\s\S]*?"poster"\s*:\s*"([^"]+)"/g);
  for (const m of animeBlocks) {
    posterMap[m[1]] = m[2];
  }
  return posterMap;
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

function extractEpThumbnail(html) {
  // 1. og:image
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch && ogMatch[1] && ogMatch[1].startsWith('http')) return ogMatch[1];

  // 2. JSON-LD thumbnailUrl
  const thumbMatch = html.match(/"thumbnailUrl"\s*:\s*"(https?:\/\/[^"]+)"/);
  if (thumbMatch) return thumbMatch[1];

  // 3. JSON-LD image
  const jsonLdImgMatch = html.match(/"image"\s*:\s*"(https?:\/\/[^"]+)"/);
  if (jsonLdImgMatch) return jsonLdImgMatch[1];

  // 4. twitter:image
  const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  if (twMatch && twMatch[1] && twMatch[1].startsWith('http')) return twMatch[1];

  // 5. content area image
  const contentImgMatch = html.match(/class=["'][^"']*(?:entry-content|post-content|content-area|episodeInfo)[^"']*["'][^>]*>[\s\S]{0,500}?<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
  if (contentImgMatch) return contentImgMatch[1];

  return '';
}

async function pMap(items, concurrency, fn) {
  let index = 0;
  let processed = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      await fn(items[i], i);
      processed++;
      if (processed % 50 === 0) {
        console.log(`  Progress: ${processed}/${items.length}`);
      }
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
}

// Tebak URL episode dari animeId + epNumber
function guessEpisodeUrl(ep) {
  const { animeId, number } = ep;
  
  if (animeId.startsWith('otaku-')) {
    const slug = animeId.replace(/^otaku-/, '');
    return `https://otakudesu.blog/episode/${slug}-episode-${number}/`;
  }
  if (animeId.startsWith('same-')) {
    const slug = animeId.replace(/^same-/, '');
    return `https://v2.samehadaku.how/anime/${slug}/episode-${number}/`;
  }
  if (animeId.startsWith('sokuja-')) {
    const slug = animeId.replace(/^sokuja-/, '');
    return `https://x6.sokuja.uk/anime/${slug}/episode-${number}/`;
  }
  return null;
}

async function main() {
  console.log('📖 Loading database...');
  const raw = fs.readFileSync(EPISODES_PATH, 'utf-8');
  const episodes = JSON.parse(raw);
  
  // Identifikasi episode yang butuh thumbnail
  const needsThumb = episodes.filter(ep => !ep.thumbnail || ep.thumbnail === '');
  console.log(`📊 Total episodes: ${episodes.length}`);
  console.log(`🔍 Episodes needing thumbnails: ${needsThumb.length}`);
  
  if (needsThumb.length === 0) {
    console.log('✅ All episodes already have thumbnails!');
    return;
  }

  // Map untuk update langsung ke array asli by id
  const episodeMap = new Map(episodes.map(ep => [ep.id, ep]));
  
  let updated = 0;
  let failed = 0;

  console.log(`\n🚀 Starting thumbnail patch (concurrency: 6)...\n`);

  await pMap(needsThumb, 6, async (ep) => {
    const url = guessEpisodeUrl(ep);
    if (!url) {
      failed++;
      return;
    }

    try {
      const res = await fetchUrl(url);
      if (res.statusCode !== 200 && res.statusCode !== 206) {
        failed++;
        return;
      }
      
      const thumb = extractEpThumbnail(res.body);
      if (thumb) {
        const target = episodeMap.get(ep.id);
        if (target) {
          target.thumbnail = thumb;
          updated++;
        }
      } else {
        failed++;
      }
    } catch (e) {
      failed++;
    }
  });

  // Simpan kembali ke file
  console.log(`\n💾 Saving updated database...`);
  fs.writeFileSync(EPISODES_PATH, JSON.stringify(episodes, null, 2), 'utf-8');
  
  console.log(`\n✅ Done!`);
  console.log(`   Updated: ${updated} episodes`);
  console.log(`   Failed/skipped: ${failed} episodes`);
  console.log(`   Total with thumbnails now: ${episodes.filter(e => e.thumbnail).length}/${episodes.length}`);
}

main().catch(e => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});
