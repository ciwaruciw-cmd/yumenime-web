/**
 * Express Backend API Server for Yowanime
 * Connects directly to PostgreSQL database.
 */

import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { resolveStreamForEpisode } from './streamResolver.js';
import { runScrape, startScheduler, getStatus as getScrapeStatus, resetStatus as resetScrapeStatus } from './autoScraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDbPath(filename) {
  const candidates = [
    path.join(__dirname, '../database', filename),
    path.join(process.cwd(), 'database', filename),
    path.join(process.cwd(), 'yowanime/database', filename),
    path.join(__dirname, filename),
  ];
  return candidates.find((c) => fs.existsSync(c)) || candidates[0];
}

const NOTIF_FILE = getDbPath('notifications.json');

function readLocalNotifs() {
  try {
    const f = getDbPath('notifications.json');
    if (fs.existsSync(f)) {
      return JSON.parse(fs.readFileSync(f, 'utf8'));
    }
  } catch {}
  return [];
}

function writeLocalNotifs(notifs) {
  try {
    const f = getDbPath('notifications.json');
    fs.writeFileSync(f, JSON.stringify(notifs, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed to write local notifs:', err);
  }
}

let _scrapedEpsCache = null;
function getScrapedEpisodes() {
  if (!_scrapedEpsCache) {
    const p = getDbPath('scraped_episodes.json');
    if (fs.existsSync(p)) {
      try {
        _scrapedEpsCache = JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (e) {
        console.error('Failed to parse scraped_episodes.json:', e);
        _scrapedEpsCache = [];
      }
    } else {
      _scrapedEpsCache = [];
    }
  }
  return _scrapedEpsCache;
}

let _scrapedAnimesCache = null;
function getScrapedAnimes() {
  if (!_scrapedAnimesCache) {
    const p = getDbPath('scraped_animes.json');
    if (fs.existsSync(p)) {
      try {
        _scrapedAnimesCache = JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (e) {
        console.error('Failed to parse scraped_animes.json:', e);
        _scrapedAnimesCache = [];
      }
    } else {
      _scrapedAnimesCache = [];
    }
  }
  return _scrapedAnimesCache;
}

dotenv.config();

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'yowanime-jwt-secret-key-2026-production';

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://yowa:yowapassword@localhost:5432/yowanime',
});

app.use(cors());
app.use(express.json());

// Auto-initialize PostgreSQL tables if database is fresh (e.g. on Neon)
let dbInitialized = false;
async function ensureDbInitialized() {
  if (dbInitialized) return;
  try {
    const check = await pool.query("SELECT to_regclass('public.users') AS exists");
    if (!check.rows[0]?.exists) {
      console.log('[DB] Fresh database detected. Applying schema.sql...');
      const schemaFile = getDbPath('schema.sql');
      if (fs.existsSync(schemaFile)) {
        const sql = fs.readFileSync(schemaFile, 'utf8');
        await pool.query(sql);
        console.log('[DB] Successfully applied schema.sql!');
      }
    }
    dbInitialized = true;
  } catch (err) {
    console.warn('[DB] Auto-migration check warning:', err.message);
  }
}

app.use(async (_req, _res, next) => {
  if (!dbInitialized) {
    ensureDbInitialized().catch(() => {});
  }
  next();
});

// ── Authentication & Authorization Middlewares ───────────────────────────────

/**
 * Express middleware to authenticate JWT token.
 * Extracts user identity from cryptographically verified token.
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) {
    return res.status(401).json({ error: 'Format token tidak valid.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid atau telah kedaluwarsa.' });
  }
}

/**
 * Express middleware to enforce admin role.
 * Verifies role directly against database for authoritative source of truth.
 */
export async function requireAdmin(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Akses ditolak. Belum terautentikasi.' });
  }

  try {
    const userRes = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User tidak ditemukan di sistem.' });
    }

    const currentRole = userRes.rows[0].role;
    if (currentRole !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Diperlukan hak akses Admin.' });
    }

    req.user.role = 'admin';
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Gagal memverifikasi hak akses admin.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────

// Healthcheck
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', dbTime: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/animes (list, filter, sort, paginate)
app.get('/api/animes', async (req, res) => {
  try {
    const { genre, status, year, type, search, sort = 'latest', page = 1, pageSize = 12 } = req.query;

    let query = `
      SELECT a.*, ARRAY_AGG(g.name) AS genres
      FROM animes a
      LEFT JOIN anime_genres ag ON a.id = ag.anime_id
      LEFT JOIN genres g ON ag.genre_id = g.id
      WHERE 1=1
    `;
    const params = [];
    let paramIdx = 1;

    if (genre) {
      query += ` AND a.id IN (
        SELECT ag2.anime_id FROM anime_genres ag2 JOIN genres g2 ON ag2.genre_id = g2.id WHERE g2.name = $${paramIdx}
      )`;
      params.push(genre);
      paramIdx++;
    }

    if (status) {
      query += ` AND a.status = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }

    if (year) {
      query += ` AND a.year = $${paramIdx}`;
      params.push(Number(year));
      paramIdx++;
    }

    if (type) {
      query += ` AND a.type = $${paramIdx}`;
      params.push(type);
      paramIdx++;
    }

    if (search) {
      query += ` AND (LOWER(a.title) LIKE $${paramIdx} OR LOWER(a.title_english) LIKE $${paramIdx} OR LOWER(a.synopsis) LIKE $${paramIdx})`;
      params.push(`%${String(search).toLowerCase()}%`);
      paramIdx++;
    }

    query += ` GROUP BY a.id`;

    // Sorting
    if (sort === 'score') {
      query += ` ORDER BY a.score DESC`;
    } else if (sort === 'title') {
      query += ` ORDER BY a.title ASC`;
    } else if (sort === 'popular') {
      query += ` ORDER BY a.score DESC`;
    } else {
      query += ` ORDER BY a.updated_at DESC`;
    }

    // Pagination
    const limit = Number(pageSize);
    const offset = (Number(page) - 1) * limit;

    query += ` LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Count total query
    const countResult = await pool.query(`SELECT COUNT(*) FROM animes`);
    const total = parseInt(countResult.rows[0].count, 10);

    res.json({
      data: result.rows,
      total,
      page: Number(page),
      pageSize: limit,
      hasMore: offset + limit < total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/animes/:id
app.get('/api/animes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const animeRes = await pool.query(`
      SELECT a.*, ARRAY_AGG(g.name) AS genres
      FROM animes a
      LEFT JOIN anime_genres ag ON a.id = ag.anime_id
      LEFT JOIN genres g ON ag.genre_id = g.id
      WHERE a.id = $1 OR a.slug = $1
      GROUP BY a.id
    `, [id]);

    if (animeRes.rows.length === 0) {
      return res.status(404).json({ error: 'Anime not found' });
    }

    const anime = animeRes.rows[0];

    // Fetch episodes
    const epRes = await pool.query(`
      SELECT e.*, 
        JSON_AGG(JSON_BUILD_OBJECT('quality', v.quality, 'url', v.url)) AS sources
      FROM episodes e
      LEFT JOIN video_sources v ON e.id = v.episode_id
      WHERE e.anime_id = $1
      GROUP BY e.id
      ORDER BY e.episode_number ASC
    `, [anime.id]);

    if (epRes.rows.length > 0) {
      anime.episodesList = epRes.rows;
    } else {
      const totalEp = anime.episodes > 0 ? Math.min(anime.episodes, 24) : 12;
      anime.episodesList = Array.from({ length: totalEp }, (_, i) => ({
        id: `${anime.id}-ep-${i + 1}`,
        anime_id: anime.id,
        episode_number: i + 1,
        title: `Episode ${i + 1}: ${anime.title}`,
        thumbnail: anime.banner || anime.poster,
        duration: anime.duration ? anime.duration * 60 : 1440,
        aired_date: new Date().toISOString().split('T')[0],
        sources: [
          { quality: '1080p', url: 'https://vjs.zencdn.net/v/oceans.mp4' },
          { quality: '720p', url: 'https://media.w3.org/2010/05/sintel/trailer.mp4' },
          { quality: '480p', url: 'https://www.w3schools.com/html/mov_bbb.mp4' }
        ]
      }));
    }

    res.json(anime);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/genres
app.get('/api/genres', async (req, res) => {
  try {
    const result = await pool.query('SELECT name FROM genres ORDER BY name ASC');
    res.json(result.rows.map(r => r.name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Scraped Episodes Database API ─────────────────────────────────
// GET /api/scraped/episodes?animeId=&slug=
app.get('/api/scraped/episodes', (req, res) => {
  try {
    const animeId = req.query.animeId || '';
    const slug = req.query.slug || '';
    const all = getScrapedEpisodes();
    let result = all;
    if (animeId || slug) {
      result = all.filter(
        (e) => e.animeId === animeId || e.animeId === slug
      );
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scraped/animes?slug=&title=
app.get('/api/scraped/animes', (req, res) => {
  try {
    const slug = req.query.slug || '';
    const title = req.query.title || '';
    const all = getScrapedAnimes();
    let result = all;
    if (slug || title) {
      const q = String(slug || title).toLowerCase();
      result = all.filter(
        (a) =>
          a.slug === slug ||
          a.id === slug ||
          (a.title && a.title.toLowerCase().includes(q)) ||
          (a.slug && a.slug.includes(q))
      );
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stream/resolve?animeId=...&title=...&ep=...
app.get('/api/stream/resolve', async (req, res) => {
  try {
    const { animeId = '', title = '', ep = 1, episode = 1 } = req.query;
    const animeTitle = title || animeId;
    const episodeNumber = Number(ep || episode || 1);
    const result = await resolveStreamForEpisode({ animeId, animeTitle, episodeNumber });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, sources: [] });
  }
});

// ── Stream Video & Download Endpoints (Range & Attachment Support) ────────────
function handleProxyStream(req, res, isDownload = false) {
  const rawTarget = req.query.url;
  const filename = req.query.filename || 'anime-episode.mp4';
  if (!rawTarget) {
    return res.status(400).send('Missing url parameter');
  }

  // Track whether client disconnected or response already sent
  let clientGone = false;
  let activeProxyReq = null;

  const cleanup = () => {
    clientGone = true;
    if (activeProxyReq) {
      try { activeProxyReq.destroy(); } catch (_) {}
      activeProxyReq = null;
    }
  };

  req.on('close', cleanup);
  req.on('aborted', cleanup);
  res.on('close', cleanup);

  const streamTarget = (target, redirectCount = 0) => {
    if (clientGone) return;
    if (redirectCount > 6) {
      if (!res.headersSent) res.status(508).send('Too many redirects');
      return;
    }

    try {
      const u = new URL(target);
      const client = target.startsWith('https') ? https : http;
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
        'Referer': target.includes('googlevideo.com') || target.includes('desustream')
          ? 'https://desustream.net/'
          : target.includes('sokuja')
            ? 'https://sokuja.uk/'
            : target.includes('otaku')
              ? 'https://otakudesu.blog/'
              : `${u.protocol}//${u.host}/`,
        'Accept': '*/*',
        'Connection': 'keep-alive',
      };
      if (req.headers.range) {
        headers['Range'] = String(req.headers.range);
      }

      const pReq = client.request(target, {
        method: req.method,
        headers,
        rejectUnauthorized: false,
      }, (pRes) => {
        if (clientGone) { pRes.resume(); return; }

        if (pRes.statusCode && pRes.statusCode >= 300 && pRes.statusCode < 400 && pRes.headers.location) {
          let redir = pRes.headers.location;
          if (redir.startsWith('/')) redir = `${u.protocol}//${u.host}${redir}`;
          pRes.resume();
          return streamTarget(redir, redirectCount + 1);
        }

        res.status(pRes.statusCode || 200);
        res.setHeader('Content-Type', pRes.headers['content-type'] || 'video/mp4');
        if (isDownload) {
          const safeName = String(filename).replace(/["\r\n\/\\]/g, '_').trim();
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeName)}"; filename*=UTF-8''${encodeURIComponent(safeName)}`);
        }
        if (pRes.headers['content-length']) res.setHeader('Content-Length', pRes.headers['content-length']);
        if (pRes.headers['content-range']) res.setHeader('Content-Range', pRes.headers['content-range']);
        res.setHeader('Accept-Ranges', pRes.headers['accept-ranges'] || 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        if (req.method === 'HEAD') {
          return res.end();
        }

        // ── Stall detection: restart proxy if no data arrives for 180s ──────
        // Increased from 60s to 180s: upstream servers (especially CDNs like
        // sokuja/googlevideo) can pause data delivery for up to a minute during
        // re-buffering, so 60s was too aggressive and caused mid-playback drops.
        let stallTimer = null;
        const resetStallTimer = () => {
          if (stallTimer) clearTimeout(stallTimer);
          stallTimer = setTimeout(() => {
            if (!clientGone && !res.writableEnded) {
              console.warn('[ProxyStream] Stall detected (no data for 180s) — destroying upstream');
              try { pRes.destroy(); } catch (_) {}
              try { pReq.destroy(); } catch (_) {}
              if (!res.headersSent) {
                res.status(504).send('Gateway Timeout: upstream stalled');
              } else {
                try { res.end(); } catch (_) {}
              }
            }
          }, 180_000);
        };

        resetStallTimer();
        pRes.on('data', resetStallTimer);
        pRes.on('end', () => { if (stallTimer) clearTimeout(stallTimer); });
        pRes.on('close', () => { if (stallTimer) clearTimeout(stallTimer); });
        pRes.on('error', () => { if (stallTimer) clearTimeout(stallTimer); });

        pRes.pipe(res);
      });

      // Enable TCP keep-alive on the upstream socket to prevent silent drops
      pReq.on('socket', (socket) => {
        socket.setKeepAlive(true, 30_000);   // send keepalive every 30s
        socket.setTimeout(4 * 60 * 60 * 1000); // 4-hour socket timeout (covers full episode)
        socket.on('timeout', () => {
          console.warn('[ProxyStream] Socket timeout — destroying');
          socket.destroy();
        });
      });

      pReq.on('error', (err) => {
        if (!clientGone && !res.headersSent) {
          res.status(502).send(`Proxy streaming error: ${err.message}`);
        }
      });

      activeProxyReq = pReq;
      pReq.end();
    } catch (err) {
      if (!clientGone && !res.headersSent) {
        res.status(400).send(`Invalid target URL: ${err.message}`);
      }
    }
  };

  streamTarget(decodeURIComponent(rawTarget));
}

app.get('/api/stream/video', (req, res) => handleProxyStream(req, res, false));
app.get('/api/stream/download', (req, res) => handleProxyStream(req, res, true));

// ── Auth Endpoints ────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, dan password wajib diisi.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [cleanEmail, cleanUsername]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email atau username sudah terdaftar.' });
    }

    // Hash password with bcrypt salt rounds 10
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user into PostgreSQL database
    const newUser = await pool.query(
      `INSERT INTO users (username, email, password_hash, avatar_url, role)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id, username, email, avatar_url, role, created_at`,
      [cleanUsername, cleanEmail, passwordHash, `https://picsum.photos/seed/${cleanUsername}/80/80`]
    );

    const user = newUser.rows[0];

    // Generate cryptographic signed JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar_url,
        createdAt: user.created_at,
        role: user.role,
        isAdmin: user.role === 'admin',
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const user = userRes.rows[0];

    // Verify password with bcrypt. Also supports migrating legacy plaintext passwords if any exist.
    let isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch && user.password_hash === password) {
      // Legacy plaintext password detected; upgrade to bcrypt hash
      const upgradedHash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [upgradedHash, user.id]);
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    // Generate cryptographic signed JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar_url,
        createdAt: user.created_at,
        role: user.role,
        isAdmin: user.role === 'admin',
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Comment Endpoints ─────────────────────────────────────────────────────────

// GET /api/comments/:animeId — fetch comments, optionally filter by episodeId (Public)
app.get('/api/comments/:animeId', async (req, res) => {
  try {
    const { animeId } = req.params;
    const { episodeId } = req.query;

    let query = `
      SELECT c.id, c.content, c.created_at, c.user_id, c.anime_id, c.episode_id,
             u.username, u.avatar_url,
             CASE WHEN u.role = 'admin' THEN true ELSE false END AS is_admin
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.anime_id = $1`;
    const params = [animeId];

    if (episodeId) {
      query += ` AND c.episode_id = $2`;
      params.push(episodeId);
    }

    query += ` ORDER BY c.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/comments — create a new comment (Requires valid JWT)
app.post('/api/comments', authenticateToken, async (req, res) => {
  try {
    const { animeId, episodeId, content } = req.body;
    // Derive identity strictly from verified token
    const userId = req.user.id;

    if (!animeId || !content?.trim()) {
      return res.status(400).json({ error: 'animeId dan content wajib diisi.' });
    }

    const result = await pool.query(
      `INSERT INTO comments (user_id, anime_id, episode_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, anime_id, episode_id, content, created_at`,
      [userId, animeId, episodeId ?? null, content.trim()]
    );

    // Join with user data for response
    const userRes = await pool.query(
      `SELECT username, avatar_url, role FROM users WHERE id = $1`,
      [userId]
    );

    const comment = result.rows[0];
    const user = userRes.rows[0];

    res.status(201).json({
      ...comment,
      username: user?.username ?? 'User',
      avatar_url: user?.avatar_url ?? null,
      is_admin: user?.role === 'admin',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/comments/:commentId — delete a comment (Owner or Admin only)
app.delete('/api/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Fetch comment to check ownership
    const commentRes = await pool.query('SELECT * FROM comments WHERE id = $1', [commentId]);
    if (commentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Komentar tidak ditemukan.' });
    }

    const comment = commentRes.rows[0];

    // Check if user is owner or server-verified admin
    const userRes = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    const userRole = userRes.rows[0]?.role ?? 'user';
    const isOwner = comment.user_id === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak diizinkan menghapus komentar ini.' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin Endpoints ───────────────────────────────────────────────────────────

// GET /api/admin/emails (Admin only)
app.get('/api/admin/emails', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT email FROM users WHERE role = 'admin' ORDER BY created_at ASC");
    res.json(result.rows.map(r => r.email));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/emails (Admin only)
app.post('/api/admin/emails', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email wajib diisi.' });
    }

    await pool.query("UPDATE users SET role = 'admin' WHERE email = $1", [cleanEmail]);
    const result = await pool.query("SELECT email FROM users WHERE role = 'admin' ORDER BY created_at ASC");
    res.json({ success: true, emails: result.rows.map(r => r.email) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/emails/:email (Admin only)
app.delete('/api/admin/emails/:email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    const cleanEmail = decodeURIComponent(email).trim().toLowerCase();

    // Prevent removing the last admin
    const adminCountRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
    const totalAdmins = parseInt(adminCountRes.rows[0].count, 10);
    if (totalAdmins <= 1) {
      return res.status(400).json({ error: 'Tidak dapat menghapus admin terakhir.' });
    }

    await pool.query("UPDATE users SET role = 'user' WHERE email = $1", [cleanEmail]);
    const result = await pool.query("SELECT email FROM users WHERE role = 'admin' ORDER BY created_at ASC");
    res.json({ success: true, emails: result.rows.map(r => r.email) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Notifications Endpoints ───────────────────────────────────────────────────

// GET /api/notifications (Public - with local JSON fallback)
app.get('/api/notifications', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(20) DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await pool.query(
      `SELECT id, type, title, message, created_at AS "createdAt"
       FROM notifications
       ORDER BY created_at DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    // Fallback to local JSON database
    const local = readLocalNotifs();
    res.json(local.slice(0, 50));
  }
});

// POST /api/notifications (Admin only - with local JSON fallback)
app.post('/api/notifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type, title, message } = req.body;
    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Title dan message wajib diisi.' });
    }

    const notifId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const notifType = type || 'info';

    try {
      const result = await pool.query(
        `INSERT INTO notifications (id, type, title, message, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id, type, title, message, created_at AS "createdAt"`,
        [notifId, notifType, title.trim(), message.trim()]
      );
      return res.status(201).json(result.rows[0]);
    } catch (pgErr) {
      // Fallback to local JSON file
      const newItem = {
        id: notifId,
        type: notifType,
        title: title.trim(),
        message: message.trim(),
        createdAt: new Date().toISOString(),
      };
      const list = readLocalNotifs();
      list.unshift(newItem);
      writeLocalNotifs(list);
      return res.status(201).json(newItem);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications/:id (Admin only)
app.delete('/api/notifications/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM notifications WHERE id = $1', [id]);
  } catch (err) {
    const list = readLocalNotifs().filter((n) => n.id !== id);
    writeLocalNotifs(list);
  }
  res.json({ success: true });
});

// DELETE /api/notifications (Admin only - delete all)
app.delete('/api/notifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications');
  } catch (err) {
    writeLocalNotifs([]);
  }
  res.json({ success: true });
});

// ── Scraper Admin API ────────────────────────────────────────────────────────

/**
 * GET /api/admin/scraper/status
 * Kembalikan status scraper terakhir (lastRun, nextScheduled, dll.)
 */
app.get('/api/admin/scraper/status', authenticateToken, requireAdmin, (_req, res) => {
  res.json(getScrapeStatus());
});

/**
 * POST /api/admin/scraper/run
 * Trigger scrape manual sekarang juga.
 * Body: { source: 'all' | 'nekopoi' }
 */
app.post('/api/admin/scraper/run', authenticateToken, requireAdmin, async (req, res) => {
  const source = req.body?.source ?? 'all';
  // Jalankan async, langsung beri response 202 Accepted
  res.status(202).json({ message: 'Scrape dimulai di background.', source });
  // Jalankan non-blocking
  runScrape({ source, verbose: true }).then((result) => {
    console.log('[API] Scrape result:', result);
  }).catch(console.error);
});

/**
 * POST /api/admin/scraper/reset
 * Reset status scraper bila stuck / hang.
 */
app.post('/api/admin/scraper/reset', authenticateToken, requireAdmin, (_req, res) => {
  const status = resetScrapeStatus();
  res.json({ message: 'Status scraper berhasil di-reset.', status });
});

// ─────────────────────────────────────────────────────────────────────────────

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Yowanime PostgreSQL API Server running on http://localhost:${PORT}`);

    // ── Auto-scraper scheduler ──────────────────────────────────────
    const scraperEnabled = process.env.AUTO_SCRAPE !== 'false'; // default ON
    if (scraperEnabled) {
      startScheduler({
        intervalHours: process.env.SCRAPE_INTERVAL_HOURS ?? 6,
        runOnStart: process.env.SCRAPE_ON_START === 'true',
      });
    } else {
      console.log('[AutoScraper] ⚠️  Dinonaktifkan (AUTO_SCRAPE=false)');
    }
  });
}

export default app;
