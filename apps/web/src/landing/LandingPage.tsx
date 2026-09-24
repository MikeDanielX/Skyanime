import { useEffect, useState } from "react";
import { Navbar } from "./Navbar";
import { Hero, type HeroSlide } from "./Hero";
import { Section } from "./ui";
import { AnimeRow } from "./rows";
import {
  SeasonSection,
  ProgrammingSection,
  BookTrendingSection,
  BookBestsellersSection,
  BookNewReleasesSection,
} from "./sections";
import { fetchTrending, getCurrentSeason, getNextSeason, type TrendingAnime } from "./anilist";

// Los 6 primeros del trending alimentan el Hero. Sin banner → cae al cover
// (hi-res). Sin descripción → texto neutro. Así nunca sale un slide roto.
function toHeroSlides(items: TrendingAnime[]): HeroSlide[] {
  return items.slice(0, 6).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description || "Trending now on SkyAnime.",
    image: a.banner || a.image,
  }));
}

// Landing público (identidad SkyAnime: rojo/gris). Browse anónimo vía AniList /
// Open Library. Al pulsar Sign In / cualquier CTA → /login (Lucia).
export function LandingPage({ view = "anime" }: { view?: "anime" | "books" }) {
  const [trending, setTrending] = useState<TrendingAnime[]>([]);
  const [loading, setLoading] = useState(true);

  const current = getCurrentSeason();
  const next = getNextSeason();

  useEffect(() => {
    // El Hero es de anime; en la vista de libros no hace falta el trending.
    if (view !== "anime") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchTrending(15)
      .then((data) => { if (!cancelled) setTrending(data); })
      .catch(() => { /* silencioso: la sección simplemente no aparece si falla */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [view]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <main className="pt-14">
        {view === "books" ? (
          <div className="space-y-10 py-10">
            <Section title="Books">
              <p className="text-gray-400">
                Discover trending reads, bestsellers and new releases. Sign in to save them.
              </p>
            </Section>
            <BookTrendingSection />
            <BookBestsellersSection />
            <BookNewReleasesSection />
          </div>
        ) : (
          <>
            <Hero slides={toHeroSlides(trending)}>
              <Section title="Trending Now">
                <AnimeRow items={trending} loading={loading} />
              </Section>
            </Hero>

            <div className="space-y-10 pb-16">
              <ProgrammingSection />
              <SeasonSection title="This Season" season={current.season} year={current.year} />
              <SeasonSection title="Coming Next" season={next.season} year={next.year} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
