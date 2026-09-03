const fs = require('fs');
const path = require('path');

const MOCK_FILE = path.resolve(__dirname, '../src/data/mockAnime.ts');
const SEED_SQL_FILE = path.resolve(__dirname, 'seed.sql');

function escapeSql(str) {
  if (!str) return "NULL";
  return "'" + String(str).replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
}

function extractArray(content, varName) {
  // Match: export const varName: Type[] = [ ... ];
  const re = new RegExp(`export\\s+const\\s+${varName}\\s*:\\s*[^=]+=\\s*`);
  const m = re.exec(content);
  if (!m) throw new Error(`Could not find '${varName}' in mockAnime.ts`);

  const startIdx = m.index + m[0].length;
  // Walk forward to find the matching closing bracket
  let depth = 0;
  let inStr = false;
  let strChar = '';
  let endIdx = startIdx;

  for (let i = startIdx; i < content.length; i++) {
    const ch = content[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strChar) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strChar = ch; continue; }
    if (ch === '[') depth++;
    if (ch === ']') { depth--; if (depth === 0) { endIdx = i + 1; break; } }
  }

  const jsonStr = content.substring(startIdx, endIdx)
    // Remove trailing commas before ] or }
    .replace(/,\s*([}\]])/g, '$1')
    // Remove TypeScript 'as const' or type casts
    .replace(/\s+as\s+\w+/g, '');

  return JSON.parse(jsonStr);
}

function main() {
  console.log('Reading mockAnime.ts dataset...');
  const fileContent = fs.readFileSync(MOCK_FILE, 'utf8');

  let animes, episodes;
  try {
    animes = extractArray(fileContent, 'mockAnimes');
    console.log(`✅ Loaded ${animes.length} anime entries.`);
  } catch (e) {
    console.error('Failed to parse mockAnimes:', e.message);
    process.exit(1);
  }

  try {
    episodes = extractArray(fileContent, 'mockEpisodes');
    console.log(`✅ Loaded ${episodes.length} episode entries.`);
  } catch (e) {
    console.warn('⚠️ Could not parse mockEpisodes, will generate from anime data:', e.message);
    episodes = [];
  }

  let sql = `-- ============================================================
-- YOWANIME PostgreSQL Seed Data
-- Total Anime: ${animes.length}
-- Total Episodes: ${episodes.length}
-- Generated from real scraped data (Otakudesu, Samehadaku, Sokuja)
-- ============================================================

-- Insert Genres
INSERT INTO genres (name) VALUES
('Action'), ('Adventure'), ('Comedy'), ('Drama'), ('Fantasy'), ('Horror'),
('Isekai'), ('Mecha'), ('Mystery'), ('Psychological'), ('Romance'),
('Sci-Fi'), ('Slice of Life'), ('Sports'), ('Supernatural'), ('Thriller'), ('Yuri')
ON CONFLICT (name) DO NOTHING;

-- Insert Animes & Anime-Genres Junction
`;

  const genreMap = {
    'Action': 1, 'Adventure': 2, 'Comedy': 3, 'Drama': 4, 'Fantasy': 5, 'Horror': 6,
    'Isekai': 7, 'Mecha': 8, 'Mystery': 9, 'Psychological': 10, 'Romance': 11,
    'Sci-Fi': 12, 'Slice of Life': 13, 'Sports': 14, 'Supernatural': 15, 'Thriller': 16, 'Yuri': 17
  };

  const animeInserts = [];
  const genreJunctionInserts = [];

  animes.forEach((a) => {
    const malIdVal = parseInt(a.id) ? parseInt(a.id) : 'NULL';
    const animeSql = `INSERT INTO animes (id, mal_id, slug, title, title_english, title_japanese, synopsis, synopsis_short, poster, banner, status, type, year, season, studio, rating, score, episodes, duration, is_featured, is_trending, is_new_update, created_at, updated_at) VALUES (${escapeSql(a.id)}, ${malIdVal}, ${escapeSql(a.slug)}, ${escapeSql(a.title)}, ${escapeSql(a.titleEnglish)}, ${escapeSql(a.titleJapanese)}, ${escapeSql(a.synopsis)}, ${escapeSql(a.synopsisShort)}, ${escapeSql(a.poster)}, ${escapeSql(a.banner)}, ${escapeSql(a.status)}, ${escapeSql(a.type)}, ${a.year || 2024}, ${escapeSql(a.season || 'Spring')}, ${escapeSql(a.studio || 'Unknown')}, ${escapeSql(a.rating || 'PG-13')}, ${a.score || 7.5}, ${a.episodes || 12}, ${a.duration || 24}, ${a.isFeatured ? 'TRUE' : 'FALSE'}, ${a.isTrending ? 'TRUE' : 'FALSE'}, ${a.isNewUpdate ? 'TRUE' : 'FALSE'}, ${escapeSql(a.createdAt)}, ${escapeSql(a.updatedAt)}) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, score = EXCLUDED.score, poster = EXCLUDED.poster;`;
    animeInserts.push(animeSql);

    (a.genres || []).forEach((g) => {
      const gId = genreMap[g];
      if (gId) {
        genreJunctionInserts.push(`INSERT INTO anime_genres (anime_id, genre_id) VALUES (${escapeSql(a.id)}, ${gId}) ON CONFLICT DO NOTHING;`);
      }
    });
  });

  sql += animeInserts.join('\n') + '\n\n-- Insert Anime Genres Junction\n' + genreJunctionInserts.join('\n') + '\n\n';

  // ── Seed Episodes & Video Sources from real scraped data ──
  const episodeInserts = [];
  const videoSourceInserts = [];

  if (episodes.length > 0) {
    // Use real scraped episodes with real video streams
    episodes.forEach((ep) => {
      const thumb = ep.thumbnail || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600';
      const dur = ep.duration || 1440;
      const aired = ep.aired || '2026-08-01';

      episodeInserts.push(
        `(${escapeSql(ep.id)}, ${escapeSql(ep.animeId)}, ${ep.number}, ${escapeSql(ep.title)}, ${escapeSql(thumb)}, ${dur}, '${aired}')`
      );

      (ep.sources || []).forEach((src) => {
        videoSourceInserts.push(
          `(${escapeSql(ep.id)}, ${escapeSql(src.quality)}, ${escapeSql(src.url)})`
        );
      });
    });
  } else {
    // Fallback: generate placeholder episodes from anime data
    animes.forEach((a) => {
      const totalEp = a.episodes > 0 ? Math.min(a.episodes, 24) : 12;
      for (let i = 1; i <= totalEp; i++) {
        const epId = `${a.id}-ep-${i}`;
        const epTitle = `Episode ${i}: ${a.title}`;
        const thumb = a.banner || a.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600';
        const dur = a.duration ? a.duration * 60 : 1440;

        episodeInserts.push(
          `('${epId}', ${escapeSql(a.id)}, ${i}, ${escapeSql(epTitle)}, ${escapeSql(thumb)}, ${dur}, '2026-08-01')`
        );

        videoSourceInserts.push(
          `('${epId}', '1080p', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')`,
          `('${epId}', '720p', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4')`,
          `('${epId}', '480p', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4')`
        );
      }
    });
  }

  // Write in batches to avoid too-long SQL statements
  const EP_BATCH = 500;
  sql += '-- Insert Episodes\n';
  for (let i = 0; i < episodeInserts.length; i += EP_BATCH) {
    const batch = episodeInserts.slice(i, i + EP_BATCH);
    sql += `INSERT INTO episodes (id, anime_id, episode_number, title, thumbnail, duration, aired_date) VALUES\n${batch.join(',\n')}\nON CONFLICT (id) DO NOTHING;\n\n`;
  }

  sql += '-- Insert Video Sources\n';
  for (let i = 0; i < videoSourceInserts.length; i += EP_BATCH) {
    const batch = videoSourceInserts.slice(i, i + EP_BATCH);
    sql += `INSERT INTO video_sources (episode_id, quality, url) VALUES\n${batch.join(',\n')}\nON CONFLICT DO NOTHING;\n\n`;
  }

  fs.writeFileSync(SEED_SQL_FILE, sql, 'utf8');
  console.log(`\n🎉 Generated ${SEED_SQL_FILE}`);
  console.log(`   ${animes.length} animes, ${episodes.length} episodes, ${videoSourceInserts.length} video sources`);
}

main();
