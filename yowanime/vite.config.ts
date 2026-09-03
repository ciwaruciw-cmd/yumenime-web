import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const DEFAULT_ADMIN_EMAILS = [
  'omgnaoiyui@gmail.com',
  'yowa@gmail.com',
  'yowayichis@gmail.com',
];

const JWT_SECRET = process.env.JWT_SECRET || 'yowanime-jwt-secret-key-2026-production';

/**
 * Built-in dev API plugin for auth, admin emails, comments & notifications persistence.
 * Reads & writes to `server/*.json` so all accounts, devices (HP, tablet, PC), and browsers share the exact same data.
 */
function apiDevPlugin(): Plugin {
  const dataDir = path.resolve(import.meta.dirname, './server')
  const commentsFile = path.join(dataDir, 'comments.json')
  const notifsFile = path.join(dataDir, 'notifications.json')
  const usersFile = path.join(dataDir, 'users.json')
  const adminEmailsFile = path.join(dataDir, 'admin_emails.json')

  const readData = (filePath: string, defaultData: any = []): any[] => {
    try {
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
      if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8')
      const raw = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(raw || '[]')
    } catch {
      return defaultData
    }
  }

  const writeData = (filePath: string, data: any[]) => {
    try {
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (err) {
      console.error(`Failed to save ${filePath}:`, err)
    }
  }

  const verifyJwt = (authHeader?: string): { id: string; email: string; role: string } | null => {
    if (!authHeader) return null;
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) return null;
    try {
      return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    } catch {
      return null;
    }
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

        // ── Admin Emails Endpoints ──────────────────────────────────────
        // GET /api/admin/emails (Admin only)
        if (req.method === 'GET' && url.pathname === '/api/admin/emails') {
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
            res.end(JSON.stringify({ error: 'Akses ditolak. Diperlukan hak akses Admin.' }))
            return
          }

          let body = ''
          req.on('data', (chunk) => (body += chunk))
          req.on('end', () => {
            try {
              const { email } = JSON.parse(body || '{}')
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
      ignored: ['**/server/**', '**/server/*.json'],
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
