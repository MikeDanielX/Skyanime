import { db } from "../../core/db.js";
import { env } from "../../core/env.js";
import { fetchImages } from "./tmdb.source.js";

// Backfill puntual: reescribe coverImageUrl (póster) + bannerImageUrl (backdrop)
// de los anime YA guardados con las imágenes de TMDB. El enriquecido normal solo
// corre al buscar; las entradas viejas se quedaron con imágenes de AniList/Kitsu.
// Ejecutar: pnpm --filter @hub/api exec tsx --env-file=../../.env src/modules/anime/backfill-tmdb.ts
//
// Idempotente y seguro: si TMDB no encuentra un título, lo deja intacto y lo
// reporta. No borra nada. Se puede reejecutar sin daño.

if (!env.TMDB_READ_TOKEN) {
  console.error("❌ TMDB_READ_TOKEN vacío en .env — nada que hacer.");
  process.exit(1);
}

const rows = await db.animeEntry.findMany({
  select: { id: true, title: true },
  orderBy: { createdAt: "desc" },
});

console.log(`\n🔎 ${rows.length} anime en la DB. Consultando TMDB…\n`);

let updated = 0;
const misses: string[] = [];

for (const row of rows) {
  const img = await fetchImages(row.title);
  if (!img || (!img.poster && !img.backdrop)) {
    misses.push(row.title);
    console.log(`  ⚠️  sin match TMDB: ${row.title}`);
    continue;
  }
  // Solo sobrescribe la variante que TMDB sí trae; conserva la otra.
  await db.animeEntry.update({
    where: { id: row.id },
    data: {
      ...(img.poster ? { coverImageUrl: img.poster } : {}),
      ...(img.backdrop ? { bannerImageUrl: img.backdrop } : {}),
    },
  });
  updated++;
  console.log(`  ✅ ${row.title}`);
}

console.log(`\n✨ Listo. ${updated} actualizados, ${misses.length} sin match.`);
if (misses.length) {
  console.log("   Sin match (imágenes originales intactas):");
  misses.forEach((t) => console.log(`     · ${t}`));
}

await db.$disconnect();
process.exit(0);
