/**
 * scraperService.ts
 * Service untuk mengakses & menyaring anime yang berasal dari Otakudesu & Samehadaku.
 */

import type { Anime } from '@/types/anime';
import { mockAnimes } from '@/data/mockAnime';

export function getOtakudesuAnimes(): Anime[] {
  return mockAnimes.filter((a) => a.id.startsWith('otaku-'));
}

export function getSamehadakuAnimes(): Anime[] {
  return mockAnimes.filter((a) => a.id.startsWith('same-'));
}

export function getScrapedAnimes(): Anime[] {
  return mockAnimes.filter((a) => a.id.startsWith('otaku-') || a.id.startsWith('same-'));
}
