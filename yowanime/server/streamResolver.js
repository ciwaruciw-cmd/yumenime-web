/**
 * streamResolver.js
 * Real-time video stream resolver for Yowanime.
 * Pulls genuine 1080p and 720p streaming sources from:
 * - Samehadaku (https://v2.samehadaku.how/)
 * - Otakudesu (https://otakudesu.blog/)
 * - Sokuja (https://x6.sokuja.uk/)
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCRAPED_EP_PATH = [
  path.join(__dirname, '../database/scraped_episodes.json'),
  path.join(process.cwd(), 'database/scraped_episodes.json'),
  path.join(process.cwd(), 'yowanime/database/scraped_episodes.json'),
  path.join(__dirname, 'scraped_episodes.json'),
].find((p) => fs.existsSync(p)) || path.join(__dirname, '../database/scraped_episodes.json');

// In-memory cache for fast stream lookups
const streamMemoryCache = new Map();

function isDummyStream(url) {
  if (!url) return true;
  return (
    url.includes('w3.org') ||
    url.includes('zencdn') ||
    url.includes('w3schools') ||
    url.includes('commondatastorage') ||
    url.includes('interactive-examples.mdn') ||
    url.includes('filedon.co') ||
    url.includes('files.im') ||
    url.includes('mega.nz') ||
    url.includes('gdriveplayer.me') ||
    url.includes('meownime.ltd') ||
    url.includes('link.desustream.com') ||
    url.includes('otakufiles.net') ||
    url.includes('krakenfiles.com') ||
    url.includes('.mkv') ||
    (url.includes('googlevideo.com') && !url.includes('live'))
  );
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
        ...customHeaders,
      },
      rejectUnauthorized: false,
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
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.setTimeout(25000, () => {
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
    const req = client.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
          'X-Requested-With': 'XMLHttpRequest',
          Referer: referer || url,
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve(d));
      }
    );
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Timeout AJAX ${url}`));
    });
    req.write(postData);
    req.end();
  });
}

async function resolveStreamUrl(streamUrl) {
  if (!streamUrl) return '';
  const cleanUrl = streamUrl.replace(/&amp;/g, '&');
  try {
    const res = await fetchUrl(cleanUrl, { Referer: 'https://otakudesu.blog/' });
    const html = res.body;
    if (!html) return cleanUrl;

    const mp4Match =
      html.match(/const\s+videoURL\s*=\s*["']([^"']+)["']/i) ||
      html.match(/video(?:Player)?\.src\s*=\s*["']([^"']+)["']/i) ||
      html.match(/file\s*:\s*["']([^"']+)["']/i) ||
      html.match(/https?:\/\/[^\s"'<>]+\.odcloud\.net\/[^\s"'<>]+\.mp4/i) ||
      html.match(/https?:\/\/[^\s"'<>]+\.(?:mp4|m3u8)[^\s"'<>]*/i) ||
      html.match(/<source[^>]+src=["'](https?:\/\/[^"']+\.mp4[^"']*)["']/i);
    if (mp4Match) return (mp4Match[1] || mp4Match[0]).replace(/&amp;/g, '&');

    const bloggerMatch =
      html.match(/<iframe[^>]+src=["'](https:\/\/www\.blogger\.com\/video\.g\?[^"']+)["']/i) ||
      html.match(/https:\/\/www\.blogger\.com\/video\.g\?token=[^\s"'<>]+/i);
    if (bloggerMatch) return (bloggerMatch[1] || bloggerMatch[0]).replace(/&amp;/g, '&');

    const genericIframe = html.match(/<iframe[^>]+src=["'](https?:\/\/[^"']+)["']/i);
    if (genericIframe && !genericIframe[1].includes('desustream')) {
      return genericIframe[1].replace(/&amp;/g, '&');
    }
  } catch {
    /* ignore */
  }
  return cleanUrl;
}

function cleanTitle(t) {
  return (t || '')
    .toLowerCase()
    .replace(/season\s*\d+|s\d+|\d+(?:st|nd|rd|th)\s*season/gi, '')
    .replace(/sub\s*indo|subtitle\s*indonesia/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

/**
 * Resolve live episode video streams from Samehadaku (1080p & 720p)
 */
async function resolveFromSamehadaku(title, epNumber) {
  try {
    const searchWord = cleanTitle(title).split(/\s+/).slice(0, 3).join(' ');
    const searchUrl = `https://v2.samehadaku.how/?s=${encodeURIComponent(searchWord)}`;
    const searchRes = await fetchUrl(searchUrl);
    const searchHtml = searchRes.body;

    // Find anime detail link
    const animeLinks = [...searchHtml.matchAll(/<a[^>]+href=["'](https:\/\/v2\.samehadaku\.how\/anime\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
    if (animeLinks.length === 0) return null;

    const detailUrl = animeLinks[0][1];
    const detailRes = await fetchUrl(detailUrl);
    const detailHtml = detailRes.body;

    // Find all episode links
    const epLinks = [...detailHtml.matchAll(/<a[^>]+href=["'](https:\/\/v2\.samehadaku\.how\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
    const epRegex = new RegExp(`(?:\\bepisode[\\s_-]*|\\bep[\\s_.-]*|-episode-|^)0*${epNumber}(?:\\b|[^0-9]|$)`, 'i');
    const targetEp = epLinks.find((l) => {
      const text = l[2].toLowerCase();
      const href = l[1].toLowerCase();
      return (
        (epRegex.test(text) || epRegex.test(href)) &&
        !href.includes('/anime/') &&
        !href.includes('/genre/')
      );
    }) || epLinks.find((l) => l[1].includes(`-episode-${epNumber}/`));

    if (!targetEp) return null;

    const epUrl = targetEp[1];
    const epRes = await fetchUrl(epUrl);
    const epHtml = epRes.body;

    const optionMatches = [
      ...epHtml.matchAll(
        /class=["'][^"']*east_player_option[^"']*["'][^>]*data-post=["'](\d+)["'][^>]*data-nume=["'](\d+)["'][^>]*data-type=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:li|div|a|span)/gi
      ),
    ];

    async function fetchOption(choice) {
      if (!choice) return '';
      try {
        const ajaxRes = await postAjax(
          'https://v2.samehadaku.how/wp-admin/admin-ajax.php',
          { action: 'player_ajax', post: choice[1], nume: choice[2], type: choice[3] },
          epUrl
        );
        const iframeSrc = ajaxRes.match(/src=["']([^"']+)["']/i);
        return iframeSrc ? iframeSrc[1] : '';
      } catch {
        return '';
      }
    }

    // 1080p
    let streamUrl1080 = '';
    const p1080 = optionMatches.filter((m) => m[4].toLowerCase().includes('1080p'));
    if (p1080.length > 0) {
      const choice = p1080.find((m) => m[4].toLowerCase().includes('wibu') || m[4].toLowerCase().includes('mp4')) || p1080[0];
      streamUrl1080 = await fetchOption(choice);
    }

    // 720p
    let streamUrl720 = '';
    const p720 = optionMatches.filter((m) => m[4].toLowerCase().includes('720p'));
    if (p720.length > 0) {
      const choice = p720.find((m) => m[4].toLowerCase().includes('wibu') || m[4].toLowerCase().includes('mp4')) || p720[0];
      streamUrl720 = await fetchOption(choice);
    }

    if (streamUrl1080) streamUrl1080 = await resolveStreamUrl(streamUrl1080);
    if (streamUrl720) streamUrl720 = await resolveStreamUrl(streamUrl720);

    const final1080 = streamUrl1080 || streamUrl720;
    const final720 = streamUrl720 || streamUrl1080;

    if (final1080 || final720) {
      return {
        provider: 'Samehadaku',
        sources: [
          { quality: '1080p', url: final1080 },
          { quality: '720p', url: final720 },
          { quality: '480p', url: final720 },
        ],
      };
    }
  } catch (err) {
    // continue to next provider
  }
  return null;
}

/**
 * Resolve live episode video streams from Otakudesu (720p & 1080p)
 */
async function resolveFromOtakudesu(title, epNumber) {
  try {
    const searchWord = cleanTitle(title).split(/\s+/).slice(0, 3).join(' ');
    const searchUrl = `https://otakudesu.blog/?s=${encodeURIComponent(searchWord)}&post_type=anime`;
    const searchRes = await fetchUrl(searchUrl);
    const searchHtml = searchRes.body;

    const animeLinks = [...searchHtml.matchAll(/<a[^>]+href=["'](https:\/\/otakudesu\.blog\/anime\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
    const isSeason2 = /season\s*2|s2|2nd\s*season/i.test(title);
    const matchedLink = animeLinks.find((l) => {
      const isS2 = /s2|season\s*2/i.test(l[1]) || /season\s*2/i.test(l[2]);
      return isSeason2 ? isS2 : !isS2;
    }) || animeLinks[0];

    if (!matchedLink) return null;

    const detailUrl = matchedLink[1];
    const detailRes = await fetchUrl(detailUrl);
    const detailHtml = detailRes.body;

    // Extract episode anchor links
    const epMatches = [...detailHtml.matchAll(/<a[^>]+href=["'](https:\/\/otakudesu\.blog\/episode\/[^"']+)["'][^>]*>(.*?)<\/a>/gi)];
    const epRegex = new RegExp(`(?:\\bepisode[\\s_-]*|\\bep[\\s_.-]*|-episode-|^)0*${epNumber}(?:\\b|[^0-9]|$)`, 'i');
    const targetEp = epMatches.find((m) => {
      const text = m[2].toLowerCase();
      const href = m[1].toLowerCase();
      return epRegex.test(text) || epRegex.test(href);
    }) || epMatches.find((m) => m[1].includes(`-episode-${epNumber}-`));

    if (!targetEp) return null;

    const epUrl = targetEp[1];
    const epRes = await fetchUrl(epUrl);
    const epHtml = epRes.body;

    // 1. Direct iframe player on page (fastest & most reliable)
    const directIframeMatch = epHtml.match(/<iframe[^>]+src=["'](https?:\/\/[^"']+)["']/i);
    let directStream = directIframeMatch ? directIframeMatch[1] : null;
    if (directStream) {
      directStream = await resolveStreamUrl(directStream);
    }

    // 2. Fallback to AJAX options if direct iframe not found or not direct playable
    let streamUrl1080 = directStream;
    let streamUrl720 = directStream;

    const isDirect = (url) => url && (url.includes('.mp4') || url.includes('.m3u8') || url.includes('odcloud.net'));

    if (!directStream || !isDirect(directStream)) {
      const allContents = [...epHtml.matchAll(/data-content=["']([^"']+)["']/gi)];
      let dataContent1080 = null;
      let dataContent720 = null;
      for (const m of allContents) {
        try {
          const dec = JSON.parse(Buffer.from(m[1], 'base64').toString('utf-8'));
          if (dec.q === '1080p' && !dataContent1080) dataContent1080 = m[1];
          if (dec.q === '720p' && !dataContent720) dataContent720 = m[1];
        } catch {}
      }

      const actionMatches = [...epHtml.matchAll(/action:\s*["']([a-f0-9]{32})["']/gi)].map((m) => m[1]);
      const streamAction = actionMatches[0] || '2a3505c93b0035d3f455df82bf976b84';
      const nonceAction = actionMatches[1] || 'aa1208d27f29ca340c92c66d1926f13f';

      async function resolveOtaku(dc) {
        if (!dc) return '';
        try {
          const nonceRes = await postAjax('https://otakudesu.blog/wp-admin/admin-ajax.php', { action: nonceAction }, epUrl);
          const nonce = JSON.parse(nonceRes).data;
          const payload = JSON.parse(Buffer.from(dc, 'base64').toString('utf-8'));
          const streamRes = await postAjax(
            'https://otakudesu.blog/wp-admin/admin-ajax.php',
            { ...payload, nonce, action: streamAction },
            epUrl
          );
          const iframeHtml = Buffer.from(JSON.parse(streamRes).data, 'base64').toString('utf-8');
          const srcMatch = iframeHtml.match(/src=["']([^"']+)["']/i);
          if (srcMatch) return await resolveStreamUrl(srcMatch[1]);
        } catch {}
        return '';
      }

      const ajax1080 = dataContent1080 ? await resolveOtaku(dataContent1080) : '';
      const ajax720 = dataContent720 ? await resolveOtaku(dataContent720) : '';

      if (ajax1080 && isDirect(ajax1080)) streamUrl1080 = ajax1080;
      if (ajax720 && isDirect(ajax720)) streamUrl720 = ajax720;
    }

    const final1080 = streamUrl1080 || streamUrl720;
    const final720 = streamUrl720 || streamUrl1080;

    if (final1080 || final720) {
      return {
        provider: 'Otakudesu',
        sources: [
          { quality: '1080p', url: final1080 },
          { quality: '720p', url: final720 },
          { quality: '480p', url: final720 },
        ],
      };
    }
  } catch (err) {
    // continue to next provider
  }
  return null;
}

/**
 * Resolve live episode video streams from Sokuja (1080p & 720p)
 */
async function resolveFromSokuja(title, epNumber) {
  try {
    const cleanT = cleanTitle(title);
    if (cleanT.includes('overflow') && epNumber >= 1 && epNumber <= 8) {
      const sokujaMp4 = `https://storages.sokuja.uk/2025-fall/ovrflw/SOKUJA.NET-OVRFLW-${epNumber}.720p.mp4`;
      return {
        provider: 'Sokuja',
        sources: [
          { quality: '1080p', url: sokujaMp4 },
          { quality: '720p',  url: sokujaMp4 },
          { quality: '480p',  url: sokujaMp4 },
        ],
      };
    }

    const slug = cleanT.replace(/\s+/g, '-');
    const epUrl = `https://x6.sokuja.uk/${slug}-episode-${epNumber}-subtitle-indonesia/`;
    const res = await fetchUrl(epUrl);
    if (res.statusCode === 200 && res.body) {
      const epIdMatch = res.body.match(/episodeId[^\d]*(\d+)/);
      if (epIdMatch) {
        const mirrorRes = await fetchUrl(`https://x6.sokuja.uk/api/video-mirrors/?e=${epIdMatch[1]}`, {
          Referer: epUrl,
          Accept: 'application/json',
        });
        const data = JSON.parse(mirrorRes.body);
        let stream1080 = '';
        let stream720 = '';
        let stream480 = '';
        (data.mirrors || []).forEach((m) => {
          if (!m.embedUrl) return;
          const q = (m.quality || '').toLowerCase();
          if (q === '1080p' && !stream1080) stream1080 = m.embedUrl;
          else if (q === '720p' && !stream720) stream720 = m.embedUrl;
          else if (q === '480p' && !stream480) stream480 = m.embedUrl;
        });

        const final1080 = stream1080 || stream720;
        const final720 = stream720 || stream1080;
        if (final1080 || final720) {
          return {
            provider: 'Sokuja',
            sources: [
              { quality: '1080p', url: final1080 },
              { quality: '720p', url: final720 },
              { quality: '480p', url: stream480 || final720 },
            ],
          };
        }
      }
    }
  } catch (err) {
    // ignore
  }
  return null;
}

/**
 * Resolve live episode video streams from Nekopoi (Bypassing ISP block via DoH / Cloudflare SNI)
 */
async function resolveFromNekopoi(title, epNumber) {
  try {
    const clean = cleanTitle(title)
      .replace(/nekopoi|edition|uncensored|sub\s*indo|subtitle\s*indonesia/gi, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();
    const words = clean.split(/\s+/).filter(w => w.length > 2);
    const q = words.slice(0, 3).join(' ') || words[0] || title;

    const nekopoiIps = ['104.21.14.33', '172.67.157.174'];
    let nekopoiHost = nekopoiIps[0];

    const fetchNekopoi = (pathStr) => {
      return new Promise((resolve, reject) => {
        const req = https.request({
          host: nekopoiHost,
          port: 443,
          path: pathStr,
          servername: 'nekopoi.care',
          headers: {
            'Host': 'nekopoi.care',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          rejectUnauthorized: false
        }, res => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => resolve({ statusCode: res.statusCode, body: data, headers: res.headers }));
        });
        req.on('error', reject);
        req.setTimeout(8000, () => { req.destroy(); reject(new Error('Timeout')); });
        req.end();
      });
    };

    const searchRes = await fetchNekopoi('/search/' + encodeURIComponent(q));
    const searchHtml = searchRes.body || '';

    const postLinks = [...searchHtml.matchAll(/<a\s+href=["'](https?:\/\/nekopoi\.care\/[^"']+)["'][^>]*class=["']nk-search-item["']/gi)]
      .map(m => m[1]);

    const epPattern = new RegExp('(?:episode|ep|ova)[-_\\s]*0*' + epNumber + '(?![0-9])', 'i');
    let targetLink = postLinks.find(link => epPattern.test(link));

    if (!targetLink && epNumber === 1 && postLinks.length > 0) {
      targetLink = postLinks.find(l => !l.includes('/hentai/'));
    }

    if (!targetLink) return null;

    const urlObj = new URL(targetLink);
    const epRes = await fetchNekopoi(urlObj.pathname);
    const epHtml = epRes.body || '';

    const iframes = [...epHtml.matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi)]
      .map(m => m[1])
      .filter(u => u.includes('streampoi') || u.includes('playmogo'));

    const streampoi = iframes.find(u => u.includes('streampoi'));
    const playmogo = iframes.find(u => u.includes('playmogo'));
    const bestEmbed = streampoi || playmogo;

    if (bestEmbed) {
      return {
        provider: 'Nekopoi',
        sources: [
          { quality: '1080p', url: bestEmbed },
          { quality: '720p',  url: bestEmbed },
          { quality: '480p',  url: bestEmbed }
        ]
      };
    }
  } catch (err) {
    // silently catch
  }
  return null;
}

/**
 * Main function to resolve 1080p & 720p streams for any anime title & episode.
 */
export async function resolveStreamForEpisode({ animeId, animeTitle, romaji, episodeNumber }) {
  const epNum = Number(episodeNumber) || 1;
  const cacheKey = `${animeTitle || animeId}:${epNum}`.toLowerCase();

  // 1. Check in-memory cache
  if (streamMemoryCache.has(cacheKey)) {
    return streamMemoryCache.get(cacheKey);
  }

  // 2. Check local database (scraped_episodes.json)
  try {
    if (fs.existsSync(SCRAPED_EP_PATH)) {
      const allEps = JSON.parse(fs.readFileSync(SCRAPED_EP_PATH, 'utf8'));
      const qTokens = cleanTitle(animeTitle || animeId).split(/\s+/).filter((w) => w.length > 1);

      let found = allEps.find((e) => {
        if (e.number !== epNum) return false;
        if (animeId && (e.animeId === animeId || e.animeId === `otaku-${animeId}` || e.animeId === `same-${animeId}` || e.animeId === `sokuja-${animeId}`)) return true;
        return false;
      });

      if (!found && qTokens.length > 0) {
        let bestScore = 0;
        for (const e of allEps) {
          if (e.number !== epNum) continue;
          const epTitleClean = cleanTitle(e.title || e.animeId || '');
          const epTokens = epTitleClean.split(/\s+/).filter((w) => w.length > 1);
          let matchCount = 0;
          for (const token of qTokens) {
            if (epTokens.some((et) => et === token || et.includes(token) || token.includes(et))) {
              matchCount++;
            }
          }
          const score = matchCount / qTokens.length;
          if (score > bestScore && score >= 0.85 && matchCount === qTokens.length) {
            bestScore = score;
            found = e;
          }
        }
      }

      if (found && found.sources && found.sources.length > 0) {
        const hasReal1080 = found.sources.some((s) => s.quality === '1080p' && !isDummyStream(s.url));
        const hasReal720 = found.sources.some((s) => s.quality === '720p' && !isDummyStream(s.url));
        const s1080 = found.sources.find((s) => s.quality === '1080p')?.url;
        const s720 = found.sources.find((s) => s.quality === '720p')?.url;
        const real1080 = (!isDummyStream(s1080)) ? s1080 : null;
        const real720 = (!isDummyStream(s720)) ? s720 : null;
        const bestReal = real1080 || real720;

        if (bestReal) {
          let resolved1080 = real1080 || bestReal;
          let resolved720 = real720 || bestReal;
          if (resolved1080.includes('desustream')) {
            resolved1080 = await resolveStreamUrl(resolved1080);
          }
          if (resolved720.includes('desustream')) {
            resolved720 = (resolved1080 && resolved1080.startsWith('/api/stream/video')) ? resolved1080 : await resolveStreamUrl(resolved720);
          }

          const res = {
            success: true,
            provider: 'database',
            animeTitle: animeTitle || animeId,
            episodeNumber: epNum,
            sources: [
              { quality: '1080p', url: resolved1080 || bestReal },
              { quality: '720p',  url: resolved720  || bestReal },
              { quality: '480p',  url: resolved720  || bestReal },
            ],
          };
          streamMemoryCache.set(cacheKey, res);
          return res;
        }
      }
    }
  } catch (err) {
    console.warn('[streamResolver] Database lookup error:', err.message);
  }

  // 3. Live resolution across providers (Prioritize Direct MP4 for Custom Player)
  const SCRAPED_ANIME_PATH = path.join(process.cwd(), 'database', 'scraped_animes.json');

  function getCandidateTitles(qTitle, qId, qRomaji) {
    const list = [];
    const seen = new Set();
    const add = (t) => {
      if (!t || typeof t !== 'string') return;
      const clean = t.trim();
      if (clean.length >= 2 && !seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        list.push(clean);
      }
    };
    add(qRomaji);
    add(qTitle);
    add(qId);
    try {
      if (fs.existsSync(SCRAPED_ANIME_PATH)) {
        const all = JSON.parse(fs.readFileSync(SCRAPED_ANIME_PATH, 'utf8'));
        const qClean = cleanTitle(qTitle || qRomaji || qId);
        for (const a of all) {
          const aTitles = [a.id, a.slug, a.title, a.titleEnglish, a.titleJapanese, a.titleRomaji].filter(Boolean);
          const match = (qId && (a.id === qId || a.slug === qId)) ||
            aTitles.some((t) => {
              const tc = cleanTitle(t);
              return tc === qClean || (tc.length >= 6 && qClean.length >= 6 && (tc.includes(qClean) || qClean.includes(tc)));
            });
          if (match) {
            aTitles.forEach((t) => {
              t.split(/[,/]/).forEach((sub) => add(sub));
            });
            break;
          }
        }
      }
    } catch {}
    return list;
  }

  const candidateTitles = getCandidateTitles(animeTitle, animeId, romaji);

  const isPlayableDirect = (res) => {
    if (!res || !Array.isArray(res.sources) || res.sources.length === 0) return false;
    return res.sources.some(
      (s) => s.url && !isDummyStream(s.url) && !s.url.includes('mega.nz') && (s.url.includes('.mp4') || s.url.includes('.m3u8') || s.url.includes('odcloud.net') || s.url.includes('archive.org') || s.url.includes('sokuja'))
    );
  };

  let result = null;

  // Step A: Search for direct MP4 across all candidate titles
  for (const candTitle of candidateTitles) {
    // Try Otakudesu (most reliable provider for direct 720p/1080p MP4 streams via odcloud)
    const otakuRes = await resolveFromOtakudesu(candTitle, epNum);
    if (isPlayableDirect(otakuRes)) {
      result = otakuRes;
      break;
    }

    // Try Sokuja
    const sokuRes = await resolveFromSokuja(candTitle, epNum);
    if (isPlayableDirect(sokuRes)) {
      result = sokuRes;
      break;
    }

    // Try Samehadaku
    const sameRes = await resolveFromSamehadaku(candTitle, epNum);
    if (isPlayableDirect(sameRes)) {
      result = sameRes;
      break;
    }
  }

  // Step B: If no direct MP4 found, fall back to any resolved stream
  if (!result) {
    for (const candTitle of candidateTitles) {
      const sameRes = await resolveFromSamehadaku(candTitle, epNum);
      if (sameRes && sameRes.sources && sameRes.sources.length > 0) {
        result = sameRes;
        break;
      }
      const otakuRes = await resolveFromOtakudesu(candTitle, epNum);
      if (otakuRes && otakuRes.sources && otakuRes.sources.length > 0) {
        result = otakuRes;
        break;
      }
      const sokuRes = await resolveFromSokuja(candTitle, epNum);
      if (sokuRes && sokuRes.sources && sokuRes.sources.length > 0) {
        result = sokuRes;
        break;
      }
      const nekoRes = await resolveFromNekopoi(candTitle, epNum);
      if (nekoRes && nekoRes.sources && nekoRes.sources.length > 0) {
        result = nekoRes;
        break;
      }
    }
  }

  if (result) {
    const finalResult = {
      success: true,
      provider: result.provider,
      animeTitle: animeTitle || animeId,
      episodeNumber: epNum,
      sources: result.sources,
    };
    streamMemoryCache.set(cacheKey, finalResult);

    // Also persist into scraped_episodes.json if possible
    try {
      if (fs.existsSync(SCRAPED_EP_PATH)) {
        const allEps = JSON.parse(fs.readFileSync(SCRAPED_EP_PATH, 'utf8'));
        const existingIdx = allEps.findIndex(
          (e) => (e.animeId === animeId || cleanTitle(e.title || '').includes(cleanTitle(animeTitle || animeId))) && e.number === epNum
        );
        if (existingIdx !== -1) {
          allEps[existingIdx].sources = result.sources;
          fs.writeFileSync(SCRAPED_EP_PATH, JSON.stringify(allEps, null, 2), 'utf8');
        }
      }
    } catch {
      /* ignore */
    }

    return finalResult;
  }

  return {
    success: false,
    message: 'Stream not found on Otakudesu, Samehadaku, or Sokuja.',
    sources: [],
  };
}
