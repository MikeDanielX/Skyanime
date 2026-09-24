-- Banner ancho (wallpaper) para el hero — distinto del póster vertical.
-- AniList bannerImage / Kitsu coverImage. Nullable: entradas viejas quedan NULL
-- y el frontend deriva el banner de Kitsu por URL determinística.
ALTER TABLE "AnimeEntry" ADD COLUMN "bannerImageUrl" TEXT;
