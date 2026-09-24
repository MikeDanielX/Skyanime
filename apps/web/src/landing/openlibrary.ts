// Open Library (cliente) para el descubrimiento de LIBROS: trending, bestsellers
// y novedades. Sin API key, CORS-friendly. Endpoints verificados en vivo:
//   TRENDING     → /trending/weekly.json          (works[] con readinglog activo)
//   BESTSELLERS  → /search.json?q=subject:fiction&sort=readinglog  (más leídos)
//   NEW RELEASES → /search.json?q=first_publish_year:[a TO b]&sort=readinglog
// La forma normalizada (DiscoverBook) casa 1:1 con el guardado del hub:
//   POST /books ← { openLibKey, title, author?, coverImageUrl? }
const BASE = "https://openlibrary.org";
const COVERS = "https://covers.openlibrary.org/b/id";

// Portada L (alta resolución) por id de cover. Sin cover → null (se filtra).
function coverUrl(id: number | undefined | null): string | null {
  return id ? `${COVERS}/${id}-L.jpg` : null;
}

export interface DiscoverBook {
  openLibKey: string; // "/works/OL..W" — clave completa (dedup por ella)
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  year: number | string;
}

interface OLDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
}

function normalize(docs: OLDoc[]): DiscoverBook[] {
  // Solo con portada — sin cover la card se ve rota.
  return docs
    .filter((d) => d.cover_i)
    .map((d) => ({
      openLibKey: d.key,
      title: d.title,
      author: d.author_name?.[0] ?? null,
      coverImageUrl: coverUrl(d.cover_i),
      year: d.first_publish_year ?? "",
    }));
}

const FIELDS = "key,title,author_name,cover_i,first_publish_year";
const HEADERS = { accept: "application/json" };

// Trending semanal (works[] no docs[]). Reusa la misma normalización.
export async function fetchBookTrending(limit = 20): Promise<DiscoverBook[]> {
  const res = await fetch(`${BASE}/trending/weekly.json?limit=${limit}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Open Library trending ${res.status}`);
  const json = (await res.json()) as { works?: OLDoc[] };
  return normalize(json.works ?? []);
}

// Bestsellers = ficción ordenada por readinglog (más gente lo tiene registrado).
export async function fetchBookBestsellers(limit = 20): Promise<DiscoverBook[]> {
  const url = `${BASE}/search.json?q=subject%3Afiction&sort=readinglog&limit=${limit}&fields=${FIELDS}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Open Library bestsellers ${res.status}`);
  const json = (await res.json()) as { docs?: OLDoc[] };
  return normalize(json.docs ?? []);
}

// Novedades = ventana de años recientes, ordenada por readinglog (populares y con
// portada, en vez de sort=new que devuelve entradas basura sin cover).
export async function fetchBookNewReleases(limit = 20): Promise<DiscoverBook[]> {
  // Ventana fija razonable; no usamos Date.now() (no disponible aquí ni necesario).
  const q = encodeURIComponent("first_publish_year:[2024 TO 2026]");
  const url = `${BASE}/search.json?q=${q}&sort=readinglog&limit=${limit}&fields=${FIELDS}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Open Library new releases ${res.status}`);
  const json = (await res.json()) as { docs?: OLDoc[] };
  return normalize(json.docs ?? []);
}
