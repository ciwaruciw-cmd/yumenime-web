/**
 * Express Backend API Server for Yowanime
 * Connects directly to PostgreSQL database.
 */

import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://yowa:yowapassword@localhost:5432/yowanime',
});

app.use(cors());
app.use(express.json());

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

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, dan password wajib diisi.' });
    }

    // Check if user exists
    const existing = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email atau username sudah terdaftar.' });
    }

    // Insert user into PostgreSQL database
    const newUser = await pool.query(
      `INSERT INTO users (username, email, password_hash, avatar_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, avatar_url, role, created_at`,
      [username, email, password, `https://picsum.photos/seed/${username}/80/80`]
    );

    const user = newUser.rows[0];
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar_url,
        createdAt: user.created_at,
        role: user.role,
      },
      token: `pg-jwt-token-${user.id}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const user = userRes.rows[0];
    if (user.password_hash !== password) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar_url,
        createdAt: user.created_at,
        role: user.role,
      },
      token: `pg-jwt-token-${user.id}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Yowanime PostgreSQL API Server running on http://localhost:${PORT}`);
});
