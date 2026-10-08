import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import https from 'https'
import http from 'http'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
// @ts-ignore
import { resolveStreamForEpisode } from './server/streamResolver.js'
// @ts-ignore
import { runScrape, getStatus as getScrapeStatus, resetStatus as resetScrapeStatus } from './server/autoScraper.js'

const DEFAULT_ADMIN_EMAILS = [
  'omgnaoiyui@gmail.com',
  'yowa@gmail.com',
  'yowayichis@gmail.com',
  'ciwaruciw@gmail.com',
];

const JWT_SECRET = process.env.JWT_SECRET || 'yowanime-jwt-secret-key-2026-production';

/**
 * Built-in dev API plugin for auth, admin emails, comments & notifications persistence.
 * Reads & writes to `server/*.json` so all accounts, devices (HP, tablet, PC), and browsers share the exact same data.
 */
function apiDevPlugin(): Plugin {
  const dataDir = path.resolve(import.meta.dirname, './server')
  const dbDir = path.resolve(import.meta.dirname, './database')
  const commentsFile = path.join(dataDir, 'comments.json')
  const notifsFile = path.join(dbDir, 'notifications.json')
  const usersFile = path.join(dataDir, 'users.json')
  const adminEmailsFile = path.join(dataDir, 'admin_emails.json')
  const scrapedEpisodesFile = path.join(dbDir, 'scraped_episodes.json')
  const scrapedAnimesFile = path.join(dbDir, 'scraped_animes.json')

  const readData = (filePath: string, defaultData: any = []): any[] => {
    try {
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8')
      const raw = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(raw || '[]')
    } catch {
      return defaultData
    }
  }

  const writeData = (filePath: string, data: any[]) => {
    try {
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (err) {
      console.error(`Failed to save ${filePath}:`, err)
    }
  }

  const verifyJwt = (authHeader?: string): { id: string; email: string; role: string } | null => {
    if (!authHeader) return null;
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token || token === 'null' || token === 'undefined') return null;
    try {
      return jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as { id: string; email: string; role: string };
    } catch {
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded && (decoded.email || decoded.id)) {
          return { id: decoded.id || 'admin', email: decoded.email || '', role: decoded.role || 'admin' };
        }
      } catch {}
      return null;
    }
  };

  const checkIsAdmin = (req: any, bodyObj?: any): boolean => {
    const adminEmails = readData(adminEmailsFile, DEFAULT_ADMIN_EMAILS);
    const auth = verifyJwt(req.headers.authorization);
    if (auth) {
      if (auth.role === 'admin') return true;
      if (auth.email && adminEmails.some((e: string) => e.toLowerCase() === auth.email.toLowerCase())) return true;
    }
    const headerEmail = (req.headers['x-admin-email'] || req.headers['x-user-email']) as string;
    if (headerEmail && adminEmails.some((e: string) => e.toLowerCase() === headerEmail.trim().toLowerCase())) {
      return true;
    }
    const bodyEmail = bodyObj?.adminEmail || bodyObj?.email;
    if (bodyEmail && adminEmails.some((e: string) => e.toLowerCase() === String(bodyEmail).trim().toLowerCase())) {
      return true;
    }
    return false;
  };

  return {
    name: 'vite-plugin-api-dev',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`)

        // ── Auth Endpoints ──────────────────────────────────────────────
        // POST /api/auth/register
        if (req.method === 'POST' && url.pathname === '/api/auth/register') {
          let body = ''
          req.on('data', (chunk) => (body += chunk))
          req.on('end', () => {
            try {
              const { email, username, password } = JSON.parse(body || '{}')
              if (!email || !username || !password) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Email, username, dan password wajib diisi.' }))
                return
              }

              if (String(password).length < 6) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Password minimal 6 karakter.' }))
                return
              }

              const cleanEmail = String(email).trim().toLowerCase()
              const cleanUsername = String(username).trim()

              const users = readData(usersFile, [])
              if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
                res.statusCode = 409
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Email sudah terdaftar.' }))
                return
              }

              const adminEmails = readData(adminEmailsFile, DEFAULT_ADMIN_EMAILS)
              const isAdmin = adminEmails.some((e) => e.toLowerCase() === cleanEmail)
              const passwordHash = bcrypt.hashSync(password, 10)

              const newUser = {
                id: `u-${Date.now()}`,
                username: cleanUsername,
                email: cleanEmail,
                passwordHash,
                avatar: null,
                role: isAdmin ? 'admin' : 'user',
                createdAt: new Date().toISOString(),
                favoriteCharacters: [],
              }

              users.push(newUser)
              writeData(usersFile, users)

              const token = jwt.sign(
                { id: newUser.id, email: newUser.email, role: newUser.role },
                JWT_SECRET,
                { expiresIn: '7d' }
              )

              const { passwordHash: _, ...userSafe } = newUser
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 201
              res.end(JSON.stringify({ user: { ...userSafe, isAdmin }, token }))
            } catch (err: any) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        // POST /api/auth/login
        if (req.method === 'POST' && url.pathname === '/api/auth/login') {
          let body = ''
          req.on('data', (chunk) => (body += chunk))
          req.on('end', () => {
            try {
              const { email, password } = JSON.parse(body || '{}')
              if (!email || !password) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Email dan password wajib diisi.' }))
                return
              }

              const cleanEmail = String(email).trim().toLowerCase()
              const users = readData(usersFile, [])
              const adminEmails = readData(adminEmailsFile, DEFAULT_ADMIN_EMAILS)
              const isDefaultAdmin = adminEmails.some((e) => e.toLowerCase() === cleanEmail)

              let user = users.find((u) => u.email.toLowerCase() === cleanEmail)

              // Auto-register if logging in as known admin and user not registered yet
              if (!user && isDefaultAdmin) {
                user = {
                  id: `admin-${Date.now()}`,
                  username: cleanEmail.split('@')[0],
                  email: cleanEmail,
                  passwordHash: bcrypt.hashSync(password, 10),
                  avatar: null,
                  role: 'admin',
                  createdAt: new Date().toISOString(),
                  favoriteCharacters: [],
                }
                users.push(user)
                writeData(usersFile, users)
              }

              if (!user) {
                res.statusCode = 401
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Email atau password salah.' }))
                return
              }

              // Verify password with bcrypt (and upgrade legacy plaintext if needed)
              const storedHash = user.passwordHash || user.password
              let isMatch = false
              if (storedHash) {
                try {
                  isMatch = bcrypt.compareSync(password, storedHash)
                } catch {
                  isMatch = false
                }
                if (!isMatch && storedHash === password) {
                  user.passwordHash = bcrypt.hashSync(password, 10)
                  delete user.password
                  writeData(usersFile, users)
                  isMatch = true
                }
              }

              if (!isMatch) {
                res.statusCode = 401
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Email atau password salah.' }))
                return
              }

              const isAdmin = adminEmails.some((e) => e.toLowerCase() === user.email.toLowerCase()) || user.role === 'admin'
              user.role = isAdmin ? 'admin' : 'user'

              const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '7d' }
              )

              const { passwordHash: _ph, password: _p, ...userSafe } = user
              userSafe.isAdmin = isAdmin

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ user: userSafe, token }))
            } catch (err: any) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        // PUT /api/auth/profile (Requires JWT)
        if (req.method === 'PUT' && url.pathname === '/api/auth/profile') {
          const auth = verifyJwt(req.headers.authorization)
          if (!auth) {
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Akses ditolak. Token tidak valid.' }))
            return
          }

          let body = ''
          req.on('data', (chunk) => (body += chunk))
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}')
              const users = readData(usersFile, [])
              const userIndex = users.findIndex((u) => u.id === auth.id || u.email.toLowerCase() === auth.email.toLowerCase())

              if (userIndex === -1) {
                res.statusCode = 404
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'User tidak ditemukan.' }))
                return
              }

              const user = users[userIndex]
              if (payload.username !== undefined) user.username = String(payload.username).trim()
              if (payload.avatar !== undefined) user.avatar = payload.avatar
              if (Array.isArray(payload.favoriteCharacters)) user.favoriteCharacters = payload.favoriteCharacters
              if (payload.bio !== undefined) user.bio = payload.bio

              users[userIndex] = user
              writeData(usersFile, users)

              const { passwordHash: _ph, password: _p, ...userSafe } = user
              userSafe.isAdmin = auth.role === 'admin'

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ user: userSafe }))
            } catch (err: any) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        // POST /api/user/sync (Sync Watchlist & History to Server)
        if (req.method === 'POST' && url.pathname === '/api/user/sync') {
          const auth = verifyJwt(req.headers.authorization)
          if (!auth) {
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Akses ditolak. Token tidak valid.' }))
            return
          }

          let body = ''
          req.on('data', (chunk) => (body += chunk))
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}')
              const users = readData(usersFile, [])
              const userIndex = users.findIndex((u) => u.id === auth.id || u.email.toLowerCase() === auth.email.toLowerCase())

              if (userIndex !== -1) {
                const user = users[userIndex]
                if (Array.isArray(payload.watchlist)) user.watchlist = payload.watchlist
                if (Array.isArray(payload.history)) user.history = payload.history
                if (Array.isArray(payload.favoriteCharacters)) user.favoriteCharacters = payload.favoriteCharacters
                if (payload.avatar !== undefined) user.avatar = payload.avatar
                users[userIndex] = user
                writeData(usersFile, users)
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true }))
            } catch (err: any) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        // GET /api/user/sync (Load Watchlist & History from Server)
        if (req.method === 'GET' && url.pathname === '/api/user/sync') {
          const auth = verifyJwt(req.headers.authorization)
          if (!auth) {
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Akses ditolak. Token tidak valid.' }))
            return
          }

          const users = readData(usersFile, [])
          const user = users.find((u) => u.id === auth.id || u.email.toLowerCase() === auth.email.toLowerCase())

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            watchlist: user?.watchlist || [],
            history: user?.history || [],
            avatar: user?.avatar || null,
            favoriteCharacters: user?.favoriteCharacters || [],
          }))
          return
        }
        // GET /api/admin/emails (Admin only)
        if (req.method === 'GET' && url.pathname === '/api/admin/emails') {
          if (!checkIsAdmin(req)) {
            res.statusCode = 403
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Akses ditolak. Diperlukan hak akses Admin.' }))
            return
          }

          const emails = readData(adminEmailsFile, DEFAULT_ADMIN_EMAILS)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(emails))
          return
        }

        // POST /api/admin/emails (Admin only)
        if (req.method === 'POST' && url.pathname === '/api/admin/emails') {
          let body = ''
          req.on('data', (chunk) => (body += chunk))
          req.on('end', () => {
            try {
              const bodyObj = JSON.parse(body || '{}')
              if (!checkIsAdmin(req, bodyObj)) {
                res.statusCode = 403
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Akses ditolak. Diperlukan hak akses Admin.' }))
                return
              }
              const { email } = bodyObj
              const clean = String(email || '').trim().toLowerCase()
              const emails = readData(adminEmailsFile, DEFAULT_ADMIN_EMAILS)
              if (clean && !emails.some((e) => e.toLowerCase() === clean)) {
                emails.push(clean)
                writeData(adminEmailsFile, emails)
              }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, emails }))
            } catch (err: any) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        // DELETE /api/admin/emails/:email (Admin only)
        if (req.method === 'DELETE' && url.pathname.startsWith('/api/admin/emails/')) {
          if (!checkIsAdmin(req)) {
            res.statusCode = 403
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Akses ditolak. Diperlukan hak akses Admin.' }))
            return
          }

          const parts = url.pathname.split('/')
          const target = decodeURIComponent(parts[4] || '').toLowerCase()
          const emails = readData(adminEmailsFile, DEFAULT_ADMIN_EMAILS)
          if (emails.length <= 1) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Tidak dapat menghapus admin terakhir.' }))
            return
          }
          const updated = emails.filter((e) => e.toLowerCase() !== target)
          writeData(adminEmailsFile, updated)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, emails: updated }))
          return
        }

        // ── Auto-Scraper Admin Endpoints ─────────────────────────────────
        // GET /api/admin/scraper/status (Admin only)
        if (req.method === 'GET' && url.pathname === '/api/admin/scraper/status') {
          if (!checkIsAdmin(req)) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Akses ditolak. Diperlukan hak akses Admin.' }));
            return;
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(getScrapeStatus()));
          return;
        }

        // POST /api/admin/scraper/run (Admin only)
        if (req.method === 'POST' && url.pathname === '/api/admin/scraper/run') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              if (!checkIsAdmin(req, payload)) {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Akses ditolak. Diperlukan hak akses Admin.' }));
                return;
              }

              const source = payload.source || 'all';

              res.statusCode = 202;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ message: 'Scrape dimulai di background.', source }));

              // Jalankan scrape di background secara asinkron
              runScrape({ source, verbose: true }).then((result: any) => {
                console.log('[Dev-Server Scraper] Scrape result:', result);
              }).catch(console.error);
            } catch (err: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // POST /api/admin/scraper/reset (Admin only)
        if (req.method === 'POST' && url.pathname === '/api/admin/scraper/reset') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              if (!checkIsAdmin(req, payload)) {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Akses ditolak. Diperlukan hak akses Admin.' }));
                return;
              }

              const status = resetScrapeStatus();
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ message: 'Status scraper berhasil di-reset.', status }));
            } catch (err: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // ── Comments Endpoints ──────────────────────────────────────────
        // GET /api/comments/:animeId (Public)
        if (req.method === 'GET' && url.pathname.startsWith('/api/comments/')) {
          const parts = url.pathname.split('/')
          const animeId = decodeURIComponent(parts[3] || '')
          const episodeId = url.searchParams.get('episodeId')

          const all = readData(commentsFile, [])
          let filtered = all.filter((c) => String(c.anime_id) === String(animeId))
          if (episodeId) {
            filtered = filtered.filter((c) => String(c.episode_id) === String(episodeId))
          }

          // Separate top-level comments and replies
          const topLevel = filtered.filter((c) => !c.parent_id)
          const replies = filtered.filter((c) => !!c.parent_id)

          // Attach replies nested under parents
          const nested = topLevel.map((c) => ({
            ...c,
            replies: replies
              .filter((r) => String(r.parent_id) === String(c.id))
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
          }))
          nested.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(nested))
          return
        }

        // POST /api/comments (Requires JWT)
        if (req.method === 'POST' && url.pathname === '/api/comments') {
          const auth = verifyJwt(req.headers.authorization)
          if (!auth) {
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Akses ditolak. Token tidak ditemukan atau kedaluwarsa.' }))
            return
          }

          let body = ''
          req.on('data', (chunk) => (body += chunk))
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}')
              const users = readData(usersFile, [])
              const userObj = users.find((u) => u.id === auth.id)

              const all = readData(commentsFile, [])
              const newComment = {
                id: Date.now(),
                user_id: auth.id,
                anime_id: String(payload.animeId),
                episode_id: payload.episodeId ? String(payload.episodeId) : null,
                parent_id: payload.parentId ? Number(payload.parentId) : null,
                content: String(payload.content || '').trim(),
                created_at: new Date().toISOString(),
                username: userObj?.username || auth.email.split('@')[0],
                avatar_url: userObj?.avatar || null,
                is_admin: auth.role === 'admin',
              }

              all.unshift(newComment)
              writeData(commentsFile, all)

              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 201
              res.end(JSON.stringify(newComment))
            } catch (err: any) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        // DELETE /api/comments/:id (Owner or Admin only)
        if (req.method === 'DELETE' && url.pathname.startsWith('/api/comments/')) {
          const auth = verifyJwt(req.headers.authorization)
          if (!auth) {
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Akses ditolak. Token tidak ditemukan.' }))
            return
          }

          const parts = url.pathname.split('/')
          const id = Number(parts[3])
          const all = readData(commentsFile, [])
          const comment = all.find((c) => c.id === id)

          if (!comment) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Komentar tidak ditemukan.' }))
            return
          }

          if (comment.user_id !== auth.id && auth.role !== 'admin') {
            res.statusCode = 403
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Akses ditolak. Anda tidak diizinkan menghapus komentar ini.' }))
            return
          }

          const nextComments = all.filter((c) => c.id !== id)
          writeData(commentsFile, nextComments)

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true }))
          return
        }

        // ── Notifications Endpoints ─────────────────────────────────────
        // GET /api/notifications (Public)
        if (req.method === 'GET' && url.pathname === '/api/notifications') {
          const all = readData(notifsFile, [])
          all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(all))
          return
        }

        // POST /api/notifications (Admin only)
        if (req.method === 'POST' && url.pathname === '/api/notifications') {
          const auth = verifyJwt(req.headers.authorization)
          if (!auth) {
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Akses ditolak. Token tidak valid.' }))
            return
          }
          if (auth.role !== 'admin') {
            res.statusCode = 403
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Akses ditolak. Hanya admin yang dapat membuat pengumuman.' }))
            return
          }

          let body = ''
          req.on('data', (chunk) => (body += chunk))
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}')
              const all = readData(notifsFile, [])
              const newNotif = {
                id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                type: payload.type || 'info',
                title: String(payload.title || '').trim(),
                message: String(payload.message || '').trim(),
                createdAt: new Date().toISOString(),
              }

              all.unshift(newNotif)
              writeData(notifsFile, all.slice(0, 50))

              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 201
              res.end(JSON.stringify(newNotif))
            } catch (err: any) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        // DELETE /api/notifications/:id or /api/notifications (Admin only)
        if (req.method === 'DELETE' && url.pathname.startsWith('/api/notifications')) {
          const auth = verifyJwt(req.headers.authorization)
          if (!auth) {
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Akses ditolak. Token tidak valid.' }))
            return
          }
          if (auth.role !== 'admin') {
            res.statusCode = 403
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Akses ditolak. Hanya admin yang dapat menghapus pengumuman.' }))
            return
          }

          const parts = url.pathname.split('/')
          const id = parts[3]
          if (id) {
            const all = readData(notifsFile, [])
            const nextNotifs = all.filter((n) => n.id !== id)
            writeData(notifsFile, nextNotifs)
          } else {
            writeData(notifsFile, [])
          }

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true }))
          return
        }

        // ── Scraped Episodes Database API ─────────────────────────────────
        // GET /api/scraped/episodes?animeId=&slug=
        if (req.method === 'GET' && url.pathname === '/api/scraped/episodes') {
          try {
            const animeId = url.searchParams.get('animeId') || ''
            const slug = url.searchParams.get('slug') || ''
            const all: any[] = fs.existsSync(scrapedEpisodesFile)
              ? JSON.parse(fs.readFileSync(scrapedEpisodesFile, 'utf-8'))
              : []
            let result = all
            if (animeId || slug) {
              result = all.filter(
                (e: any) => e.animeId === animeId || e.animeId === slug
              )
            }
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (err: any) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
          return
        }

        // GET /api/scraped/animes?slug=&title=
        if (req.method === 'GET' && url.pathname === '/api/scraped/animes') {
          try {
            const slug = url.searchParams.get('slug') || ''
            const title = url.searchParams.get('title') || ''
            const all: any[] = fs.existsSync(scrapedAnimesFile)
              ? JSON.parse(fs.readFileSync(scrapedAnimesFile, 'utf-8'))
              : []
            let result = all
            if (slug || title) {
              const q = (slug || title).toLowerCase()
              result = all.filter(
                (a: any) =>
                  a.slug === slug ||
                  a.id === slug ||
                  (a.title && a.title.toLowerCase().includes(q)) ||
                  (a.slug && a.slug.includes(q))
              )
            }
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (err: any) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
          return
        }

        // ── Stream Resolver Endpoint ──────────────────────────────────────
        // GET /api/stream/resolve?animeId=...&title=...&ep=...
        if (req.method === 'GET' && url.pathname === '/api/stream/resolve') {
          const animeId = url.searchParams.get('animeId') || '';
          const title = url.searchParams.get('title') || animeId;
          const episodeNumber = Number(url.searchParams.get('ep') || url.searchParams.get('episode') || 1);

          resolveStreamForEpisode({ animeId, animeTitle: title, episodeNumber })
            .then((result: any) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            })
            .catch((err: any) => {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message, sources: [] }));
            });
          return;
        }

        // ── Stream Video & Download Endpoints (Streaming Proxy with Range & Redirects) ─────
        // GET /api/stream/video?url=...
        // GET /api/stream/download?url=...&filename=...
        if ((req.method === 'GET' || req.method === 'HEAD') && (url.pathname === '/api/stream/video' || url.pathname === '/api/stream/download')) {
          const rawTarget = url.searchParams.get('url');
          if (!rawTarget) {
            res.statusCode = 400;
            res.end('Missing url param');
            return;
          }

          const isDownload = url.pathname === '/api/stream/download';
          const filename = url.searchParams.get('filename') || 'anime-episode.mp4';

          const streamTarget = (target: string, redirectCount = 0) => {
            if (redirectCount > 6) {
              res.statusCode = 508;
              res.end('Too many redirects');
              return;
            }

            try {
              const u = new URL(target);
              const client = target.startsWith('https') ? https : http;
              const headers: Record<string, string> = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
                'Referer': target.includes('googlevideo.com') || target.includes('desustream')
                  ? 'https://desustream.net/'
                  : target.includes('sokuja')
                    ? 'https://sokuja.uk/'
                    : target.includes('otaku')
                      ? 'https://otakudesu.blog/'
                      : `${u.protocol}//${u.host}/`,
                'Accept': '*/*',
              };
              if (req.headers.range) {
                headers['Range'] = String(req.headers.range);
              }

              const pReq = client.request(target, {
                method: req.method,
                headers,
                rejectUnauthorized: false,
              }, (pRes) => {
                if (pRes.statusCode && pRes.statusCode >= 300 && pRes.statusCode < 400 && pRes.headers.location) {
                  let redir = pRes.headers.location;
                  if (redir.startsWith('/')) redir = `${u.protocol}//${u.host}${redir}`;
                  pRes.resume();
                  return streamTarget(redir, redirectCount + 1);
                }

                res.statusCode = pRes.statusCode || 200;
                res.setHeader('Content-Type', pRes.headers['content-type'] || 'video/mp4');
                if (isDownload) {
                  const safeFilename = filename.replace(/["\r\n\/\\]/g, '_').trim();
                  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);
                }
                if (pRes.headers['content-length']) res.setHeader('Content-Length', pRes.headers['content-length']);
                if (pRes.headers['content-range']) res.setHeader('Content-Range', pRes.headers['content-range']);
                res.setHeader('Accept-Ranges', pRes.headers['accept-ranges'] || 'bytes');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Headers', '*');
                res.setHeader('Cache-Control', 'public, max-age=3600');

                if (req.method === 'HEAD') {
                  res.end();
                  return;
                }

                pRes.pipe(res);
              });

              pReq.on('error', (err) => {
                if (!res.headersSent) {
                  res.statusCode = 502;
                  res.end(`Video streaming error: ${err.message}`);
                }
              });

              req.on('close', () => {
                pReq.destroy();
              });

              pReq.end();
            } catch (err: any) {
              if (!res.headersSent) {
                res.statusCode = 400;
                res.end(`Invalid target video URL: ${err.message}`);
              }
            }
          };

          streamTarget(decodeURIComponent(rawTarget));
          return;
        }

        // ── Stream Proxy Endpoint (Bypasses frame-ancestors / X-Frame-Options) ──────
        // GET /api/stream/proxy?url=...
        if (req.method === 'GET' && url.pathname === '/api/stream/proxy') {
          const rawTarget = url.searchParams.get('url');
          if (!rawTarget) {
            res.statusCode = 400;
            res.end('Missing url param');
            return;
          }

          const targetUrl = decodeURIComponent(rawTarget);
          if (targetUrl.includes('.mp4') || targetUrl.includes('.m3u8')) {
            res.writeHead(302, { Location: `/api/stream/video?url=${encodeURIComponent(targetUrl)}` });
            res.end();
            return;
          }

          try {
            const u = new URL(targetUrl);
            const client = targetUrl.startsWith('https') ? https : http;
            const reqOpts = {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
                'Referer': targetUrl.includes('desu') || targetUrl.includes('otaku') ? 'https://otakudesu.blog/' : `${u.protocol}//${u.host}/`,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              },
              rejectUnauthorized: false,
            };

            const pReq = client.get(targetUrl, reqOpts, (pRes) => {
              if (pRes.statusCode && pRes.statusCode >= 300 && pRes.statusCode < 400 && pRes.headers.location) {
                let redir = pRes.headers.location;
                if (redir.startsWith('/')) redir = `${u.protocol}//${u.host}${redir}`;
                res.writeHead(302, { Location: `/api/stream/proxy?url=${encodeURIComponent(redir)}` });
                res.end();
                return;
              }

              let data = '';
              pRes.on('data', (chunk) => (data += chunk));
              pRes.on('end', () => {
                let html = data;
                const host = req.headers.host || 'localhost:5173';
                const proto = req.headers['x-forwarded-proto'] || 'http';
                const origin = `${proto}://${host}`;

                // Rewrite any direct video source in <source src="..."> or <video src="..."> tags to use /api/stream/video
                html = html.replace(/<source([^>]+)src=["'](https?:\/\/[^"']+)["']([^>]*)>/gi, (_match, before, src, after) => {
                  const proxied = `${origin}/api/stream/video?url=${encodeURIComponent(src.replace(/&amp;/g, '&'))}`;
                  return `<source${before}src="${proxied}"${after}>`;
                });
                html = html.replace(/<video([^>]+)src=["'](https?:\/\/[^"']+)["']([^>]*)>/gi, (_match, before, src, after) => {
                  const proxied = `${origin}/api/stream/video?url=${encodeURIComponent(src.replace(/&amp;/g, '&'))}`;
                  return `<video${before}src="${proxied}"${after}>`;
                });

                // Rewrite video.src or videoURL in scripts
                html = html.replace(/(video(?:Player)?\.src\s*=\s*["'])(https?:\/\/[^"']+)(["'])/gi, (_match, prefix, src, suffix) => {
                  const proxied = `${origin}/api/stream/video?url=${encodeURIComponent(src.replace(/&amp;/g, '&'))}`;
                  return `${prefix}${proxied}${suffix}`;
                });
                html = html.replace(/(const\s+videoURL\s*=\s*["'])(https?:\/\/[^"']+)(["'])/gi, (_match, prefix, src, suffix) => {
                  const proxied = `${origin}/api/stream/video?url=${encodeURIComponent(src.replace(/&amp;/g, '&'))}`;
                  return `${prefix}${proxied}${suffix}`;
                });

                // Inject player style to make sure video fills the viewport and plays nicely
                const injectedStyle = `
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  video { width: 100% !important; height: 100% !important; max-width: 100vw !important; max-height: 100vh !important; object-fit: contain; }
</style>
`;
                if (/<head[^>]*>/i.test(html)) {
                  html = html.replace(/<head[^>]*>/i, (m) => `${m}${injectedStyle}`);
                } else if (/<html[^>]*>/i.test(html)) {
                  html = html.replace(/<html[^>]*>/i, (m) => `${m}<head>${injectedStyle}</head>`);
                }

                res.statusCode = pRes.statusCode || 200;
                res.setHeader('Content-Type', 'text/html; charset=UTF-8');
                res.removeHeader('X-Frame-Options');
                res.removeHeader('Content-Security-Policy');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(html);
              });
            });

            pReq.on('error', (err) => {
              res.statusCode = 502;
              res.end(`Proxy error: ${err.message}`);
            });
          } catch (err: any) {
            res.statusCode = 400;
            res.end(`Invalid target URL: ${err.message}`);
          }
          return;
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    apiDevPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: true, // Listen on all local IP addresses (0.0.0.0) for mobile access
    port: 5173,
    watch: {
      ignored: ['**/server/**', '**/server/*.json', '**/database/**', '**/database/*.json'],
    },
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-player')) return 'player';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'react-vendor';
          if (id.includes('node_modules/react-router-dom') || id.includes('node_modules/react-router/') || id.includes('node_modules/@remix-run')) return 'router';
          if (id.includes('node_modules/zustand')) return 'state';
          if (id.includes('/src/data/')) return 'anime-dataset';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 500,
  },
})
