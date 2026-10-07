/**
 * Otakudesu, Samehadaku & Sokuja Scraper for Yowanime
 * Fetches anime lists, detail pages, and episode video streams from:
 * - https://otakudesu.blog/
 * - https://v2.samehadaku.how/
 * - https://x6.sokuja.uk/
 * Integrates scraped entries directly into Yowanime dataset (mockAnime.ts & backup JSON).
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

function postAjax(url, data, referer = '') {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(data).toString();
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const req = client.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': referer || url,
      },
      rejectUnauthorized: false,
    }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve(d));
    });
    req.on('error', reject);
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error(`Timeout AJAX ${url}`));
    });
    req.write(postData);
    req.end();
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
const SITE_LOGO_PATTERNS = [
  'Otakudesu.png', 'otakudesu.png', 'samehadaku.png',
  '/logo.', '/favicon', 'default-thumbnail', 'no-image',
  'placeholder', 'noimage', 'no_image',
];
function isSiteLogo(url) {
  return SITE_LOGO_PATTERNS.some(p => url.includes(p));
}

/**
 * Ekstrak thumbnail spesifik episode dari HTML halaman episode.
 * Urutan prioritas:
 * 1. og:image (kecuali logo situs) 2. JSON-LD thumbnailUrl/image
 * 3. twitter:image 4. konten img 5. fallback poster anime
 */
function extractEpThumbnail(html, fallback) {
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch && ogMatch[1] && ogMatch[1].startsWith('http') && !isSiteLogo(ogMatch[1])) return ogMatch[1];
  const thumbMatch = html.match(/"thumbnailUrl"\s*:\s*"(https?:\/\/[^"]+)"/);
  if (thumbMatch && !isSiteLogo(thumbMatch[1])) return thumbMatch[1];
  const jsonLdImgMatch = html.match(/"image"\s*:\s*"(https?:\/\/[^"]+)"/);
  if (jsonLdImgMatch && !isSiteLogo(jsonLdImgMatch[1])) return jsonLdImgMatch[1];
  const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  if (twMatch && twMatch[1] && twMatch[1].startsWith('http') && !isSiteLogo(twMatch[1])) return twMatch[1];
  const contentImgMatch = html.match(/class=["'][^"']*(?:entry-content|post-content|content-area|episodeInfo)[^"']*["'][^>]*>[\s\S]{0,500}?<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
  if (contentImgMatch && !isSiteLogo(contentImgMatch[1])) return contentImgMatch[1];
  return fallback || '';
}


/**
 * Concurrent async pool runner — executes fn over items with max concurrency.
 */
async function pMap(items, concurrency, fn) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      try {
        const res = await fn(items[i], i);
        if (res !== undefined) results.push(res);
      } catch (err) {
        // continue on item error
      }
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function resolveStreamUrl(streamUrl) {
  if (!streamUrl) return '';
  if (!streamUrl.includes('desustream')) {
    return streamUrl.replace(/&amp;/g, '&');
  }
  try {
    const res = await fetchUrl(streamUrl, { 'Referer': 'https://otakudesu.blog/' });
    const html = res.body;
    if (!html) return streamUrl;

    // 1. Direct mp4 in script / playerjs (includes archive.org direct links)
    const mp4Match = html.match(/const\s+videoURL\s*=\s*["']([^"']+)["']/i) ||
                     html.match(/video(?:Player)?\.src\s*=\s*["']([^"']+)["']/i) ||
                     html.match(/file\s*:\s*["']([^"']+)["']/i) ||
                     html.match(/https?:\/\/[^\s"'<>]+\.odcloud\.net\/[^\s"'<>]+\.mp4/i) ||
                     html.match(/https?:\/\/[^\s"'<>]+\.(?:mp4|m3u8)/i);
    if (mp4Match) return mp4Match[1] || mp4Match[0];

    // 2. Blogger iframe
    const bloggerMatch = html.match(/<iframe[^>]+src=["'](https:\/\/www\.blogger\.com\/video\.g\?[^"']+)["']/i) ||
                         html.match(/https:\/\/www\.blogger\.com\/video\.g\?token=[^\s"'<>]+/i);
    if (bloggerMatch) return (bloggerMatch[1] || bloggerMatch[0]).replace(/&amp;/g, '&');

    // 3. Generic non-desu iframe
    const genericIframe = html.match(/<iframe[^>]+src=["'](https?:\/\/[^"']+)["']/i);
    if (genericIframe && !genericIframe[1].includes('desustream')) {
      return genericIframe[1].replace(/&amp;/g, '&');
    }
  } catch { /* ignore */ }
  return streamUrl.replace(/&amp;/g, '&');
}

// ── Otakudesu Scraper (Pulls 720p Stream) ─────────────────────────────────────
async function scrapeOtakudesu() {
  console.log('\n🔍 [Otakudesu] Starting scrape from https://otakudesu.blog/ (Prioritizing 720p)...');
  const items = [];
  const episodes = [];

  try {
    const urls = new Set();
    const pagesToFetch = [
      'https://otakudesu.blog/',
      'https://otakudesu.blog/ongoing-anime/',
      'https://otakudesu.blog/ongoing-anime/page/2/',
      'https://otakudesu.blog/complete-anime/',
      'https://otakudesu.blog/complete-anime/page/2/',
    ];

    for (const pUrl of pagesToFetch) {
      try {
        const res = await fetchUrl(pUrl);
        const animeUrlRegex = /href=["'](https:\/\/otakudesu\.blog\/anime\/[^"']+)["']/g;
        let match;
        while ((match = animeUrlRegex.exec(res.body)) !== null) {
          urls.add(match[1]);
        }
      } catch { /* ignore page fail */ }
    }

    console.log(`[Otakudesu] Found ${urls.size} anime detail URLs across catalog.`);
    const urlList = Array.from(urls).slice(0, 60);

    await pMap(urlList, 5, async (detailUrl) => {
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
        const posterMatch = detailHtml.match(/<div class="fotoanime">\s*<img[^>]+src="([^"]+)"/i) ||
                            detailHtml.match(/<img[^>]+class="[^"]*wp-post-image[^"]*"[^>]+src="([^"]+)"/i) ||
                            detailHtml.match(/<img[^>]+src="([^"]+)"[^>]+class="[^"]*wp-post-image/i) ||
                            detailHtml.match(/<div class="cukder">\s*<img[^>]+src="([^"]+)"/i);
        const sinopMatch = detailHtml.match(/<div class="sinopc">(.*?)<\/div>/s);

        const genreMatches = Array.from(detailHtml.matchAll(/href="https:\/\/otakudesu\.blog\/genres\/[^"]+"[^>]*>([^<]+)<\/a>/g)).map(m => m[1]);
        const genres = Array.from(new Set(genreMatches.map(normalizeGenre).filter(Boolean)));
        if (genres.length === 0) genres.push('Action', 'Fantasy');

        // Extract episode anchor links
        const epMatches = Array.from(detailHtml.matchAll(/<a[^>]+href=["'](https:\/\/otakudesu\.blog\/episode\/[^"']+)["'][^>]*>(.*?)<\/a>/gi));
        const rawEps = [];
        epMatches.forEach(m => {
          rawEps.push({ url: m[1], rawTitle: m[2].replace(/<[^>]+>/g, '').trim() });
        });

        const rawTitle = titleMatch ? titleMatch[1].replace(/Subtitle Indonesia/gi, '').trim() : 'Otakudesu Anime';
        const cleanTitle = rawTitle.replace(/<[^>]+>/g, '').trim();
        const slug = slugify(cleanTitle);
        const animeId = `otaku-${slug}`;

        const statusRaw = statusMatch ? statusMatch[1].trim().toLowerCase() : 'ongoing';
        const status = statusRaw.includes('complete') ? 'completed' : 'ongoing';

        const rawScore = scoreMatch ? parseFloat(scoreMatch[1]) : 7.8;
        const score = isNaN(rawScore) ? 7.5 : rawScore;

        const rawSinop = sinopMatch ? sinopMatch[1].replace(/<[^>]+>/g, '').trim() : `${cleanTitle} subtitle Indonesia di Otakudesu.`;
        const posterUrl = posterMatch ? posterMatch[1] : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600';

        // Scrape video streams untuk semua episode (max 50 terbaru)
        const sortedEps = rawEps.reverse().slice(-50);
        const epCount = sortedEps.length || 12;

        console.log(`[Otakudesu] Scraping 720p video streams for ${cleanTitle} (${sortedEps.length} episodes)...`);
        
        await pMap(sortedEps, 4, async (epData, i) => {
          const epNum = i + 1;
          let streamUrl720 = '';

          try {
            const epRes = await fetchUrl(epData.url);
            const epHtml = epRes.body;
            const epThumbnail = extractEpThumbnail(epHtml, posterUrl);

            // 1. Try to fetch 720p mirror stream via AJAX
            const allContents = [...epHtml.matchAll(/data-content=["']([^"']+)["']/gi)];
            let dataContent720 = null;
            for (const m of allContents) {
              try {
                const dec = JSON.parse(Buffer.from(m[1], 'base64').toString('utf-8'));
                if (dec.q === '720p') {
                  dataContent720 = m[1];
                  break;
                }
              } catch {}
            }

            let nonceAction = 'aa1208d27f29ca340c92c66d1926f13f';
            let streamAction = '2a3505c93b0035d3f455df82bf976b84';
            const nonceActionMatch = epHtml.match(/data:\s*\{\s*action:\s*["']([a-f0-9]{32})["']\s*\}/i);
            if (nonceActionMatch) nonceAction = nonceActionMatch[1];
            const streamActionMatch = epHtml.match(/action:\s*["']([a-f0-9]{32})["']\s*\}\s*\)\s*\.done/i);
            if (streamActionMatch) streamAction = streamActionMatch[1];

            if (dataContent720) {
              try {
                const nonceRes = await postAjax('https://otakudesu.blog/wp-admin/admin-ajax.php', { action: nonceAction }, epData.url);
                const nonce = JSON.parse(nonceRes).data;
                const payload = JSON.parse(Buffer.from(dataContent720, 'base64').toString('utf-8'));
                const streamRes = await postAjax('https://otakudesu.blog/wp-admin/admin-ajax.php', {
                  ...payload,
                  nonce,
                  action: streamAction,
                }, epData.url);
                const iframeHtml = Buffer.from(JSON.parse(streamRes).data, 'base64').toString('utf-8');
                const srcMatch = iframeHtml.match(/src=["']([^"']+)["']/i);
                if (srcMatch) {
                  streamUrl720 = await resolveStreamUrl(srcMatch[1]);
                }
              } catch (ajaxErr) {
                // fallback to standard iframe
              }
            }

            // 2. Fallback to default responsive embed if 720p mirror AJAX not available
            if (!streamUrl720) {
              const iframeMatch = epHtml.match(/<div class=["']responsive-embed-stream["'][^>]*>\s*<iframe[^>]+src=["']([^"']+)["']/i) ||
                                  epHtml.match(/<iframe[^>]+src=["'](https?:\/\/[^"']+)["']/i);
              if (iframeMatch) {
                streamUrl720 = await resolveStreamUrl(iframeMatch[1]);
              }
            }
          } catch (e) {
            console.warn(`[Otakudesu] Failed to fetch ep video stream: ${epData.url}`, e.message);
          }

          const defaultStream = streamUrl720 || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

          episodes.push({
            id: `${animeId}-ep-${epNum}`,
            animeId: animeId,
            number: epNum,
            title: `Episode ${epNum}: ${cleanTitle}`,
            thumbnail: epThumbnail,
            duration: 1440,
            aired: new Date().toISOString().split('T')[0],
            sources: [
              { quality: '720p', url: defaultStream },
              { quality: '1080p', url: defaultStream },
              { quality: '480p', url: defaultStream },
            ],
          });
        });

        // If no episodes were on the page, generate placeholders with clean sources
        if (sortedEps.length === 0) {
          for (let epNum = 1; epNum <= epCount; epNum++) {
            episodes.push({
              id: `${animeId}-ep-${epNum}`,
              animeId: animeId,
              number: epNum,
              title: `Episode ${epNum}: ${cleanTitle}`,
              thumbnail: posterUrl,
              duration: 1440,
              aired: new Date().toISOString().split('T')[0],
              sources: [
                { quality: '720p', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
                { quality: '1080p', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
                { quality: '480p', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
              ],
            });
          }
        }

        items.push({
          id: animeId,
          slug: slug,
          title: cleanTitle,
          titleEnglish: cleanTitle,
          titleJapanese: titleJpMatch ? titleJpMatch[1].trim() : cleanTitle,
          synopsis: rawSinop,
          synopsisShort: rawSinop.slice(0, 120) + '...',
          poster: posterUrl,
          banner: posterUrl,
          genres: genres,
          status: status,
          type: typeMatch ? (typeMatch[1].trim().toUpperCase().includes('MOVIE') ? 'Movie' : 'TV') : 'TV',
          year: 2026,
          season: 'Summer',
          studio: studioMatch ? studioMatch[1].trim() : 'Otakudesu Studio',
          rating: 'PG-13',
          score: score,
          episodes: epCount,
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
    });
  } catch (err) {
    console.error('[Otakudesu] Scrape failed:', err.message);
  }

  return { items, episodes };
}

// ── Samehadaku Scraper (Pulls 1080p FULLHD Stream) ────────────────────────────
async function scrapeSamehadaku() {
  console.log('\n🔍 [Samehadaku] Starting scrape from https://v2.samehadaku.how/ (Prioritizing 1080p FULLHD)...');
  const items = [];
  const episodes = [];

  try {
    const urls = new Set();
    const pagesToFetch = [
      'https://v2.samehadaku.how/',
      'https://v2.samehadaku.how/anime-terbaru/',
    ];

    for (const pUrl of pagesToFetch) {
      try {
        const res = await fetchUrl(pUrl);
        const animeUrlRegex = /href=["'](https:\/\/v2\.samehadaku\.how\/anime\/[^"']+)["']/g;
        let match;
        while ((match = animeUrlRegex.exec(res.body)) !== null) {
          urls.add(match[1]);
        }
      } catch { /* ignore */ }
    }

    console.log(`[Samehadaku] Found ${urls.size} anime detail URLs across catalog.`);
    const urlList = Array.from(urls).slice(0, 35);

    await pMap(urlList, 5, async (detailUrl) => {
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

        const epLinkMatches = Array.from(detailHtml.matchAll(/href=["'](https:\/\/v2\.samehadaku\.how\/[^"']*episode[^"']*)["']/gi)).map(m => m[1]);
        const epUrls = Array.from(new Set(epLinkMatches));

        const cleanTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').replace(/Subtitle Indonesia/gi, '').trim() : 'Samehadaku Anime';
        const slug = slugify(cleanTitle);
        const animeId = `same-${slug}`;

        const rawScore = scoreMatch ? parseFloat(scoreMatch[1]) : 7.7;
        const score = isNaN(rawScore) ? 7.6 : rawScore;
        const rawSinop = sinopMatch ? sinopMatch[1].replace(/<[^>]+>/g, '').trim() : `${cleanTitle} subtitle Indonesia di Samehadaku.`;
        const posterUrl = posterMatch ? posterMatch[1] : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600';

        const sortedEpUrls = epUrls.reverse().slice(-50);
        const epCount = sortedEpUrls.length || 12;

        console.log(`[Samehadaku] Scraping 1080p video streams for ${cleanTitle} (${sortedEpUrls.length} episodes)...`);
        
        await pMap(sortedEpUrls, 4, async (epUrl, i) => {
          const epNum = i + 1;
          let streamUrl1080 = '';

          try {
            const epRes = await fetchUrl(epUrl);
            const epHtml = epRes.body;
            const epThumbnail = extractEpThumbnail(epHtml, posterUrl);

            // Extract all player options
            const optionMatches = [...epHtml.matchAll(/class=["'][^"']*east_player_option[^"']*["'][^>]*data-post=["'](\d+)["'][^>]*data-nume=["'](\d+)["'][^>]*data-type=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:li|div|a|span)/gi)];

            let targetPost = null, targetNume = null, targetType = 'schtml';

            // 1. Prioritize 1080p (Wibufile/Mega 1080p)
            const p1080 = optionMatches.filter(m => m[4].toLowerCase().includes('1080p'));
            if (p1080.length > 0) {
              const direct1080 = p1080.find(m => m[4].toLowerCase().includes('wibu') || m[4].toLowerCase().includes('mp4'));
              const choice = direct1080 || p1080[0];
              targetPost = choice[1];
              targetNume = choice[2];
              targetType = choice[3];
            } else {
              // 2. Fallback to 720p if 1080p not available
              const p720 = optionMatches.filter(m => m[4].toLowerCase().includes('720p'));
              if (p720.length > 0) {
                const choice = p720.find(m => m[4].toLowerCase().includes('wibu')) || p720[0];
                targetPost = choice[1];
                targetNume = choice[2];
                targetType = choice[3];
              } else if (optionMatches.length > 0) {
                targetPost = optionMatches[0][1];
                targetNume = optionMatches[0][2];
                targetType = optionMatches[0][3];
              }
            }

            if (targetPost && targetNume) {
              const ajaxRes = await postAjax(
                'https://v2.samehadaku.how/wp-admin/admin-ajax.php',
                { action: 'player_ajax', post: targetPost, nume: targetNume, type: targetType },
                epUrl
              );
              const iframeSrc = ajaxRes.match(/src=["']([^"']+)["']/i);
              if (iframeSrc) {
                streamUrl1080 = iframeSrc[1];
              }
            }

            // Fallback if AJAX yielded nothing
            if (!streamUrl1080) {
              const fallbackOption = epHtml.match(/data-post=["'](\d+)["']/i);
              if (fallbackOption) {
                const postId = fallbackOption[1];
                const ajaxRes = await postAjax(
                  'https://v2.samehadaku.how/wp-admin/admin-ajax.php',
                  { action: 'player_ajax', post: postId, nume: '1', type: 'schtml' },
                  epUrl
                );
                const iframeSrc = ajaxRes.match(/src=["']([^"']+)["']/i);
                if (iframeSrc) {
                  streamUrl1080 = iframeSrc[1];
                }
              }
            }
          } catch (e) {
            console.warn(`[Samehadaku] Failed to fetch ep video stream: ${epUrl}`, e.message);
          }

          const defaultStream = streamUrl1080 || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';

          episodes.push({
            id: `${animeId}-ep-${epNum}`,
            animeId: animeId,
            number: epNum,
            title: `Episode ${epNum}: ${cleanTitle}`,
            thumbnail: epThumbnail,
            duration: 1440,
            aired: new Date().toISOString().split('T')[0],
            sources: [
              { quality: '1080p', url: defaultStream },
              { quality: '720p', url: defaultStream },
              { quality: '480p', url: defaultStream },
            ],
          });
        });

        if (sortedEpUrls.length === 0) {
          for (let epNum = 1; epNum <= epCount; epNum++) {
            episodes.push({
              id: `${animeId}-ep-${epNum}`,
              animeId: animeId,
              number: epNum,
              title: `Episode ${epNum}: ${cleanTitle}`,
              thumbnail: posterUrl,
              duration: 1440,
              aired: new Date().toISOString().split('T')[0],
              sources: [
                { quality: '1080p', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
                { quality: '720p', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
                { quality: '480p', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
              ],
            });
          }
        }

        items.push({
          id: animeId,
          slug: slug,
          title: cleanTitle,
          titleEnglish: cleanTitle,
          titleJapanese: cleanTitle,
          synopsis: rawSinop,
          synopsisShort: rawSinop.slice(0, 120) + '...',
          poster: posterUrl,
          banner: posterUrl,
          genres: genres,
          status: 'ongoing',
          type: 'TV',
          year: 2026,
          season: 'Spring',
          studio: 'Samehadaku Studio',
          rating: 'PG-13',
          score: score,
          episodes: epCount,
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
    });
  } catch (err) {
    console.error('[Samehadaku] Scrape failed:', err.message);
  }

  return { items, episodes };
}

// ── Sokuja Scraper ───────────────────────────────────────────────────────────
async function scrapeSokuja() {
  const BASE = 'https://x6.sokuja.uk';
  console.log(`\n🔍 [Sokuja] Starting scrape from ${BASE}/ ...`);
  const items = [];
  const episodes = [];

  try {
    const animeDetailUrls = new Set();
    const sokujaPages = [
      `${BASE}/`,
      `${BASE}/anime/?status=ongoing&order=update`,
      `${BASE}/anime/?status=completed&order=update`,
      `${BASE}/anime/list-mode/`,
    ];

    for (const pUrl of sokujaPages) {
      try {
        const pRes = await fetchUrl(pUrl);
        const animeRe = /href="(\/anime\/[a-z0-9-]+-subtitle-indonesia\/)"/g;
        let am;
        while ((am = animeRe.exec(pRes.body)) !== null) {
          animeDetailUrls.add(`${BASE}${am[1]}`);
        }
      } catch { /* ignore */ }
    }

    console.log(`[Sokuja] Discovered ${animeDetailUrls.size} unique anime detail pages.`);
    const targetDetailUrls = Array.from(animeDetailUrls).slice(0, 100);

    // 3. Scrape each anime detail page concurrently
    await pMap(targetDetailUrls, 6, async (detailUrl) => {
      try {
        console.log(`[Sokuja] Fetching anime detail: ${detailUrl}`);
        const res = await fetchUrl(detailUrl);
        const detailHtml = res.body;

        // Parse JSON-LD TVSeries block
        const jsonLdMatches = Array.from(
          detailHtml.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)
        ).map(x => x[1]);

        let meta = null;
        for (const raw of jsonLdMatches) {
          try {
            const obj = JSON.parse(raw);
            if (obj['@type'] === 'TVSeries') { meta = obj; break; }
          } catch { /* skip malformed */ }
        }
        if (!meta) {
          console.warn(`[Sokuja] No TVSeries JSON-LD found for ${detailUrl}`);
          return;
        }

        const cleanTitle = (meta.name || 'Sokuja Anime')
          .replace(/Subtitle Indonesia/gi, '').trim();
        const slug = slugify(cleanTitle);
        const animeId = `sokuja-${slug}`;

        const rawScore = meta.aggregateRating?.ratingValue
          ? parseFloat(meta.aggregateRating.ratingValue) : 7.8;
        const score = isNaN(rawScore) ? 7.5 : rawScore;

        // Poster: JSON-LD image field
        const posterUrl = meta.image
          ? (meta.image.startsWith('http') ? meta.image : `${BASE}${meta.image}`)
          : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600';

        const synopsis = meta.description || `${cleanTitle} subtitle Indonesia di Sokuja.`;

        // Genres
        const rawGenres = Array.isArray(meta.genre) ? meta.genre : (meta.genre ? [meta.genre] : []);
        const genres = Array.from(
          new Set(rawGenres.map(normalizeGenre).filter(Boolean))
        );
        if (genres.length === 0) genres.push('Action', 'Fantasy');

        // Status from HTML (dt/dd pairs)
        const statusMatch = detailHtml.match(/<dt[^>]*>Status<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/i);
        const statusRaw = statusMatch ? statusMatch[1].trim().toLowerCase() : 'ongoing';
        const status = statusRaw.includes('complet') ? 'completed' : 'ongoing';

        // Type from HTML
        const typeMatch = detailHtml.match(/<dt[^>]*>Tipe<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/i);
        const typeTxt = typeMatch ? typeMatch[1].trim().toUpperCase() : 'TV';
        const animeType = typeTxt.includes('MOVIE') ? 'Movie' : 'TV';

        // Year
        const yearMatch = detailHtml.match(/<dt[^>]*>Tahun<\/dt>\s*<dd[^>]*>(\d{4})<\/dd>/i);
        const year = yearMatch ? parseInt(yearMatch[1]) : 2026;

        // Studio
        const studioMatch = detailHtml.match(/<dt[^>]*>Studio<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/i);
        const studio = studioMatch ? studioMatch[1].trim() : 'Sokuja Studio';

        // Episode links from detail page (pattern: /anime-slug-episode-N-subtitle-indonesia/)
        // We derive the anime's URL slug from the detail URL so we only pick up
        // this anime's episodes and ignore related/sidebar links for other shows.
        const animeUrlSlug = detailUrl.split('/anime/')[1]?.replace(/-subtitle-indonesia\/?$/, '') || slug;
        const epLinkRe = /href="(\/([^"]*)-episode-(\d+)-subtitle-indonesia\/)"/g;
        const epLinkMap = new Map(); // epNum -> epPath
        let em;
        while ((em = epLinkRe.exec(detailHtml)) !== null) {
          const epPath = em[1];
          const epSlugPart = em[2]; // the part before "-episode-N"
          const num = parseInt(em[3]);
          // Only include links whose slug matches this anime's slug
          if (epSlugPart !== animeUrlSlug) continue;
          if (!epLinkMap.has(num)) epLinkMap.set(num, epPath);
        }

        // Sort by episode number, ambil semua (max 50 episode terbaru)
        const sortedEpNums = Array.from(epLinkMap.keys()).sort((a, b) => a - b);
        const latestEpNums = sortedEpNums.slice(-50);
        const epCount = sortedEpNums.length || 12;

        console.log(`[Sokuja] Scraping ${latestEpNums.length} episodes for ${cleanTitle}...`);

        await pMap(latestEpNums, 4, async (epNum) => {
          const epPath = epLinkMap.get(epNum);
          const epUrl = `${BASE}${epPath}`;
          let streamUrl1080 = '';
          let streamUrl720  = '';
          let streamUrl480  = '';
          let epThumbnail = posterUrl;

          try {
            const epRes = await fetchUrl(epUrl);
            const epHtml = epRes.body;

            // Ekstrak thumbnail spesifik episode (og:image, JSON-LD, dll) dengan filter logo
            epThumbnail = extractEpThumbnail(epHtml, posterUrl);

            // Extract episodeId dari RSC payload (bisa escaped: \"episodeId\":12345)
            const epIdMatch = epHtml.match(/episodeId[^\d]*(\d+)/);
            if (epIdMatch) {
              const episodeId = epIdMatch[1];
              try {
                // Panggil API video-mirrors untuk dapat direct MP4 URLs
                const mirrorRes = await fetchUrl(
                  `https://x6.sokuja.uk/api/video-mirrors/?e=${episodeId}`,
                  { 'Referer': epUrl, 'Accept': 'application/json' }
                );
                const mirrorData = JSON.parse(mirrorRes.body);
                const mirrors = mirrorData.mirrors || [];
                for (const mirror of mirrors) {
                  if (!mirror.embedUrl) continue;
                  const q = (mirror.quality || '').toLowerCase();
                  if (q === '1080p' && !streamUrl1080) streamUrl1080 = mirror.embedUrl;
                  else if (q === '720p' && !streamUrl720) streamUrl720 = mirror.embedUrl;
                  else if (q === '480p' && !streamUrl480) streamUrl480 = mirror.embedUrl;
                }
                // Fallback: jika tidak ada quality label, gunakan urutan
                if (!streamUrl480 && !streamUrl720 && !streamUrl1080 && mirrors.length > 0) {
                  streamUrl480  = mirrors[0]?.embedUrl || '';
                  streamUrl720  = mirrors[1]?.embedUrl || mirrors[0]?.embedUrl || '';
                  streamUrl1080 = mirrors[2]?.embedUrl || mirrors[1]?.embedUrl || mirrors[0]?.embedUrl || '';
                }
              } catch (apiErr) {
                console.warn(`[Sokuja] video-mirrors API failed for episodeId ${episodeId}:`, apiErr.message);
              }
            }
          } catch (e) {
            console.warn(`[Sokuja] Failed to fetch episode ${epUrl}:`, e.message);
          }

          const fallback = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
          episodes.push({
            id: `${animeId}-ep-${epNum}`,
            animeId: animeId,
            number: epNum,
            title: `Episode ${epNum}: ${cleanTitle}`,
            thumbnail: epThumbnail,
            duration: 1440,
            aired: new Date().toISOString().split('T')[0],
            sources: [
              { quality: '1080p', url: streamUrl1080 || fallback },
              { quality: '720p',  url: streamUrl720  || fallback },
              { quality: '480p',  url: streamUrl480  || fallback },
            ],
          });
        });

        // If no episodes found, generate placeholders
        if (latestEpNums.length === 0) {
          const fallback = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
          for (let epNum = 1; epNum <= Math.min(epCount, 50); epNum++) {
            episodes.push({
              id: `${animeId}-ep-${epNum}`,
              animeId: animeId,
              number: epNum,
              title: `Episode ${epNum}: ${cleanTitle}`,
              thumbnail: posterUrl,
              duration: 1440,
              aired: new Date().toISOString().split('T')[0],
              sources: [
                { quality: '1080p', url: fallback },
                { quality: '720p',  url: fallback },
                { quality: '480p',  url: fallback },
              ],
            });
          }
        }

        items.push({
          id: animeId,
          slug: slug,
          title: cleanTitle,
          titleEnglish: cleanTitle,
          titleJapanese: meta.alternateName || cleanTitle,
          synopsis: synopsis,
          synopsisShort: synopsis.slice(0, 120) + '...',
          poster: posterUrl,
          banner: posterUrl,
          genres: genres,
          status: status,
          type: animeType,
          year: year,
          season: 'Spring',
          studio: studio,
          rating: 'PG-13',
          score: score,
          episodes: epCount,
          duration: 24,
          isFeatured: false,
          isTrending: true,
          isNewUpdate: status === 'ongoing',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error(`[Sokuja] Error processing ${detailUrl}:`, err.message);
      }
    });
  } catch (err) {
    console.error('[Sokuja] Scrape failed:', err.message);
  }

  return { items, episodes };
}

import { scrapeNekopoi } from './scrapeNekopoi.js';

// ── Main Execution ───────────────────────────────────────────────────────────
async function main() {
  console.log('====================================================');
  console.log('🚀 Yowanime Anime, Sokuja & Nekopoi Scraper Started');
  console.log('====================================================');

  const { items: otakudesuAnimes, episodes: otakudesuEpisodes } = await scrapeOtakudesu();
  const { items: samehadakuAnimes, episodes: samehadakuEpisodes } = await scrapeSamehadaku();
  const { items: sokujaAnimes, episodes: sokujaEpisodes } = await scrapeSokuja();
  const { items: nekopoiAnimes, episodes: nekopoiEpisodes } = await scrapeNekopoi();

  const allScrapedAnimes = [...otakudesuAnimes, ...samehadakuAnimes, ...sokujaAnimes, ...nekopoiAnimes];
  const allScrapedEpisodes = [...otakudesuEpisodes, ...samehadakuEpisodes, ...sokujaEpisodes, ...nekopoiEpisodes];

  console.log(`\n✅ Total scraped anime entries: ${allScrapedAnimes.length}`);
  console.log(`✅ Total scraped video episodes: ${allScrapedEpisodes.length}`);

  if (allScrapedAnimes.length === 0) {
    console.warn('⚠️ No anime scraped. Aborting merge.');
    return;
  }

  const mockFileContent = fs.readFileSync(MOCK_ANIME_PATH, 'utf8');

  // Merge animes
  const jsonStart = mockFileContent.indexOf('export const mockAnimes: Anime[] = ') + 'export const mockAnimes: Anime[] = '.length;
  const jsonEnd = mockFileContent.indexOf(';\n\n// ── Mock Episodes Generator');

  const existingAnimes = JSON.parse(mockFileContent.substring(jsonStart, jsonEnd));
  const animeMap = new Map();
  existingAnimes.forEach(a => animeMap.set(a.id, a));
  allScrapedAnimes.forEach(scraped => animeMap.set(scraped.id, scraped));

  const mergedAnimes = Array.from(animeMap.values());
  console.log(`Merged anime dataset count: ${mergedAnimes.length}`);

  // Merge episodes — baca dari backup JSON supaya tidak error parse TypeScript
  const scrapedEpJsonPath = path.join(__dirname, '../database/scraped_episodes.json');
  let existingEpisodes = [];
  try {
    if (fs.existsSync(scrapedEpJsonPath)) {
      existingEpisodes = JSON.parse(fs.readFileSync(scrapedEpJsonPath, 'utf8'));
    }
  } catch (e) {
    console.warn('Error reading existing scraped_episodes.json:', e.message);
  }

  const epMap = new Map();
  existingEpisodes.forEach(e => epMap.set(e.id, e));
  allScrapedEpisodes.forEach(e => epMap.set(e.id, e));

  const mergedEpisodes = Array.from(epMap.values());
  console.log(`Merged episodes dataset count: ${mergedEpisodes.length}`);

  const newContent = `import type { Anime } from '@/types/anime';
import type { Episode } from '@/types/episode';

/**
 * Official Anime Database - imported from offline database & live scrapers.
 * Total items: ${mergedAnimes.length}
 */
export const mockAnimes: Anime[] = ${JSON.stringify(mergedAnimes, null, 2)};

// ── Mock Episodes Generator ─────────────────────────────────
export const mockEpisodes: Episode[] = ${JSON.stringify(mergedEpisodes, null, 2)};

export function isDonghua(anime: { title?: string; titleEnglish?: string; titleJapanese?: string; studio?: string; synopsis?: string; genres?: string[] }): boolean {
  const text = \`\${anime.title || ''} \${anime.titleEnglish || ''} \${anime.titleJapanese || ''} \${anime.studio || ''} \${anime.synopsis || ''}\`.toLowerCase();
  return (
    text.includes('donghua') ||
    text.includes('chinese animation') ||
    text.includes('animasi cina') ||
    text.includes('bilibili') ||
    text.includes('tencent penguin') ||
    text.includes('fantasier animation') ||
    text.includes('sparkly key') ||
    text.includes('haoliners')
  );
}

export function getAllGenres(): string[] {
  const genresSet = new Set<string>();
  safeMockAnimes().forEach((a) => a.genres.forEach((g) => genresSet.add(g)));
  genresSet.delete('Hentai');
  return Array.from(genresSet).sort();
}

/** Filter out hentai/adult anime and Donghua from general feeds */
export function safeMockAnimes(): Anime[] {
  return mockAnimes.filter(
    (a) => !a.genres.includes('Hentai') && a.rating !== '18+' && a.rating !== 'Rx' && !isDonghua(a)
  );
}

export function getFeaturedAnime(): Anime | null {
  return safeMockAnimes().find((a) => a.isFeatured) || safeMockAnimes()[0] || null;
}

export function getTrendingAnimes(): Anime[] {
  return safeMockAnimes().filter((a) => a.isTrending).slice(0, 10);
}

export function getNewUpdateAnimes(): Anime[] {
  return safeMockAnimes().slice(0, 12);
}
`;

  fs.writeFileSync(MOCK_ANIME_PATH, newContent, 'utf8');
  console.log(`🎉 Successfully updated ${MOCK_ANIME_PATH}!`);

  const scrapedAnimeJsonPath = path.join(__dirname, '../database/scraped_animes.json');
  fs.writeFileSync(scrapedAnimeJsonPath, JSON.stringify(allScrapedAnimes, null, 2), 'utf8');
  console.log(`📁 Saved scraped anime backup to ${scrapedAnimeJsonPath}`);

  fs.writeFileSync(scrapedEpJsonPath, JSON.stringify(allScrapedEpisodes, null, 2), 'utf8');
  console.log(`📁 Saved scraped episodes backup to ${scrapedEpJsonPath}`);
}

main().catch(err => {
  console.error('Fatal error in scraper:', err);
});
