import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export interface HeroSlide {
  id: number | string;
  title: string;
  description: string;
  image: string;
}

const HERO_INTERVAL = 6000;

// Fallback si aún no cargó el trending (o falla la red). Backdrops TMDB (CDN
// pública). object-top ancla la imagen arriba. Normalmente NO se ven: el landing
// pasa los 6 primeros de Trending Now como slides.
const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: "fb-1",
    title: "Solo Leveling",
    description:
      "Ten years ago, 'the Gate' appeared and connected the real world with the realm of magic and monsters. Hunters were born to fight them.",
    image: "https://image.tmdb.org/t/p/original/xMNH87maNLt9n2bMDYeI6db5VFm.jpg",
  },
  {
    id: "fb-2",
    title: "Eminence of the Shadow",
    description:
      "When Cid is isekai'd to another world, he creates an underground organization to live out a fight against a made-up cult. Little does he know the cult is real...",
    image: "https://image.tmdb.org/t/p/original/htD5SJpPOvkmAowU80KrWnN59WO.jpg",
  },
  {
    id: "fb-3",
    title: "Yu Yu Hakusho: Ghost Files",
    description:
      "It tells the story of Yusuke Urameshi, a teenage delinquent who is struck and killed by a car while saving a child's life.",
    image: "https://image.tmdb.org/t/p/original/uNM5dbnPJXJJs1eggepRWjSvdIR.jpg",
  },
];

export function Hero({ slides, children }: { slides?: HeroSlide[]; children?: ReactNode }) {
  const data = slides && slides.length > 0 ? slides : FALLBACK_SLIDES;
  const [currentIndex, setCurrentIndex] = useState(0);
  // slides puede llegar vacío y luego llenarse (fetch async): clamp el índice.
  const idx = currentIndex % data.length;
  const current = data[idx] ?? data[0]!;
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % data.length);
    }, HERO_INTERVAL);
    return () => clearInterval(timer);
  }, [data.length]);

  // Landing público: los CTAs llevan a login (el catálogo real está tras la sesión).
  const goToLogin = () => navigate("/login");
  const next = () => setCurrentIndex((prev) => (prev + 1) % data.length);
  const prev = () => setCurrentIndex((prev) => (prev === 0 ? data.length - 1 : prev - 1));

  return (
    <div className="relative w-full overflow-hidden">
      <div className="relative w-full">
        <div>
          <img
            key={current.id}
            src={current.image}
            alt={current.title}
            className="h-[56vh] w-full object-cover object-top md:h-[80vh]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
          <div className="absolute bottom-0 h-64 w-full bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent" />

          <div className="absolute inset-0 z-10 flex w-full flex-col justify-end px-8 pb-32 md:w-1/2 md:pb-56">
            <h1 className="mb-3 text-2xl font-bold drop-shadow-lg sm:text-4xl md:text-5xl">
              {current.title}
            </h1>
            <p className="mb-4 line-clamp-2 text-base text-gray-200 drop-shadow-md md:mb-6 md:line-clamp-3">
              {current.description}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goToLogin}
                className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-bold transition hover:bg-red-700"
              >
                Watch Now
              </button>
              <button
                type="button"
                onClick={goToLogin}
                className="rounded-lg border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-bold backdrop-blur-md transition hover:bg-white/20"
              >
                More Info
              </button>
            </div>

            <div className="mt-4 flex gap-1.5 md:mt-6">
              {data.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Slide ${index + 1}`}
                  className="h-1 w-8 overflow-hidden rounded-full bg-white/30 transition-all"
                >
                  <div
                    className={`h-full rounded-full bg-red-500 transition-all duration-300 ${
                      index === idx
                        ? "w-full"
                        : index < idx
                          ? "w-full bg-white/60"
                          : "w-0"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={prev}
            aria-label="Previous"
            className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-xl text-white transition hover:bg-black/70"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next"
            className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-xl text-white transition hover:bg-black/70"
          >
            ›
          </button>
        </div>
      </div>

      {children && <div className="relative z-10 -mt-8 pb-10">{children}</div>}
    </div>
  );
}
