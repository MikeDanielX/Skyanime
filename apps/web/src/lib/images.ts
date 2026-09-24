import type { AnimeEntryDTO } from "@hub/shared";

// Imagen del HERO (wallpaper ancho). Prioridad:
//  1. bannerImageUrl guardado (AniList bannerImage / Kitsu coverImage) — lo ideal.
//  2. Último recurso: el póster vertical subido de resolución (se verá estirado,
//     pero nítido). Mejor eso que nada.
// OJO: NO derivar el banner del externalId. Kitsu sirve el cover moderno en
// /anime/<id>/cover_image/large-<hash>.jpeg — el hash NO es derivable, así que
// inventar /cover_images/<id>/large.jpg da 404 en muchos títulos. El banner real
// se guarda al añadir (search lo trae) y se hizo backfill de las filas viejas.
export function heroImage(a: AnimeEntryDTO | null | undefined): string | null {
  if (!a) return null;
  if (a.bannerImageUrl) return a.bannerImageUrl;
  return hiResCover(a.coverImageUrl);
}

// Sube la resolución de carátulas ya guardadas SIN tocar la DB. Las entradas
// viejas guardaron URLs low-res (AniList /medium/, Kitsu /small.jpg); al estirarlas
// en el hero se ven borrosas. Reescribimos la URL al variante de alta resolución
// que sirve el mismo CDN. Si el patrón no encaja, se devuelve la URL tal cual.
export function hiResCover(url: string | null | undefined): string | null {
  if (!url) return null;

  // AniList: .../media/anime/cover/{medium|small}/bx.. → /large/
  if (url.includes("anilistcdn")) {
    return url.replace("/cover/medium/", "/cover/large/").replace("/cover/small/", "/cover/large/");
  }

  // Kitsu: .../poster_images/NN/{tiny|small|medium}.jpg → large.jpg (respeta query).
  if (url.includes("kitsu")) {
    return url.replace(/\/(tiny|small|medium)\.(jpg|jpeg|png|webp)/i, "/large.$2");
  }

  return url;
}
