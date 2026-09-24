import type { BookSearchResult } from "@hub/shared";

// Media layer de libros: Open Library (open source, sin API key, CORS-friendly).
// Mismo patrón que anime.source: buscar externo → normalizar → el usuario guarda.
// Una sola fuente por ahora (Open Library es estable y libre); si algún día cae,
// se añade un fallback igual que Kitsu en anime — sin tocar el modelo.
const SEARCH_URL = "https://openlibrary.org/search.json";
const COVERS_URL = "https://covers.openlibrary.org/b/id";

// Error tipado para que la ruta traduzca a HTTP sin conocer la fuente.
export class BookSourceError extends Error {}

interface SearchDoc {
  key: string; // "/works/OL45804W"
  title: string;
  author_name?: string[];
  cover_i?: number;
}

// Carátula por id de cover. L = alta resolución (evita el hero borroso).
function coverUrl(coverId: number | undefined): string | null {
  return coverId ? `${COVERS_URL}/${coverId}-L.jpg` : null;
}

export async function searchBooks(term: string, limit = 12): Promise<BookSearchResult[]> {
  const url =
    `${SEARCH_URL}?q=${encodeURIComponent(term)}&limit=${limit}` +
    `&fields=key,title,author_name,cover_i`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "personal-hub/0.1 (https://github.com/mikedanielx)",
      },
    });
  } catch (cause) {
    throw new BookSourceError(`No se pudo conectar a Open Library: ${(cause as Error).message}`);
  }
  if (!res.ok) throw new BookSourceError(`Open Library respondió ${res.status}`);

  const json = (await res.json()) as { docs?: SearchDoc[] };
  const docs = json.docs ?? [];
  // Solo con carátula — sin portada la fila de posters se ve rota.
  return docs
    .filter((d) => d.cover_i)
    .map((d) => ({
      openLibKey: d.key, // "/works/OL45804W" — clave completa (dedup por ella)
      title: d.title,
      author: d.author_name?.[0] ?? null,
      coverImageUrl: coverUrl(d.cover_i),
    }));
}
