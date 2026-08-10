const fs = require('fs');
const path = require('path');

const MOCK_FILE = '/home/yowa/yume/yowanime/src/data/mockAnime.ts';
const SEED_SQL_FILE = '/home/yowa/yume/yowanime/database/seed.sql';

function escapeSql(str) {
  if (!str) return "NULL";
  return "'" + String(str).replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
}

function main() {
  console.log('Reading mockAnime.ts dataset...');
  const fileContent = fs.readFileSync(MOCK_FILE, 'utf8');

  const jsonStart = fileContent.indexOf('export const mockAnimes: Anime[] = ') + 'export const mockAnimes: Anime[] = '.length;
  const jsonEnd = fileContent.indexOf(';\n\n// ── Mock Episodes Generator');

  const animes = JSON.parse(fileContent.substring(jsonStart, jsonEnd));
  console.log(`Loaded ${animes.length} anime entries.`);

  let sql = `-- ============================================================
-- YOWANIME PostgreSQL Seed Data
-- Total Anime Entries: ${animes.length}
-- Generated automatically from MyAnimeList / manami-project DB
-- ============================================================

-- Insert Genres
INSERT INTO genres (name) VALUES
('Action'), ('Adventure'), ('Comedy'), ('Drama'), ('Fantasy'), ('Horror'),
('Isekai'), ('Mecha'), ('Mystery'), ('Psychological'), ('Romance'),
('Sci-Fi'), ('Slice of Life'), ('Sports'), ('Supernatural'), ('Thriller'), ('Yuri')
ON CONFLICT (name) DO NOTHING;

-- Insert Animes & Anime-Genres Junction
`;

  // Pre-map genres to IDs
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

  // Seed Episodes & Video Sources for all animes
  const episodeInserts = [];
  const videoSourceInserts = [];

  animes.forEach((a) => {
    const totalEp = a.episodes > 0 ? Math.min(a.episodes, 12) : 6;
    for (let i = 1; i <= totalEp; i++) {
      const epId = `${a.id}-ep-${i}`;
      const epTitle = `Episode ${i}: ${a.title}`;
      const thumb = a.banner || a.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';
      const dur = a.duration ? a.duration * 60 : 1440;

      episodeInserts.push(
        `('${epId}', ${escapeSql(a.id)}, ${i}, ${escapeSql(epTitle)}, ${escapeSql(thumb)}, ${dur}, '2026-08-01')`
      );

      videoSourceInserts.push(
        `('${epId}', '1080p', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')`,
        `('${epId}', '720p', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')`,
        `('${epId}', '480p', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')`
      );
    }
  });

  sql += `-- Insert Episodes
INSERT INTO episodes (id, anime_id, episode_number, title, thumbnail, duration, aired_date) VALUES
${episodeInserts.join(',\n')}
ON CONFLICT (id) DO NOTHING;

-- Insert Video Sources
INSERT INTO video_sources (episode_id, quality, url) VALUES
${videoSourceInserts.join(',\n')}
ON CONFLICT DO NOTHING;
`;

  fs.writeFileSync(SEED_SQL_FILE, sql, 'utf8');
  console.log(`Successfully generated PostgreSQL seed.sql file at ${SEED_SQL_FILE}!`);
}

main();
