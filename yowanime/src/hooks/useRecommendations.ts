/**
 * useRecommendations — fetch similar/related anime from AniList
 * Uses the `recommendations` field and falls back to same-genre search.
 */

import { useState, useEffect } from 'react';
import type { Anime } from '@/types/anime';
import { fetchAniListList, mapAniListToAnime } from '@/services/anilistService';

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

const RECS_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      recommendations(perPage: 10, sort: [RATING_DESC]) {
        nodes {
          mediaRecommendation {
            id
            idMal
            countryOfOrigin
            title { romaji english native }
            coverImage { extraLarge large medium }
            bannerImage
            description(asHtml: false)
            episodes
            duration
            status
            season
            seasonYear
            format
            genres
            averageScore
            trailer { id site }
            studios(isMain: true) { nodes { name } }
          }
        }
      }
    }
  }
`;

export function useRecommendations(animeId: string, genres: string[], limit = 8) {
  const [recommendations, setRecommendations] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!animeId) return;
    let cancelled = false;

    async function fetch() {
      setIsLoading(true);
      try {
        const numId = parseInt(animeId, 10);
        if (!isNaN(numId)) {
          const res = await globalThis.fetch(ANILIST_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: RECS_QUERY, variables: { id: numId } }),
          });
          if (res.ok) {
            const json = await res.json();
            const nodes = json.data?.Media?.recommendations?.nodes ?? [];
            const recs: Anime[] = nodes
              .map((n: any) => n?.mediaRecommendation)
              .filter(Boolean)
              .filter((m: any) => !m.genres?.includes('Hentai'))
              .map(mapAniListToAnime)
              .slice(0, limit);

            if (!cancelled && recs.length >= 3) {
              setRecommendations(recs);
              setIsLoading(false);
              return;
            }
          }
        }

        // Fallback: same-genre search
        if (genres.length > 0) {
          const { data } = await fetchAniListList({
            genre: genres[0] as any,
            sort: 'score',
            pageSize: limit + 4,
          });
          if (!cancelled) {
            const filtered = data.filter((a) => a.id !== animeId).slice(0, limit);
            setRecommendations(filtered);
          }
        }
      } catch {
        // Silently ignore
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetch();
    return () => { cancelled = true; };
  }, [animeId, genres.join(','), limit]);

  return { recommendations, isLoading };
}
