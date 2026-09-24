import type { AnimeSearchResult } from "@hub/shared";

// Media layer fuente-agnóstico: buscar externo → normalizar → el usuario guarda.
// AniList primaria; si cae (403/timeout/red), Kitsu la sustituye. Mismo principio
// de independencia que el AIProvider: si un proveedor cae, otro responde.
const ANILIST_URL = "https://graphql.anilist.co";
const KITSU_URL = "https://kitsu.io/api/edge/anime";

const SEARCH_QUERY = `
query ($search: String, $perPage: Int) {
  Page(perPage: $perPage) {
    media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
      id
      title { romaji english }
      coverImage { extraLarge large medium }
      bannerImage
    }
  }
}`;

interface AniListMedia {
  id: number;
  title: { romaji: string | null; english: string | null };
  // Pedimos varias resoluciones; preferimos la mayor para evitar hero borroso.
  coverImage: { extraLarge: string | null; large: string | null; medium: string | null } | null;
  // Banner ancho (wallpaper del hero). AniList ya lo sirve como imagen apaisada.
  bannerImage: string | null;
}

interface KitsuAnime {
  id: string;
  attributes: {
    canonicalTitle: string | null;
    titles: { en: string | null; en_jp: string | null } | null;
    // original = máxima resolución de Kitsu; large de respaldo.
    posterImage: { original: string | null; large: string | null; small: string | null } | null;
    // coverImage en Kitsu = banner ancho apaisado (~3360×800), no el póster.
    coverImage: { original: string | null; large: string | null; small: string | null } | null;
  };
}

// Error tipado para que la ruta traduzca a HTTP sin conocer la fuente.
export class AnimeSourceError extends Error {}

async function searchAniList(term: string, perPage: number): Promise<AnimeSearchResult[]> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "user-agent": "personal-hub/0.1 (https://github.com/mikedanielx)",
    },
    body: JSON.stringify({ query: SEARCH_QUERY, variables: { search: term, perPage } }),
  });
  if (!res.ok) throw new AnimeSourceError(`AniList respondió ${res.status}`);

  const json = (await res.json()) as { data?: { Page?: { media?: AniListMedia[] } } };
  const media = json.data?.Page?.media ?? [];
  return media.map((m) => ({
    source: "anilist" as const,
    externalId: String(m.id),
    title: m.title.english ?? m.title.romaji ?? `#${m.id}`,
    coverImageUrl:
      m.coverImage?.extraLarge ?? m.coverImage?.large ?? m.coverImage?.medium ?? null,
    bannerImageUrl: m.bannerImage ?? null,
  }));
}

async function searchKitsu(term: string, perPage: number): Promise<AnimeSearchResult[]> {
  const url = `${KITSU_URL}?filter[text]=${encodeURIComponent(term)}&page[limit]=${perPage}`;
  const res = await fetch(url, { headers: { accept: "application/vnd.api+json" } });
  if (!res.ok) throw new AnimeSourceError(`Kitsu respondió ${res.status}`);

  const json = (await res.json()) as { data?: KitsuAnime[] };
  const data = json.data ?? [];
  return data.map((a) => ({
    source: "kitsu" as const,
    externalId: a.id,
    title: a.attributes.canonicalTitle ?? a.attributes.titles?.en ?? a.attributes.titles?.en_jp ?? `#${a.id}`,
    coverImageUrl:
      a.attributes.posterImage?.original ??
      a.attributes.posterImage?.large ??
      a.attributes.posterImage?.small ??
      null,
    // Banner ancho de Kitsu (coverImage). original tiende a ser enorme; large
    // (1680×400) va perfecto para el hero sin pesar de más.
    bannerImageUrl:
      a.attributes.coverImage?.large ??
      a.attributes.coverImage?.original ??
      a.attributes.coverImage?.small ??
      null,
  }));
}

// Orquesta el fallback: intenta AniList, cae a Kitsu ante cualquier fallo.
// Solo lanza AnimeSourceError si AMBAS fuentes fallan.
export async function searchAnime(term: string, perPage = 12): Promise<AnimeSearchResult[]> {
  try {
    return await searchAniList(term, perPage);
  } catch (anilistErr) {
    try {
      return await searchKitsu(term, perPage);
    } catch (kitsuErr) {
      throw new AnimeSourceError(
        `Ambas fuentes fallaron — AniList: ${(anilistErr as Error).message}; ` +
          `Kitsu: ${(kitsuErr as Error).message}`,
      );
    }
  }
}
