import type { AnimeSearchResult } from "@hub/shared";
import { env } from "../../core/env.js";

// Enriquecedor de imágenes vía TMDB. NO es una fuente de búsqueda: AniList/Kitsu
// siguen mandando en la búsqueda (mejor catálogo de anime). Aquí solo pedimos a
// TMDB póster + backdrop del MISMO título y los sustituimos si los encuentra.
// El token vive solo en el backend (env). Si no hay token o no hay match, se
// devuelven las imágenes originales — nunca rompe la búsqueda.
const TMDB_URL = "https://api.themoviedb.org/3";
// Base de la CDN pública de imágenes. w780 = póster nítido sin pesar de más;
// original para el backdrop del hero (se ve a pantalla ancha).
const IMG = "https://image.tmdb.org/t/p";
const POSTER_SIZE = "w780";
const BACKDROP_SIZE = "original";

interface TmdbResult {
  poster_path: string | null;
  backdrop_path: string | null;
  popularity: number;
}

// Normaliza un título para casar TMDB↔AniList: minúsculas + solo alfanumérico.
// Quita ☆, ":", "-", espacios y sufijos de temporada que descuadran el match.
const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");

// Busca en TMDB (tv → si nada, movie) y devuelve las imágenes del mejor match.
// `tv` primero porque casi todo el anime es serie. AbortController: 4s de techo
// para no colgar la búsqueda si TMDB va lento. Exportada para reuso en el backfill.
export async function fetchImages(
  title: string,
): Promise<{ poster: string | null; backdrop: string | null } | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const headers = {
      Authorization: `Bearer ${env.TMDB_READ_TOKEN}`,
      accept: "application/json",
    };
    const q = encodeURIComponent(title);

    // 1) TV. 2) Movie como respaldo (películas anime).
    for (const kind of ["tv", "movie"] as const) {
      const res = await fetch(`${TMDB_URL}/search/${kind}?query=${q}&include_adult=false`, {
        headers,
        signal: ctrl.signal,
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { results?: TmdbResult[] };
      const results = json.results ?? [];
      if (results.length === 0) continue;

      // Prioriza un match cuyo póster o backdrop exista, ordenado por popularidad.
      const best =
        results
          .filter((r) => r.poster_path || r.backdrop_path)
          .sort((a, b) => b.popularity - a.popularity)[0] ?? null;
      if (!best) continue;

      return {
        poster: best.poster_path ? `${IMG}/${POSTER_SIZE}${best.poster_path}` : null,
        backdrop: best.backdrop_path ? `${IMG}/${BACKDROP_SIZE}${best.backdrop_path}` : null,
      };
    }
    return null;
  } catch {
    // Timeout / red / abort → sin enriquecer. La búsqueda no debe fallar por TMDB.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Enriquece una lista de resultados con imágenes de TMDB. Cachea por título
// normalizado dentro de la misma llamada para no pedir dos veces lo mismo.
// Si no hay token, devuelve la lista intacta (no-op). Sustituye:
//   coverImageUrl  ← póster de TMDB (si lo hay)
//   bannerImageUrl ← backdrop de TMDB (si lo hay)
// Conserva la imagen original cuando TMDB no aporta esa variante.
export async function enrichWithTmdb(
  results: AnimeSearchResult[],
): Promise<AnimeSearchResult[]> {
  if (!env.TMDB_READ_TOKEN) return results;

  const cache = new Map<string, { poster: string | null; backdrop: string | null } | null>();
  return Promise.all(
    results.map(async (r) => {
      const key = norm(r.title);
      if (!cache.has(key)) cache.set(key, await fetchImages(r.title));
      const img = cache.get(key);
      if (!img) return r;
      return {
        ...r,
        coverImageUrl: img.poster ?? r.coverImageUrl,
        bannerImageUrl: img.backdrop ?? r.bannerImageUrl,
      };
    }),
  );
}
