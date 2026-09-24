import { useRef, useState, type DragEvent, type ReactNode } from "react";
import * as Icons from "lucide-react";

// Fuente ÚNICA de la UI tipo "media" (estilo mockup SkyAnime opción C):
// Hero banner full-bleed + filas horizontales de pósters. Home, Anime y Libros
// se construyen SOLO con esto — sin markup duplicado por página.

// Carátula de reemplazo (gris del tema) si un póster no carga.
const POSTER_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400'%3E%3Crect width='300' height='400' fill='%23141821'/%3E%3C/svg%3E";

// ---------------------------------------------------------------------------
// HERO banner full-bleed con carrusel. El fondo es el BANNER ancho (wallpaper);
// si falla, cae al póster nítido vía onError. `slideKey` resetea el <img> al
// cambiar de slide para que un fallback no quede pegado al siguiente banner.
// ---------------------------------------------------------------------------
export function Hero({
  imageUrl,
  fallbackImageUrl,
  slideKey,
  eyebrow,
  chips,
  title,
  subtitle,
  actions,
  slideCount = 0,
  activeSlide = 0,
  onSlide,
}: {
  imageUrl: string | null;
  fallbackImageUrl?: string | null;
  slideKey?: string;
  eyebrow?: ReactNode;
  chips?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  slideCount?: number;
  activeSlide?: number;
  onSlide?: (i: number) => void;
}) {
  return (
    <div className="relative w-full overflow-hidden">
      {imageUrl ? (
        <img
          key={slideKey}
          src={imageUrl}
          alt=""
          className="h-[56vh] w-full object-cover object-top md:h-[70vh]"
          onError={(e) => {
            if (fallbackImageUrl && e.currentTarget.src !== fallbackImageUrl) {
              e.currentTarget.src = fallbackImageUrl;
            }
          }}
        />
      ) : (
        <div className="h-[56vh] w-full bg-gradient-to-br from-accent/30 to-surface md:h-[70vh]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
      <div className="absolute bottom-0 h-64 w-full bg-gradient-to-t from-surface via-surface/70 to-transparent" />
      <div className="absolute inset-0 z-10 flex w-full flex-col justify-end px-8 pb-28 md:w-1/2 md:pb-40">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">{eyebrow}</p>
        )}
        {chips && <div className="mb-3 flex items-center gap-2">{chips}</div>}
        <h1 className="mb-3 text-3xl font-bold drop-shadow-lg md:text-5xl">{title}</h1>
        {subtitle && <p className="mb-6 line-clamp-3 text-slate-200 drop-shadow-md">{subtitle}</p>}
        {actions && <div className="flex gap-3">{actions}</div>}
        {slideCount > 1 && (
          <div className="mt-6 flex gap-1.5">
            {Array.from({ length: slideCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => onSlide?.(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1 w-8 rounded-full transition-all ${
                  i === activeSlide ? "bg-accent" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Botón del hero. `primary` = accent con glow; `glass` = borde translúcido.
export function HeroButton({
  variant = "primary",
  icon,
  children,
  onClick,
}: {
  variant?: "primary" | "glass";
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}) {
  const styles =
    variant === "primary"
      ? "bg-accent text-white shadow-lg shadow-accent/20 hover:bg-accent-hover"
      : "border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20";
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition ${styles}`}
    >
      {icon}
      {children}
    </button>
  );
}

// Chip de puntuación (★ NN/100) sobre el banner.
export function ScoreChip({ score, max = 100 }: { score: number; max?: number }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-0.5 text-xs font-semibold text-amber-300 backdrop-blur-md">
      <Icons.Star size={12} className="fill-amber-300" /> {score}/{max}
    </span>
  );
}

// Barra de búsqueda pill (estilo navbar del mockup) con icono lupa + spinner
// textual. Controlada: el debounce/fetch vive en la página.
export function SearchPill({
  id,
  value,
  onChange,
  placeholder,
  searching = false,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  searching?: boolean;
}) {
  return (
    <div className="relative max-w-xl">
      <Icons.Search
        size={16}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
      />
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-24 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-accent"
      />
      {searching && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
          buscando…
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PÓSTER individual. Hover scale + ring-accent (mockup). Botón borrar opcional
// arriba-derecha (aparece en hover); título + badge de estado DEBAJO del póster.
// `dimmed` = ya guardado en resultados de búsqueda. `draggable`+`onDragStart`
// habilitan arrastrar la card entre secciones (drag&drop nativo HTML5).
// ---------------------------------------------------------------------------
export function PosterTile({
  title,
  imageUrl,
  badge,
  onClick,
  onDelete,
  dimmed = false,
  draggable = false,
  onDragStart,
  onDragEnd,
}: {
  title: string;
  imageUrl: string | null;
  badge?: ReactNode;
  onClick?: () => void;
  onDelete?: () => void;
  dimmed?: boolean;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  return (
    <div
      className="group relative w-40 shrink-0 snap-start"
      draggable={draggable}
      onDragStart={(e) => {
        // Necesario para que Firefox inicie el drag; el payload real lo lleva el estado.
        e.dataTransfer.setData("text/plain", title);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
    >
      <img
        src={imageUrl ?? POSTER_FALLBACK}
        alt={title}
        title={title}
        loading="lazy"
        onClick={onClick}
        className={`h-56 w-40 rounded-lg object-cover object-top transition ${draggable ? "cursor-grab active:cursor-grabbing" : ""} ${
          dimmed
            ? "opacity-60"
            : `${onClick && !draggable ? "cursor-pointer" : ""} group-hover:scale-105 group-hover:ring-2 group-hover:ring-accent`
        }`}
      />
      {onDelete && (
        <button
          onClick={onDelete}
          aria-label="Borrar"
          className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-slate-300 opacity-0 backdrop-blur-md transition hover:text-red-400 group-hover:opacity-100"
        >
          <Icons.Trash2 size={14} />
        </button>
      )}
      <p className="mt-1.5 line-clamp-1 text-xs text-slate-300">{title}</p>
      {badge && <div className="mt-1">{badge}</div>}
    </div>
  );
}

// Fila horizontal con scroll. Cabecera título + acción opcional a la derecha.
// Si no hay hijos, muestra `empty`. Si `onDrop` está presente, la fila es zona
// de soltado (drag&drop): resalta con ring-accent al pasar por encima una card.
export function PosterRow({
  title,
  right,
  empty,
  children,
  onDrop,
}: {
  title: ReactNode;
  right?: ReactNode;
  empty?: string;
  children: ReactNode;
  onDrop?: () => void;
}) {
  const [over, setOver] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  // Flechas al hover (paridad SkyAnime): desplazan ~90% del ancho visible.
  const scroll = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const dropProps = onDrop
    ? {
        onDragOver: (e: DragEvent) => {
          e.preventDefault(); // permite el drop
          e.dataTransfer.dropEffect = "move" as const;
          if (!over) setOver(true);
        },
        onDragLeave: (e: DragEvent) => {
          // Solo apaga el resalte al salir del contenedor, no de un hijo.
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
        },
        onDrop: (e: DragEvent) => {
          e.preventDefault();
          setOver(false);
          onDrop();
        },
      }
    : {};

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        {right}
      </div>
      <div
        {...dropProps}
        className={`min-h-[1rem] rounded-xl transition ${
          over ? "bg-accent/10 ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""
        }`}
      >
        {hasChildren ? (
          // Scroller SkyAnime: snap + overscroll contenido + flechas al hover.
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
              aria-label="Desplazar izquierda"
              className="absolute left-0 top-0 flex h-full w-14 items-center justify-center rounded-l-xl bg-gradient-to-r from-surface/90 via-surface/60 to-transparent text-3xl text-white opacity-0 transition hover:from-surface group-hover:opacity-100"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Desplazar derecha"
              className="absolute right-0 top-0 flex h-full w-14 items-center justify-center rounded-r-xl bg-gradient-to-l from-surface/90 via-surface/60 to-transparent text-3xl text-white opacity-0 transition hover:from-surface group-hover:opacity-100"
            >
              ›
            </button>
          </div>
        ) : (
          <p className={`text-sm text-slate-500 ${onDrop ? "px-1 py-3" : ""}`}>
            {empty ?? "Nada aún."}
          </p>
        )}
      </div>
    </section>
  );
}
