import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Section, Card, Badge } from "./ui";
import { AnimeRow, BookRow, ScrollRow } from "./rows";
import {
  fetchSchedule,
  fetchSeasonAnime,
  seasonLabel,
  type MediaSeason,
  type ScheduleAnime,
  type TrendingAnime,
} from "./anilist";
import {
  fetchBookTrending,
  fetchBookBestsellers,
  fetchBookNewReleases,
  type DiscoverBook,
} from "./openlibrary";

// ─── Season ───

// Cache a nivel de módulo por season+year — sobrevive remounts, evita refetch.
const seasonCache = new Map<string, TrendingAnime[]>();

function useSeasonAnime(season: MediaSeason, year: number, limit = 20) {
  const key = `${season}-${year}-${limit}`;
  const [items, setItems] = useState<TrendingAnime[]>(() => seasonCache.get(key) ?? []);
  const [loading, setLoading] = useState(() => !seasonCache.has(key));
  const [error, setError] = useState("");

  useEffect(() => {
    if (seasonCache.has(key)) {
      setItems(seasonCache.get(key)!);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchSeasonAnime(season, year, limit)
      .then((data) => {
        seasonCache.set(key, data);
        if (!cancelled) setItems(data);
      })
      .catch(() => { if (!cancelled) setError("Could not load season anime."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [key, season, year, limit]);

  return { items, loading, error };
}

export function SeasonSection({
  title,
  season,
  year,
}: {
  title: string;
  season: MediaSeason;
  year: number;
}) {
  const { items, loading, error } = useSeasonAnime(season, year);
  if (error) return null;
  return (
    <Section title={`${title} · ${seasonLabel(season, year)}`}>
      <AnimeRow items={items} loading={loading} />
    </Section>
  );
}

// ─── Schedule (tabs por día) ───

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDayOffsets(): { label: string; offset: number }[] {
  const today = new Date().getDay(); // 0=Sun
  const mondayOffset = today === 0 ? -6 : 1 - today;
  return dayLabels.map((label, i) => ({ label, offset: mondayOffset + i }));
}

export function ProgrammingSection() {
  const [days] = useState(getDayOffsets);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [cache, setCache] = useState<Record<number, ScheduleAnime[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const offset = days[selectedIdx]?.offset ?? 0;
  const items = cache[offset];

  useEffect(() => {
    if (items !== undefined) {
      setLoading(false);
      setError("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchSchedule(offset)
      .then((data) => { if (!cancelled) setCache((c) => ({ ...c, [offset]: data })); })
      .catch(() => { if (!cancelled) setError("Could not load schedule."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [offset, retryKey, items]);

  const retry = () => {
    setCache((c) => {
      const next = { ...c };
      delete next[offset];
      return next;
    });
    setRetryKey((k) => k + 1);
  };

  const formatTime = (ts: number) =>
    new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <Section title="Schedule" className="mt-8 space-y-4">
      <div className="mb-4 inline-flex rounded-full border border-gray-700 bg-gray-900/60 p-1">
        {days.map((day, i) => (
          <button
            key={day.label}
            type="button"
            onClick={() => setSelectedIdx(i)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              i === selectedIdx ? "bg-red-600 text-white" : "text-gray-300 hover:bg-white/5"
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-400">Loading...</p>}

      {error && !loading && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-red-400">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-full bg-red-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && items && items.length === 0 && (
        <p className="text-sm text-gray-400">No anime scheduled for this day.</p>
      )}

      {/* Mismo tamaño de card que This Season: fila horizontal w-[260px] (antes grid grande). */}
      {!loading && !error && items && items.length > 0 && (
        <ScrollRow loading={false}>
          {items.map((anime) => (
            <div key={`${anime.id}-${anime.episode}`} className="w-[260px] shrink-0 snap-start">
              <Link to="/login">
                <Card className="relative transition-all hover:z-10 hover:scale-105 hover:shadow-2xl">
                  <img src={anime.image} alt={anime.title} className="aspect-[3/4] w-full object-cover" />
                  {anime.format && (
                    <Badge variant="subtle" className="absolute left-2 top-2">
                      {anime.format}
                    </Badge>
                  )}
                  <div className="p-3">
                    <h3 className="line-clamp-2 text-sm font-semibold text-white">{anime.title}</h3>
                    <p className="mt-1 text-xs text-gray-400">
                      Ep {anime.episode} · {formatTime(anime.airingAt)}
                    </p>
                  </div>
                </Card>
              </Link>
            </div>
          ))}
        </ScrollRow>
      )}
    </Section>
  );
}

// ─── Books (landing público) ───

// Cache por fila — evita refetch al remontar o volver de /login.
const bookCache = new Map<string, DiscoverBook[]>();

function useBookRow(key: string, fetcher: () => Promise<DiscoverBook[]>) {
  const [items, setItems] = useState<DiscoverBook[]>(() => bookCache.get(key) ?? []);
  const [loading, setLoading] = useState(() => !bookCache.has(key));
  const [error, setError] = useState("");

  useEffect(() => {
    if (bookCache.has(key)) {
      setItems(bookCache.get(key)!);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    fetcher()
      .then((data) => {
        bookCache.set(key, data);
        if (!cancelled) setItems(data);
      })
      .catch(() => { if (!cancelled) setError("Could not load books."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // fetcher es estable por key (cada fila pasa su función fija). key basta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { items, loading, error };
}

function BookSection({
  title,
  cacheKey,
  fetcher,
}: {
  title: string;
  cacheKey: string;
  fetcher: () => Promise<DiscoverBook[]>;
}) {
  const { items, loading, error } = useBookRow(cacheKey, fetcher);
  if (error) return null;
  return (
    <Section title={title}>
      <BookRow items={items} loading={loading} />
    </Section>
  );
}

// Las 3 filas del landing de libros (Open Library, sin key).
export function BookTrendingSection() {
  return <BookSection title="Trending" cacheKey="trending" fetcher={() => fetchBookTrending(20)} />;
}
export function BookBestsellersSection() {
  return <BookSection title="Bestsellers" cacheKey="bestsellers" fetcher={() => fetchBookBestsellers(20)} />;
}
export function BookNewReleasesSection() {
  return <BookSection title="New Releases" cacheKey="new" fetcher={() => fetchBookNewReleases(20)} />;
}
