// AniList GraphQL (cliente) SOLO para el LANDING público: trending, temporada y
// horario de emisión. Es browse anónimo — no toca el backend ni la DB del hub.
// (El módulo Anime logueado usa /anime del backend, que es otra cosa.)
const ANILIST_URL = "https://graphql.anilist.co";

async function query<T>(gql: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: gql, variables }),
  });
  if (!res.ok) throw new Error(`AniList ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

// --- Trending ---

const TRENDING_QUERY = `
query ($perPage: Int) {
  Page(page: 1, perPage: $perPage) {
    media(type: ANIME, sort: TRENDING_DESC) {
      id
      title { romaji english }
      coverImage { extraLarge large }
      bannerImage
      description(asHtml: false)
      meanScore
      startDate { year }
    }
  }
}`;

export interface TrendingAnime {
  id: number;
  title: string;
  image: string;
  year: number | string;
  rating: number | null;
  date?: string | null;
  // Solo lo trae fetchTrending (para el Hero). Otras fuentes lo dejan undefined.
  banner?: string | null;
  description?: string | null;
}

// Limpia el sinopsis de AniList: quita tags HTML sueltos y colapsa espacios.
function cleanDescription(raw: string | null): string | null {
  if (!raw) return null;
  return raw.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() || null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// AniList dates can have null month/day (TBA). Degrade gracefully:
// "Jan 15, 2026" → "Jan 2026" → "2026" → null.
export function formatAnilistDate(d: { year: number | null; month: number | null; day: number | null }): string | null {
  if (!d.year) return null;
  if (!d.month) return String(d.year);
  const mon = MONTHS[d.month - 1] ?? "";
  if (!d.day) return `${mon} ${d.year}`;
  return `${mon} ${d.day}, ${d.year}`;
}

export async function fetchTrending(limit = 15): Promise<TrendingAnime[]> {
  const data = await query<{
    Page: {
      media: Array<{
        id: number;
        title: { romaji: string; english: string | null };
        coverImage: { extraLarge: string; large: string };
        bannerImage: string | null;
        description: string | null;
        meanScore: number | null;
        startDate: { year: number | null };
      }>;
    };
  }>(TRENDING_QUERY, { perPage: limit });

  return data.Page.media.map((m) => ({
    id: m.id,
    title: m.title.english || m.title.romaji,
    image: m.coverImage.extraLarge || m.coverImage.large,
    year: m.startDate.year ?? "N/A",
    rating: m.meanScore,
    banner: m.bannerImage,
    description: cleanDescription(m.description),
  }));
}

// --- Schedule by day ---

const SCHEDULE_QUERY = `
query ($start: Int, $end: Int, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
      airingAt
      episode
      media {
        id
        title { romaji english }
        coverImage { large }
        format
        episodes
      }
    }
  }
}`;

export interface ScheduleAnime {
  id: number;
  title: string;
  image: string;
  episode: number;
  airingAt: number;
  format: string | null;
  episodes: number | null;
}

export async function fetchSchedule(dayOffset: number): Promise<ScheduleAnime[]> {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
  const start = Math.floor(target.getTime() / 1000);
  const end = start + 86400;

  const data = await query<{
    Page: {
      airingSchedules: Array<{
        airingAt: number;
        episode: number;
        media: {
          id: number;
          title: { romaji: string; english: string | null };
          coverImage: { large: string };
          format: string | null;
          episodes: number | null;
        };
      }>;
    };
  }>(SCHEDULE_QUERY, { start, end, page: 1, perPage: 25 });

  // Dedup por media id: un show con doble emisión en la misma ventana de 24h
  // saldría repetido y colisionaría en keys de React aguas abajo. Nos quedamos
  // con el primero (ya vienen ordenados por hora).
  const seen = new Set<number>();
  return data.Page.airingSchedules
    .filter((s) => {
      if (seen.has(s.media.id)) return false;
      seen.add(s.media.id);
      return true;
    })
    .map((s) => ({
      id: s.media.id,
      title: s.media.title.english || s.media.title.romaji,
      image: s.media.coverImage.large,
      episode: s.episode,
      airingAt: s.airingAt,
      format: s.media.format,
      episodes: s.media.episodes,
    }));
}

// --- Season (current / upcoming) ---

export type MediaSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";

const SEASON_QUERY = `
query ($season: MediaSeason, $seasonYear: Int, $perPage: Int) {
  Page(page: 1, perPage: $perPage) {
    media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC) {
      id
      title { romaji english }
      coverImage { extraLarge large }
      meanScore
      startDate { year month day }
    }
  }
}`;

export async function fetchSeasonAnime(
  season: MediaSeason,
  seasonYear: number,
  limit = 20,
): Promise<TrendingAnime[]> {
  const data = await query<{
    Page: {
      media: Array<{
        id: number;
        title: { romaji: string; english: string | null };
        coverImage: { extraLarge: string; large: string };
        meanScore: number | null;
        startDate: { year: number | null; month: number | null; day: number | null };
      }>;
    };
  }>(SEASON_QUERY, { season, seasonYear, perPage: limit });

  return data.Page.media.map((m) => ({
    id: m.id,
    title: m.title.english || m.title.romaji,
    image: m.coverImage.extraLarge || m.coverImage.large,
    year: m.startDate.year ?? "N/A",
    rating: m.meanScore,
    date: formatAnilistDate(m.startDate),
  }));
}

// --- Search ---

const SEARCH_QUERY = `
query ($search: String, $perPage: Int) {
  Page(page: 1, perPage: $perPage) {
    media(type: ANIME, search: $search, sort: SEARCH_MATCH) {
      id
      title { romaji english }
      coverImage { extraLarge large }
      meanScore
      startDate { year }
    }
  }
}`;

export async function fetchSearch(q: string, limit = 20): Promise<TrendingAnime[]> {
  const data = await query<{
    Page: {
      media: Array<{
        id: number;
        title: { romaji: string; english: string | null };
        coverImage: { extraLarge: string; large: string };
        meanScore: number | null;
        startDate: { year: number | null };
      }>;
    };
  }>(SEARCH_QUERY, { search: q, perPage: limit });

  return data.Page.media.map((m) => ({
    id: m.id,
    title: m.title.english || m.title.romaji,
    image: m.coverImage.extraLarge || m.coverImage.large,
    year: m.startDate.year ?? "N/A",
    rating: m.meanScore,
  }));
}

// --- Season helpers ---

const SEASONS: MediaSeason[] = ["WINTER", "SPRING", "SUMMER", "FALL"];

// AniList seasons: WINTER Dec–Feb, SPRING Mar–May, SUMMER Jun–Aug, FALL Sep–Nov.
// December belongs to the following year's WINTER season.
export function getCurrentSeason(now = new Date()): { season: MediaSeason; year: number } {
  const month = now.getMonth();
  const year = now.getFullYear();
  if (month === 11) return { season: "WINTER", year: year + 1 };
  const idx = Math.floor(((month + 1) % 12) / 3);
  return { season: SEASONS[idx]!, year };
}

export function getNextSeason(now = new Date()): { season: MediaSeason; year: number } {
  const { season, year } = getCurrentSeason(now);
  const idx = SEASONS.indexOf(season);
  if (idx === 3) return { season: "WINTER", year: year + 1 };
  return { season: SEASONS[idx + 1]!, year };
}

const SEASON_LABELS: Record<MediaSeason, string> = {
  WINTER: "Winter",
  SPRING: "Spring",
  SUMMER: "Summer",
  FALL: "Fall",
};

export function seasonLabel(season: MediaSeason, year: number): string {
  return `${SEASON_LABELS[season]} ${year}`;
}
