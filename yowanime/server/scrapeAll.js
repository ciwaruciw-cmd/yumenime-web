/**
 * scrapeAll.js — Incremental & Fast Yowanime Scraper
 * Mengambil anime + episode terbaru dari Otakudesu, Samehadaku, Sokuja
 * Mode default: Incremental (Cepat ~30s, update anime ongoing & anime baru)
 * Mode full: node server/scrapeAll.js --full
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '../database');
const EP_JSON = path.join(DB_DIR, 'scraped_episodes.json');
const ANIME_JSON = path.join(DB_DIR, 'scraped_animes.json');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

function fetchUrl(url, headers = {}, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const opts = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'id,en-US;q=0.7,en;q=0.3',
        'Cache-Control': 'no-cache',
        ...headers,
      },
      rejectUnauthorized: false,
    };
    const req = client.get(url, opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redir = res.headers.location;
        if (redir.startsWith('/')) {
          const u = new URL(url);
          redir = `${u.protocol}//${u.host}${redir}`;
        }
        return fetchUrl(redir, headers, timeout).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

function postAjax(url, data, referer = '') {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(data).toString();
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': referer || url,
      },
      rejectUnauthorized: false,
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error(`AJAXTimeout`)); });
    req.write(postData);
    req.end();
  });
}

async function pMap(items, concurrency, fn) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      try { const r = await fn(items[i], i); if (r !== undefined) results.push(r); } catch {}
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

function slugify(t) {
  return (t || '').toString().toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/--+/g, '-');
}

const VALID_GENRES = ['Action','Adventure','Comedy','Drama','Fantasy','Horror','Isekai','Mecha','Mystery','Romance','Sci-Fi','Seinen','Shounen','Shoujo','Slice of Life','Sports','Supernatural','Thriller','Music','Psychological','Yuri','Ecchi','Hentai'];
const GENRE_MAP = { school:'Slice of Life','super power':'Action',gore:'Horror',reincarnation:'Isekai','urban fantasy':'Fantasy',historical:'Drama',magic:'Fantasy',harem:'Romance',military:'Action',vampire:'Supernatural',demons:'Supernatural',samurai:'Action','martial arts':'Action',game:'Fantasy',police:'Action',kids:'Comedy' };
function normalizeGenre(g) {
  if (!g) return null;
  const c = g.trim();
  const found = VALID_GENRES.find(v => v.toLowerCase() === c.toLowerCase());
  if (found) return found;
  return GENRE_MAP[c.toLowerCase()] || null;
}

const DUMMY = ['commondatastorage','vjs.zencdn','w3schools','interactive-examples','gtv-videos-bucket','BigBuckBunny','ElephantsDream','ForBiggerBlazes','TearsOfSteel','sintel','mov_bbb','oceans.mp4'];
const isReal = (url) => url && !DUMMY.some(d => url.includes(d));

async function resolveStreamUrl(url) {
  if (!url) return '';
  const clean = url.replace(/&amp;/g, '&');
  if (!clean.includes('desustream')) return clean;
  try {
    const r = await fetchUrl(clean, { 'Referer': 'https://otakudesu.blog/' }, 10000);
    const h = r.body;
    const mp4 = h.match(/const\s+videoURL\s*=\s*["']([^"']+)["']/i) ||
                h.match(/file\s*:\s*["']([^"']+\.mp4[^"']*)['"]/i) ||
                h.match(/https?:\/\/[^\s"'<>]+\.odcloud\.net\/[^\s"'<>]+\.mp4/i) ||
                h.match(/https?:\/\/[^\s"'<>]+\.(?:mp4|m3u8)/i);
    if (mp4) return mp4[1] || mp4[0];
    const blogger = h.match(/<iframe[^>]+src=["'](https:\/\/www\.blogger\.com\/video\.g\?[^"']+)["']/i);
    if (blogger) return blogger[1].replace(/&amp;/g, '&');
    const iframe = h.match(/<iframe[^>]+src=["'](https?:\/\/[^"']+)["']/i);
    if (iframe && !iframe[1].includes('desustream')) return iframe[1].replace(/&amp;/g, '&');
  } catch {}
  return clean;
}

// ── OTAKUDESU ─────────────────────────────────────────────────────────────────
async function scrapeOtakudesu(existingAnimeMap, existingEpSet, isFull = false) {
  console.log(`\n🔍 [Otakudesu] Memulai scrape (${isFull ? 'FULL' : 'INCREMENTAL'})...`);
  const animes = [], episodes = [];
  const urls = new Set();

  const pages = ['https://otakudesu.blog/ongoing-anime/', 'https://otakudesu.blog/'];
  const maxPages = isFull ? 12 : 3;
  for (let p = 2; p <= maxPages; p++) pages.push(`https://otakudesu.blog/ongoing-anime/page/${p}/`);
  if (isFull) {
    for (let p = 1; p <= 15; p++) pages.push(p === 1 ? 'https://otakudesu.blog/complete-anime/' : `https://otakudesu.blog/complete-anime/page/${p}/`);
  } else {
    pages.push('https://otakudesu.blog/complete-anime/');
  }

  for (const pUrl of pages) {
    try {
      const r = await fetchUrl(pUrl, {}, 10000);
      if (r.statusCode === 404) continue;
      const re = /href=["'](https:\/\/otakudesu\.blog\/anime\/[^"'?#]+)["']/g;
      let m;
      while ((m = re.exec(r.body)) !== null) urls.add(m[1].split('?')[0]);
      await new Promise(r => setTimeout(r, 150));
    } catch {}
  }
  console.log(`[Otakudesu] Discovered: ${urls.size} anime URLs`);

  await pMap(Array.from(urls), 5, async (detailUrl) => {
    try {
      const r = await fetchUrl(detailUrl, {}, 12000);
      const h = r.body;
      const titleM = h.match(/<b>Judul<\/b>\s*:\s*([^<]+)/i) || h.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const titleJpM = h.match(/<b>Japanese<\/b>\s*:\s*([^<]+)/i);
      const scoreM = h.match(/<b>Skor<\/b>\s*:\s*([\d.]+)/i);
      const statusM = h.match(/<b>Status<\/b>\s*:\s*([^<]+)/i);
      const studioM = h.match(/<b>Studio<\/b>\s*:\s*([^<]+)/i);
      const typeM = h.match(/<b>Tipe<\/b>\s*:\s*([^<]+)/i);
      const posterM = h.match(/<div class="fotoanime">\s*<img[^>]+src="([^"]+)"/i) ||
                      h.match(/<img[^>]+class="[^"]*wp-post-image[^"]*"[^>]+src="([^"]+)"/i) ||
                      h.match(/<div class="cukder">\s*<img[^>]+src="([^"]+)"/i);
      const sinopM = h.match(/<div class="sinopc">(.*?)<\/div>/s);
      const genreMs = Array.from(h.matchAll(/href="https:\/\/otakudesu\.blog\/genres\/[^"]+?"[^>]*>([^<]+)<\/a>/g)).map(m => m[1]);
      const genres = Array.from(new Set(genreMs.map(normalizeGenre).filter(Boolean)));
      if (!genres.length) genres.push('Action', 'Fantasy');

      const rawTitle = titleM ? titleM[1].replace(/Subtitle Indonesia/gi, '').replace(/<[^>]+>/g, '').trim() : 'Otakudesu Anime';
      const slug = slugify(rawTitle);
      const animeId = `otaku-${slug}`;
      const status = (statusM ? statusM[1].toLowerCase() : '').includes('complete') ? 'completed' : 'ongoing';

      // Smart check: jika sudah tamat dan sudah ada di DB, skip re-scrape episodes
      const existingAnime = existingAnimeMap.get(animeId);
      if (existingAnime && status === 'completed' && existingAnime.episodes > 0 && !isFull) {
        animes.push(existingAnime);
        return;
      }

      const epMs = Array.from(h.matchAll(/<a[^>]+href=["'](https:\/\/otakudesu\.blog\/episode\/[^"']+)["'][^>]*>(.*?)<\/a>/gi));
      const rawEps = epMs.map(m => ({ url: m[1], raw: m[2].replace(/<[^>]+>/g, '').trim() }));
      const sortedEps = rawEps.slice().reverse();

      const posterUrl = posterM ? posterM[1] : (existingAnime?.poster || '');
      const synopsis = sinopM ? sinopM[1].replace(/<[^>]+>/g, '').trim() : `${rawTitle} sub indo.`;
      const score = scoreM ? (parseFloat(scoreM[1]) || 7.5) : (existingAnime?.score || 7.5);

      const actionMs = [...h.matchAll(/action:\s*["']([a-f0-9]{32})["']/gi)].map(m => m[1]);
      const streamAction = actionMs[0] || '';
      const nonceAction = actionMs[1] || '';

      // Filter: hanya episode yang BELUM ada di DB yang di-fetch
      const epsToFetch = sortedEps.map((e, idx) => ({ ...e, epNum: idx + 1 }))
        .filter(e => isFull || !existingEpSet.has(`${animeId}-ep-${e.epNum}`));

      if (epsToFetch.length > 0) {
        console.log(`[Otakudesu] ${rawTitle}: ${epsToFetch.length} new episodes to scrape`);
      }

      await pMap(epsToFetch, 3, async (epData) => {
        const epNum = epData.epNum;
        let url1080 = '', url720 = '', url480 = '';
        try {
          const er = await fetchUrl(epData.url, {}, 10000);
          const eh = er.body;
          const allDC = [...eh.matchAll(/data-content=["']([^"']+)["']/gi)];
          let dc1080 = null, dc720 = null, dc480 = null;
          for (const m of allDC) {
            try {
              const dec = JSON.parse(Buffer.from(m[1], 'base64').toString('utf-8'));
              if (dec.q === '1080p' && !dc1080) dc1080 = m[1];
              if (dec.q === '720p' && !dc720) dc720 = m[1];
              if (dec.q === '480p' && !dc480) dc480 = m[1];
            } catch {}
          }
          const epActionMs = [...eh.matchAll(/action:\s*["']([a-f0-9]{32})["']/gi)].map(m => m[1]);
          const epSA = epActionMs[0] || streamAction;
          const epNA = epActionMs[1] || nonceAction;

          async function resolveDC(dc) {
            if (!dc || !epSA || !epNA) return '';
            try {
              const nr = await postAjax('https://otakudesu.blog/wp-admin/admin-ajax.php', { action: epNA }, epData.url);
              const nonce = JSON.parse(nr).data;
              const payload = JSON.parse(Buffer.from(dc, 'base64').toString('utf-8'));
              const sr = await postAjax('https://otakudesu.blog/wp-admin/admin-ajax.php', { ...payload, nonce, action: epSA }, epData.url);
              const ihtml = Buffer.from(JSON.parse(sr).data, 'base64').toString('utf-8');
              const srcM = ihtml.match(/src=["']([^"']+)["']/i);
              if (srcM) return await resolveStreamUrl(srcM[1]);
            } catch {}
            return '';
          }

          url1080 = await resolveDC(dc1080);
          url720 = await resolveDC(dc720);
          url480 = await resolveDC(dc480);

          if (!url720) {
            const dl = eh.match(/720p<\/strong>\s*<a[^>]+href=["']([^"']+)["']/i) ||
                       eh.match(/<div class="responsive-embed-stream"[^>]*>\s*<iframe[^>]+src=["']([^"']+)["']/i) ||
                       eh.match(/<iframe[^>]+src=["'](https?:\/\/[^"']+)["']/i);
            if (dl) url720 = await resolveStreamUrl(dl[1]);
          }
          if (!url1080) {
            const dl = eh.match(/1080p<\/strong>\s*<a[^>]+href=["']([^"']+)["']/i);
            if (dl) url1080 = await resolveStreamUrl(dl[1]);
          }
        } catch {}

        const best = url1080 || url720 || url480;
        if (!isReal(best)) return;
        episodes.push({
          id: `${animeId}-ep-${epNum}`, animeId, number: epNum,
          title: `Episode ${epNum}: ${rawTitle}`, thumbnail: posterUrl, duration: 1440,
          aired: new Date().toISOString().split('T')[0],
          sources: [
            { quality: '1080p', url: isReal(url1080) ? url1080 : best },
            { quality: '720p',  url: isReal(url720)  ? url720  : best },
            { quality: '480p',  url: isReal(url480)  ? url480  : (isReal(url720) ? url720 : best) },
          ],
        });
      });

      animes.push({
        id: animeId, slug, title: rawTitle, titleEnglish: rawTitle,
        titleJapanese: titleJpM ? titleJpM[1].trim() : rawTitle,
        synopsis, synopsisShort: synopsis.slice(0, 120) + '...',
        poster: posterUrl, banner: posterUrl, genres, status,
        type: typeM ? (typeM[1].trim().toUpperCase().includes('MOVIE') ? 'Movie' : 'TV') : 'TV',
        year: 2026, season: 'Summer',
        studio: studioM ? studioM[1].trim() : 'Otakudesu',
        rating: 'PG-13', score, episodes: sortedEps.length || 12, duration: 24,
        isFeatured: false, isTrending: true, isNewUpdate: status === 'ongoing',
        createdAt: existingAnime?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (e) { console.error(`[Otakudesu] fail: ${detailUrl}`, e.message); }
  });

  console.log(`[Otakudesu] ✅ ${animes.length} anime, ${episodes.length} episodes baru`);
  return { animes, episodes };
}

// ── SAMEHADAKU ────────────────────────────────────────────────────────────────
async function scrapeSamehadaku(existingAnimeMap, existingEpSet, isFull = false) {
  console.log(`\n🔍 [Samehadaku] Memulai scrape (${isFull ? 'FULL' : 'INCREMENTAL'})...`);
  const animes = [], episodes = [];
  const urls = new Set();

  const pages = ['https://v2.samehadaku.how/', 'https://v2.samehadaku.how/anime-terbaru/'];
  const maxPages = isFull ? 10 : 3;
  for (let p = 2; p <= maxPages; p++) pages.push(`https://v2.samehadaku.how/anime-terbaru/page/${p}/`);
  if (isFull) {
    for (let p = 1; p <= 10; p++) pages.push(`https://v2.samehadaku.how/anime-list/page/${p}/`);
  }

  for (const pUrl of pages) {
    try {
      const r = await fetchUrl(pUrl, {}, 10000);
      if (r.statusCode === 404) continue;
      const re = /href=["'](https:\/\/v2\.samehadaku\.how\/anime\/[^"'?#]+)["']/g;
      let m;
      while ((m = re.exec(r.body)) !== null) urls.add(m[1].split('?')[0]);
      await new Promise(r => setTimeout(r, 150));
    } catch {}
  }
  console.log(`[Samehadaku] Discovered: ${urls.size} anime URLs`);

  await pMap(Array.from(urls), 5, async (detailUrl) => {
    try {
      const r = await fetchUrl(detailUrl, {}, 12000);
      const h = r.body;
      const titleM = h.match(/<h1[^>]*entry-title[^>]*>(.*?)<\/h1>/i) || h.match(/<h1[^>]*>(.*?)<\/h1>/i);
      const posterM = h.match(/<div class="thumb"[^>]*>\s*<img[^>]+src="([^"]+)"/i) ||
                      h.match(/<img[^>]+src="([^"]+)"[^>]+class="[^"]*wp-post-image/i);
      const sinopM = h.match(/<div class="entry-content[^"]*"[^>]*>(.*?)<\/div>/s) ||
                     h.match(/<div class="desc[^"]*"[^>]*>(.*?)<\/div>/s);
      const scoreM = h.match(/Skor.*?([\d.]+)/s);
      const genreMs = Array.from(h.matchAll(/Genres:\s*([^<\n]+)/gi)).flatMap(m => m[1].split(','));
      const genres = Array.from(new Set(genreMs.map(normalizeGenre).filter(Boolean)));
      if (!genres.length) genres.push('Action', 'Adventure');

      const cleanTitle = titleM ? titleM[1].replace(/<[^>]+>/g, '').replace(/Subtitle Indonesia/gi, '').trim() : 'Samehadaku Anime';
      const slug = slugify(cleanTitle);
      const animeId = `same-${slug}-sub-indo`;

      const existingAnime = existingAnimeMap.get(animeId);
      if (existingAnime && existingAnime.status === 'completed' && existingAnime.episodes > 0 && !isFull) {
        animes.push(existingAnime);
        return;
      }

      const epLinkMs = Array.from(h.matchAll(/href=["'](https:\/\/v2\.samehadaku\.how\/[^"']*episode[^"'?#]*)["']/gi)).map(m => m[1].split('?')[0]);
      const epUrls = Array.from(new Set(epLinkMs));

      const posterUrl = posterM ? posterM[1] : (existingAnime?.poster || '');
      const synopsis = sinopM ? sinopM[1].replace(/<[^>]+>/g, '').trim() : `${cleanTitle} sub indo.`;
      const score = scoreM ? (parseFloat(scoreM[1]) || 7.5) : (existingAnime?.score || 7.5);

      const epsToFetch = epUrls.map((url, idx) => ({ url, epNum: idx + 1 }))
        .filter(e => isFull || !existingEpSet.has(`${animeId}-ep-${e.epNum}`));

      if (epsToFetch.length > 0) {
        console.log(`[Samehadaku] ${cleanTitle}: ${epsToFetch.length} new episodes to scrape`);
      }

      await pMap(epsToFetch, 3, async (item) => {
        const epNum = item.epNum;
        let url1080 = '', url720 = '';
        try {
          const er = await fetchUrl(item.url, {}, 10000);
          const eh = er.body;
          const ajaxUrlM = eh.match(/player_ajax\s*=\s*["']([^"']+)["']/i);
          const postIdM = eh.match(/post_id\s*=\s*["']?(\d+)["']?/i);
          const nonceM = eh.match(/nonce\s*=\s*["']([^"']{10,})['"]/i);

          if (ajaxUrlM && postIdM && nonceM) {
            const ajaxUrl = ajaxUrlM[1];
            const postId = postIdM[1];
            const nonce = nonceM[1];
            try {
              const r1080 = JSON.parse(await postAjax(ajaxUrl, { action: 'player_ajax', nonce, post_id: postId, num: '1', type: 'stream' }));
              url1080 = r1080.embed_url || r1080.url || '';
            } catch {}
            try {
              const r720 = JSON.parse(await postAjax(ajaxUrl, { action: 'player_ajax', nonce, post_id: postId, num: '0', type: 'stream' }));
              url720 = r720.embed_url || r720.url || '';
            } catch {}
          }
          if (!url720) {
            const srcM = eh.match(/src=["'](https?:\/\/[^"']+(?:embed|player|stream|wibufile|mega)[^"']*)['"]/i) ||
                         eh.match(/<iframe[^>]+src=["'](https?:\/\/[^"']+)['"]/i);
            if (srcM) url720 = srcM[1].replace(/&amp;/g, '&');
          }
        } catch {}
        const best = url1080 || url720;
        if (!isReal(best)) return;
        episodes.push({
          id: `${animeId}-ep-${epNum}`, animeId, number: epNum,
          title: `Episode ${epNum}: ${cleanTitle}`, thumbnail: posterUrl, duration: 1440,
          aired: new Date().toISOString().split('T')[0],
          sources: [
            { quality: '1080p', url: isReal(url1080) ? url1080 : best },
            { quality: '720p',  url: isReal(url720)  ? url720  : best },
            { quality: '480p',  url: isReal(url720)  ? url720  : best },
          ],
        });
      });

      animes.push({
        id: animeId, slug: `${slug}-sub-indo`, title: cleanTitle, titleEnglish: cleanTitle,
        titleJapanese: cleanTitle, synopsis, synopsisShort: synopsis.slice(0, 120) + '...',
        poster: posterUrl, banner: posterUrl, genres, status: 'ongoing',
        type: 'TV', year: 2026, season: 'Spring', studio: 'Samehadaku',
        rating: 'PG-13', score, episodes: epUrls.length || 12, duration: 24,
        isFeatured: false, isTrending: true, isNewUpdate: true,
        createdAt: existingAnime?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (e) { console.error(`[Samehadaku] fail: ${detailUrl}`, e.message); }
  });

  console.log(`[Samehadaku] ✅ ${animes.length} anime, ${episodes.length} episodes baru`);
  return { animes, episodes };
}

// ── SOKUJA ───────────────────────────────────────────────────────────────────
async function scrapeSokuja(existingAnimeMap, existingEpSet, isFull = false) {
  const BASE = 'https://x6.sokuja.uk';
  console.log(`\n🔍 [Sokuja] Memulai scrape (${isFull ? 'FULL' : 'INCREMENTAL'})...`);
  const animes = [], episodes = [];
  const animeUrls = new Set();

  const pages = [`${BASE}/`, `${BASE}/anime/?status=ongoing&order=update`];
  const maxPages = isFull ? 15 : 3;
  for (let p = 2; p <= maxPages; p++) pages.push(`${BASE}/anime/?status=ongoing&order=update&page=${p}`);

  for (const pUrl of pages) {
    try {
      const r = await fetchUrl(pUrl, {}, 10000);
      if (r.statusCode === 404) continue;
      const re = /href="(\/anime\/[a-z0-9][a-z0-9-]+-subtitle-indonesia\/)"/g;
      let m;
      while ((m = re.exec(r.body)) !== null) animeUrls.add(`${BASE}${m[1]}`);
      await new Promise(r => setTimeout(r, 150));
    } catch {}
  }
  console.log(`[Sokuja] Discovered: ${animeUrls.size} anime URLs`);

  await pMap(Array.from(animeUrls), 5, async (detailUrl) => {
    try {
      const r = await fetchUrl(detailUrl, {}, 12000);
      const h = r.body;
      const jsonLds = Array.from(h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)).map(x => x[1]);
      let meta = null;
      for (const raw of jsonLds) { try { const o = JSON.parse(raw); if (o['@type'] === 'TVSeries') { meta = o; break; } } catch {} }
      if (!meta) return;

      const cleanTitle = (meta.name || '').replace(/Subtitle Indonesia/gi, '').trim();
      if (!cleanTitle) return;
      const slug = slugify(cleanTitle);
      const animeId = `sokuja-${slug}`;

      const existingAnime = existingAnimeMap.get(animeId);
      if (existingAnime && existingAnime.status === 'completed' && existingAnime.episodes > 0 && !isFull) {
        animes.push(existingAnime);
        return;
      }

      const posterUrl = (Array.isArray(meta.image) ? meta.image[0] : meta.image) || (existingAnime?.poster || '');
      const synopsis = meta.description || `${cleanTitle} sub indo.`;
      const genreMs = (Array.isArray(meta.genre) ? meta.genre : [meta.genre]).filter(Boolean);
      const genres = Array.from(new Set(genreMs.map(normalizeGenre).filter(Boolean)));
      if (!genres.length) genres.push('Action', 'Adventure');

      const statusM = h.match(/Status:\s*<[^>]+>([^<]+)/i);
      const status = statusM ? (statusM[1].toLowerCase().includes('ongoing') ? 'ongoing' : 'completed') : 'ongoing';
      const scoreM = h.match(/itemprop="ratingValue"[^>]*>([^<]+)/i);
      const score = scoreM ? (parseFloat(scoreM[1]) || 7.5) : (existingAnime?.score || 7.5);
      const studioM = h.match(/Studio:\s*<[^>]+>([^<]+)/i);
      const yearM = h.match(/Tahun:\s*(\d{4})/i) || h.match(/Released:\s*(\d{4})/i);

      const epMs = Array.from(h.matchAll(/href="(\/(?:[^"]*-episode-[^"]+|episode\/[^"]+))"/gi));
      const epUrls = Array.from(new Set(epMs.map(m => `${BASE}${m[1]}`)));

      const epsToFetch = epUrls.map((url) => {
        const epNumM = url.match(/episode-(\d+)/i) || url.match(/\/ep[\/\-]?(\d+)/i);
        const epNum = epNumM ? parseInt(epNumM[1]) : 1;
        return { url, epNum };
      }).filter(e => isFull || !existingEpSet.has(`${animeId}-ep-${e.epNum}`));

      if (epsToFetch.length > 0) {
        console.log(`[Sokuja] ${cleanTitle}: ${epsToFetch.length} new episodes to scrape`);
      }

      await pMap(epsToFetch, 3, async (item) => {
        const epUrl = item.url;
        const epNum = item.epNum;
        let url1080 = '', url720 = '', url480 = '';
        try {
          const er = await fetchUrl(epUrl, {}, 10000);
          const eh = er.body;

          const apiM = eh.match(/(?:x6\.)?sokuja\.uk\/api\/video-mirrors\/\?e=([a-zA-Z0-9_-]+)/i) ||
                       eh.match(/\/api\/video-mirrors\/\?e=([a-zA-Z0-9_-]+)/i);
          if (apiM) {
            try {
              const apiRes = await fetchUrl(`https://x6.sokuja.uk/api/video-mirrors/?e=${apiM[1]}`, { 'Referer': epUrl }, 10000);
              const mirrors = JSON.parse(apiRes.body);
              if (Array.isArray(mirrors)) {
                for (const mirror of mirrors) {
                  const q = (mirror.quality || mirror.label || '').toLowerCase();
                  const mUrl = mirror.src || mirror.url || mirror.file || '';
                  if (!mUrl) continue;
                  if (q.includes('1080') && !url1080) url1080 = mUrl;
                  else if (q.includes('720') && !url720) url720 = mUrl;
                  else if (q.includes('480') && !url480) url480 = mUrl;
                  else if (!url720) url720 = mUrl;
                }
              }
            } catch {}
          }
          if (!url720) {
            const srcM = eh.match(/<iframe[^>]+src=["'](https?:\/\/[^"']+)['"]/i) ||
                         eh.match(/src=["'](https?:\/\/[^"']+\.mp4[^"']*)['"]/i);
            if (srcM) url720 = srcM[1].replace(/&amp;/g, '&');
          }

          const best = url1080 || url720;
          if (!isReal(best)) return;
          episodes.push({
            id: `${animeId}-ep-${epNum}`, animeId, number: epNum,
            title: `Episode ${epNum}: ${cleanTitle}`, thumbnail: posterUrl, duration: 1440,
            aired: new Date().toISOString().split('T')[0],
            sources: [
              { quality: '1080p', url: isReal(url1080) ? url1080 : best },
              { quality: '720p',  url: isReal(url720)  ? url720  : best },
              { quality: '480p',  url: isReal(url480)  ? url480  : (isReal(url720) ? url720 : best) },
            ],
          });
        } catch {}
      });

      animes.push({
        id: animeId, slug, title: cleanTitle, titleEnglish: cleanTitle,
        titleJapanese: meta.alternateName || cleanTitle,
        synopsis, synopsisShort: synopsis.slice(0, 120) + '...',
        poster: posterUrl, banner: posterUrl, genres, status,
        type: 'TV', year: yearM ? parseInt(yearM[1]) : 2026, season: 'Spring',
        studio: studioM ? studioM[1].trim() : 'Sokuja',
        rating: 'PG-13', score, episodes: epUrls.length || 12, duration: 24,
        isFeatured: false, isTrending: true, isNewUpdate: status === 'ongoing',
        createdAt: existingAnime?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (e) { console.error(`[Sokuja] fail: ${detailUrl}`, e.message); }
  });

  console.log(`[Sokuja] ✅ ${animes.length} anime, ${episodes.length} episodes baru`);
  return { animes, episodes };
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  const isFull = process.argv.includes('--full') || process.env.SCRAPE_MODE === 'full';
  console.log('='.repeat(60));
  console.log(`🚀 YOWANIME SCRAPER — ${isFull ? 'MODE FULL' : 'MODE INCREMENTAL'}...`);
  console.log('='.repeat(60));

  let existingAnimes = [], existingEps = [];
  try { existingAnimes = JSON.parse(fs.readFileSync(ANIME_JSON, 'utf8')); } catch {}
  try { existingEps = JSON.parse(fs.readFileSync(EP_JSON, 'utf8')); } catch {}

  console.log(`📊 Data di Database saat ini: ${existingAnimes.length} anime, ${existingEps.length} episode`);

  const existingAnimeMap = new Map(existingAnimes.map(a => [a.id, a]));
  const existingEpSet = new Set(existingEps.map(e => e.id));

  const { animes: otakuAnimes, episodes: otakuEps } = await scrapeOtakudesu(existingAnimeMap, existingEpSet, isFull);
  const { animes: sameAnimes, episodes: sameEps } = await scrapeSamehadaku(existingAnimeMap, existingEpSet, isFull);
  const { animes: sokujaAnimes, episodes: sokujaEps } = await scrapeSokuja(existingAnimeMap, existingEpSet, isFull);

  // Merge: new scrape updates old, existing is preserved
  const animeMap = new Map();
  existingAnimes.forEach(a => animeMap.set(a.id, a));
  [...otakuAnimes, ...sameAnimes, ...sokujaAnimes].forEach(a => animeMap.set(a.id, a));

  const epMap = new Map();
  existingEps.filter(e => e.sources?.some(s => isReal(s.url))).forEach(e => epMap.set(e.id, e));
  [...otakuEps, ...sameEps, ...sokujaEps].filter(e => e.sources?.some(s => isReal(s.url))).forEach(e => epMap.set(e.id, e));

  const allAnimes = Array.from(animeMap.values());
  const allEps = Array.from(epMap.values());

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Total anime di database: ${allAnimes.length}`);
  console.log(`✅ Total episode dengan streaming aktif: ${allEps.length}`);
  console.log(`   - Tambahan episode baru Otakudesu: ${otakuEps.length}`);
  console.log(`   - Tambahan episode baru Samehadaku: ${sameEps.length}`);
  console.log(`   - Tambahan episode baru Sokuja: ${sokujaEps.length}`);

  // Save intermediate per-source to help with debug
  fs.writeFileSync(ANIME_JSON, JSON.stringify(allAnimes, null, 2), 'utf8');
  fs.writeFileSync(EP_JSON, JSON.stringify(allEps, null, 2), 'utf8');
  console.log(`\n📁 Tersimpan: ${ANIME_JSON}`);
  console.log(`📁 Tersimpan: ${EP_JSON}`);
  console.log('\n🎉 Scrape SELESAI!');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
