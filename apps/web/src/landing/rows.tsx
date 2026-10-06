import { useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card, SkeletonCard } from "./ui";
import type { TrendingAnime } from "./anilist";
import type { DiscoverBook } from "./openlibrary";

// Ancho de card de las filas (AnimeRow, BookRow, Schedule). Fluido en móvil
// (~2 cards visibles), fijo desde sm para que no crezca sin fin en monitores anchos.
export const CARD_W = "w-[42vw] sm:w-[220px] lg:w-[260px]";

// Shell reutilizable: scroller horizontal con flechas al hover (paridad SkyAnime).
// Flechas solo en md+: en táctil no hay hover y se navega con swipe.
// Lo usan AnimeRow, BookRow y el Schedule — misma UX y mismo tamaño de card.
export function ScrollRow({ loading, children }: { loading: boolean; children: ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scroll = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={`${CARD_W} shrink-0`}>
            <SkeletonCard />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="group relative">
      <div
        ref={scrollerRef}
        className="no-scrollbar flex snap-x snap-proximity gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-4 pr-4"
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="Scroll left"
        className="absolute left-0 top-0 hidden h-full w-16 md:flex items-center justify-center bg-gradient-to-r from-black/80 via-black/60 to-transparent text-3xl text-white opacity-0 transition hover:from-black/90 hover:via-black/80 group-hover:opacity-100"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label="Scroll right"
        className="absolute right-0 top-0 hidden h-full w-16 md:flex items-center justify-center bg-gradient-to-l from-black/80 via-black/60 to-transparent text-3xl text-white opacity-0 transition hover:from-black/90 hover:via-black/80 group-hover:opacity-100"
      >
        ›
      </button>
    </div>
  );
}

// En el landing público no hay página de detalle: cada card invita a entrar.
function AnimeCard({ anime }: { anime: TrendingAnime }) {
  return (
    <Link to="/login">
      <Card className="transition-all hover:z-10 hover:scale-105 hover:shadow-2xl">
        <img src={anime.image} alt={anime.title} className="aspect-[3/4] w-full object-cover" />
        <div className="p-3">
          <h3 className="line-clamp-2 text-sm font-semibold text-white">{anime.title}</h3>
          <p className="mt-1 text-xs text-gray-400">
            {anime.date || anime.year}
            {(anime.date || anime.year) && anime.rating ? " • " : ""}
            {anime.rating ?? ""}
          </p>
        </div>
      </Card>
    </Link>
  );
}

export function AnimeRow({ items, loading }: { items: TrendingAnime[]; loading: boolean }) {
  return (
    <ScrollRow loading={loading}>
      {items.map((anime) => (
        <div key={anime.id} className={`${CARD_W} shrink-0 snap-start`}>
          <AnimeCard anime={anime} />
        </div>
      ))}
    </ScrollRow>
  );
}

function BookCard({ book }: { book: DiscoverBook }) {
  return (
    <Link to="/login">
      <Card className="transition-all hover:z-10 hover:scale-105 hover:shadow-2xl">
        <img src={book.coverImageUrl ?? ""} alt={book.title} className="aspect-[3/4] w-full object-cover" />
        <div className="p-3">
          <h3 className="line-clamp-2 text-sm font-semibold text-white">{book.title}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-gray-400">
            {book.author || book.year}
          </p>
        </div>
      </Card>
    </Link>
  );
}

export function BookRow({ items, loading }: { items: DiscoverBook[]; loading: boolean }) {
  return (
    <ScrollRow loading={loading}>
      {items.map((book) => (
        <div key={book.openLibKey} className={`${CARD_W} shrink-0 snap-start`}>
          <BookCard book={book} />
        </div>
      ))}
    </ScrollRow>
  );
}
