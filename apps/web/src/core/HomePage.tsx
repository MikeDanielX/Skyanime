import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import type { AnimeEntryDTO, BookEntryDTO, NoteDTO } from "@hub/shared";
import { api } from "../lib/api";
import { hiResCover, heroImage } from "../lib/images";
import { StatusBadge } from "../components/ui";
import { Hero, HeroButton, ScoreChip, PosterRow, PosterTile } from "../components/media";
import { ANIME_STATUS_LABEL, ANIME_STATUS_TONE } from "../modules/anime/status";
import { BOOK_STATUS_LABEL, BOOK_STATUS_TONE } from "../modules/books/status";

const HERO_INTERVAL = 6000;

// Color del label de estado en las notas (paridad con el mockup SkyAnime).
const NOTE_TONE: Record<NoteDTO["status"], string> = {
  TODO: "text-slate-400",
  DOING: "text-amber-400",
  DONE: "text-green-400",
};

// Home = dashboard estilo mockup SkyAnime: Hero carrusel → fila de anime →
// fila de libros → grid de notas rápidas. Todo con los componentes compartidos
// de components/media (sin markup duplicado).
export function HomePage() {
  const nav = useNavigate();
  const [anime, setAnime] = useState<AnimeEntryDTO[]>([]);
  const [books, setBooks] = useState<BookEntryDTO[]>([]);
  const [notes, setNotes] = useState<NoteDTO[]>([]);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    api.get<AnimeEntryDTO[]>("/anime").then(setAnime).catch(() => {});
    api.get<BookEntryDTO[]>("/books").then(setBooks).catch(() => {});
    api.get<NoteDTO[]>("/notes").then(setNotes).catch(() => {});
  }, []);

  // Hero carrusel = anime con carátula (máx 5). Autoavance.
  const slides = anime.filter((a) => a.coverImageUrl).slice(0, 5);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setSlide((p) => (p + 1) % slides.length), HERO_INTERVAL);
    return () => clearInterval(t);
  }, [slides.length]);
  const featured = slides[slide];

  const openNotes = notes.filter((n) => n.status !== "DONE").slice(0, 6);

  return (
    <div className="-m-8">
      <Hero
        imageUrl={heroImage(featured)}
        fallbackImageUrl={hiResCover(featured?.coverImageUrl)}
        slideKey={featured?.id}
        eyebrow={featured ? undefined : "Personal Hub"}
        chips={
          featured && (
            <>
              <StatusBadge
                label={ANIME_STATUS_LABEL[featured.status]}
                tone={ANIME_STATUS_TONE[featured.status]}
              />
              {featured.score != null && <ScoreChip score={featured.score} />}
            </>
          )
        }
        title={featured?.title ?? "Bienvenido"}
        subtitle={
          featured
            ? "Tu hub personal — anime, notas y libros en un solo sitio."
            : "Añade anime, notas y libros para verlos aquí."
        }
        actions={
          <HeroButton icon={<Icons.Play size={16} className="fill-white" />} onClick={() => nav("/anime")}>
            Ir a Anime
          </HeroButton>
        }
        slideCount={slides.length}
        activeSlide={slide}
        onSlide={setSlide}
      />

      <div className="space-y-10 px-8 py-10">
        <PosterRow
          title="Mi lista de anime"
          right={
            <button onClick={() => nav("/anime")} className="text-sm text-accent hover:text-accent-hover">
              Ver todo
            </button>
          }
          empty="Aún sin anime. Búscalo en la sección Anime."
        >
          {anime.map((a) => (
            <PosterTile
              key={a.id}
              title={a.title}
              imageUrl={hiResCover(a.coverImageUrl)}
              onClick={() => nav("/anime")}
              badge={<StatusBadge label={ANIME_STATUS_LABEL[a.status]} tone={ANIME_STATUS_TONE[a.status]} />}
            />
          ))}
        </PosterRow>

        <PosterRow
          title="Mis libros"
          right={
            <button onClick={() => nav("/books")} className="text-sm text-accent hover:text-accent-hover">
              Ver todo
            </button>
          }
          empty="Aún sin libros. Búscalos en la sección Libros."
        >
          {books.map((b) => (
            <PosterTile
              key={b.id}
              title={b.title}
              imageUrl={b.coverImageUrl}
              onClick={() => nav("/books")}
              badge={<StatusBadge label={BOOK_STATUS_LABEL[b.status]} tone={BOOK_STATUS_TONE[b.status]} />}
            />
          ))}
        </PosterRow>

        {/* Notas rápidas — grid 3-col del mockup */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Notas rápidas</h2>
            <button onClick={() => nav("/notes")} className="text-sm text-accent hover:text-accent-hover">
              Ver todas
            </button>
          </div>
          {openNotes.length === 0 ? (
            <p className="text-sm text-slate-500">Sin pendientes. 🎉</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {openNotes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => nav("/notes")}
                  className="rounded-xl border border-white/5 bg-white/5 p-4 text-left transition hover:border-white/15 hover:bg-white/10"
                >
                  <span className={`text-xs font-semibold ${NOTE_TONE[n.status]}`}>{n.status}</span>
                  <p className="mt-1 text-sm">{n.title}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
