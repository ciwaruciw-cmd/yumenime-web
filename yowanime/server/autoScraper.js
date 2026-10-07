/**
 * autoScraper.js — Yowanime Auto-Scrape Daemon
 * ─────────────────────────────────────────────
 * Menjalankan scrape otomatis dari Otakudesu, Samehadaku, Sokuja.
 * Dapat dijalankan sebagai:
 *   - Standalone: node server/autoScraper.js
 *   - Diimpor oleh server/index.js
 *
 * Schedule default: setiap 6 jam
 * Override via env: SCRAPE_INTERVAL_HOURS=2
 *
 * Status tersimpan di: database/scrape_status.json
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execFileAsync = promisify(execFile);

const STATUS_FILE = path.join(__dirname, '../database/scrape_status.json');
const NOTIF_FILE = path.join(__dirname, '../database/notifications.json');
const DB_DIR = path.join(__dirname, '../database');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

function pushScrapeNotification(source, durationStr) {
  try {
    let list = [];
    if (fs.existsSync(NOTIF_FILE)) {
      list = JSON.parse(fs.readFileSync(NOTIF_FILE, 'utf8'));
    }
    const notif = {
      id: `notif-scrape-${Date.now()}`,
      type: 'update',
      title: 'Update Anime & Episode Terbaru',
      message: `Scrape otomatis (${source}) selesai dalam ${durationStr}. Episode & anime terbaru sudah diperbarui di database.`,
      createdAt: new Date().toISOString(),
    };
    list.unshift(notif);
    fs.writeFileSync(NOTIF_FILE, JSON.stringify(list.slice(0, 50), null, 2), 'utf8');
  } catch (e) {
    console.warn('[AutoScraper] Gagal mencatat notifikasi scrape:', e.message);
  }
}

// ── Process & Status helpers ──────────────────────────────────────────────────

let isRunning = false;
let currentChildProcess = null;

function readStatus() {
  try {
    const status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    // Self-healing: jika status tertulis isRunning tapi tidak ada proses nyata yang jalan
    if (status && status.isRunning) {
      let isActuallyRunning = false;
      if (currentChildProcess && !currentChildProcess.killed) {
        isActuallyRunning = true;
      } else if (status.pid) {
        try {
          process.kill(status.pid, 0); // check if pid exists
          isActuallyRunning = true;
        } catch {
          isActuallyRunning = false;
        }
      }

      const lastRunMs = status.lastRun ? new Date(status.lastRun).getTime() : 0;
      const elapsedMs = Date.now() - lastRunMs;
      const MAX_STALE_MS = 15 * 60 * 1000; // 15 menit max sebelum dianggap stale

      if (!isActuallyRunning || elapsedMs > MAX_STALE_MS) {
        console.warn(`[AutoScraper] ⚠️ Resetting stale scraper flag (elapsed: ${Math.round(elapsedMs / 1000)}s, pidAlive: ${isActuallyRunning})`);
        status.isRunning = false;
        status.pid = null;
        if (!status.lastError) {
          status.lastError = 'Proses sebelumnya terhenti di luar jadwal (restarted/interrupted).';
        }
        try {
          fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2), 'utf8');
        } catch {}
      }
    }
    return status;
  } catch {
    return {
      lastRun: null,
      lastSuccess: null,
      lastError: null,
      totalRuns: 0,
      totalSuccess: 0,
      isRunning: false,
      nextScheduled: null,
      pid: null,
    };
  }
}

function writeStatus(patch) {
  const current = readStatus();
  const updated = { ...current, ...patch };
  fs.writeFileSync(STATUS_FILE, JSON.stringify(updated, null, 2), 'utf8');
  return updated;
}

// ── Core scrape runner ────────────────────────────────────────────────────────

export async function runScrape({ source = 'all', verbose = true } = {}) {
  const currentDiskStatus = readStatus();
  if (isRunning || currentDiskStatus.isRunning) {
    console.log('[AutoScraper] ⏳ Scrape sedang berjalan, skip.');
    return { skipped: true, reason: 'already_running' };
  }

  isRunning = true;
  const startTime = Date.now();
  const startISO = new Date().toISOString();

  writeStatus({
    isRunning: true,
    lastRun: startISO,
    lastError: null,
    totalRuns: (currentDiskStatus.totalRuns || 0) + 1,
    pid: process.pid,
  });

  if (verbose) {
    console.log('\n' + '='.repeat(60));
    console.log(`[AutoScraper] 🚀 Mulai scrape otomatis — ${startISO}`);
    console.log(`[AutoScraper] Source: ${source}`);
    console.log('='.repeat(60));
  }

  try {
    let scriptPath = path.join(__dirname, 'scrapeAll.js');
    if (source === 'nekopoi') {
      scriptPath = path.join(__dirname, 'scrapeNekopoi.js');
    } else if (source === 'quick') {
      scriptPath = path.join(__dirname, 'scrapeAnime.js');
    }

    // Run scraper as child process and track child instance
    const { stdout, stderr } = await new Promise((resolve, reject) => {
      const child = execFile('node', [scriptPath], {
        cwd: path.join(__dirname, '..'),
        timeout: 30 * 60 * 1000, // 30 menit max
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
        env: { ...process.env },
      }, (error, stdout, stderr) => {
        currentChildProcess = null;
        if (error) {
          reject(Object.assign(error, { stdout, stderr }));
        } else {
          resolve({ stdout, stderr });
        }
      });

      currentChildProcess = child;
      if (child && child.pid) {
        writeStatus({ pid: child.pid });
      }
    });

    const durationMs = Date.now() - startTime;
    const durationStr = `${Math.round(durationMs / 1000)}s`;

    if (verbose && stdout) console.log(stdout);
    if (verbose && stderr) console.error('[AutoScraper] stderr:', stderr);

    console.log(`[AutoScraper] ✅ Selesai dalam ${durationStr}`);

    const status = writeStatus({
      isRunning: false,
      pid: null,
      lastSuccess: new Date().toISOString(),
      lastError: null,
      totalSuccess: (readStatus().totalSuccess || 0) + 1,
      lastDuration: durationStr,
    });

    pushScrapeNotification(source, durationStr);

    return { success: true, duration: durationStr, status };

  } catch (err) {
    const errMsg = err.message || String(err);
    console.error(`[AutoScraper] ❌ Gagal: ${errMsg}`);

    writeStatus({
      isRunning: false,
      pid: null,
      lastError: errMsg,
    });

    return { success: false, error: errMsg };
  } finally {
    currentChildProcess = null;
    isRunning = false;
  }
}

// ── Scheduler ─────────────────────────────────────────────────────────────────

let schedulerTimer = null;

export function startScheduler(options = {}) {
  const intervalHours = parseFloat(
    options.intervalHours ?? process.env.SCRAPE_INTERVAL_HOURS ?? '6'
  );
  const intervalMs = intervalHours * 60 * 60 * 1000;
  const runOnStart = options.runOnStart ?? (process.env.SCRAPE_ON_START === 'true');

  console.log(`[AutoScraper] ⏰ Scheduler aktif — interval: ${intervalHours} jam`);
  if (runOnStart) console.log('[AutoScraper] 🔄 Akan scrape saat server start...');

  const scheduleNext = () => {
    const nextISO = new Date(Date.now() + intervalMs).toISOString();
    writeStatus({ nextScheduled: nextISO });
    console.log(`[AutoScraper] 📅 Scrape berikutnya: ${nextISO}`);

    schedulerTimer = setTimeout(async () => {
      await runScrape();
      scheduleNext(); // recursively schedule next
    }, intervalMs);
  };

  if (runOnStart) {
    // Run immediately on start, then schedule
    setTimeout(async () => {
      await runScrape();
      scheduleNext();
    }, 5000); // 5 detik delay agar server siap dulu
  } else {
    scheduleNext();
  }

  return {
    stop: () => {
      if (schedulerTimer) clearTimeout(schedulerTimer);
      console.log('[AutoScraper] ⏹ Scheduler dihentikan.');
    },
  };
}

export function stopScheduler() {
  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }
  writeStatus({ isRunning: false, nextScheduled: null });
}

export function getStatus() {
  return readStatus();
}

export function resetStatus() {
  if (currentChildProcess) {
    try {
      currentChildProcess.kill('SIGTERM');
      setTimeout(() => {
        try {
          if (currentChildProcess) currentChildProcess.kill('SIGKILL');
        } catch {}
      }, 1000);
    } catch (e) {
      console.warn('[AutoScraper] Gagal menghentikan child process:', e.message);
    }
    currentChildProcess = null;
  }
  isRunning = false;
  return writeStatus({
    isRunning: false,
    pid: null,
    lastError: 'Status di-reset oleh admin.',
  });
}

// Bersihkan status file bila proses Node dihentikan
const handleExitCleanup = () => {
  try {
    if (currentChildProcess) {
      try { currentChildProcess.kill('SIGTERM'); } catch {}
    }
    if (fs.existsSync(STATUS_FILE)) {
      const cur = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
      if (cur.isRunning) {
        cur.isRunning = false;
        cur.pid = null;
        fs.writeFileSync(STATUS_FILE, JSON.stringify(cur, null, 2), 'utf8');
      }
    }
  } catch {}
};

process.on('SIGINT', () => { handleExitCleanup(); });
process.on('SIGTERM', () => { handleExitCleanup(); });


// ── Standalone mode ───────────────────────────────────────────────────────────
// Dijalankan langsung: node server/autoScraper.js

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const mode = args[0] ?? 'daemon'; // 'once' | 'daemon'

  if (mode === 'once') {
    // Jalankan sekali lalu keluar
    console.log('[AutoScraper] Mode: sekali jalan');
    runScrape().then((r) => {
      console.log('[AutoScraper] Result:', r);
      process.exit(r.success ? 0 : 1);
    });
  } else {
    // Daemon mode: jalan terus dengan scheduler
    console.log('[AutoScraper] Mode: daemon (Ctrl+C untuk berhenti)');
    startScheduler({
      runOnStart: true,
      intervalHours: process.env.SCRAPE_INTERVAL_HOURS ?? 6,
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n[AutoScraper] 👋 Shutdown...');
      stopScheduler();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      stopScheduler();
      process.exit(0);
    });
  }
}
