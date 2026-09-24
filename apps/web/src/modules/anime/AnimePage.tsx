import { useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";
import type { AnimeEntryDTO, AnimeSearchResult, AnimeSectionDTO, WatchStatus } from "@hub/shared";
import { api, ApiError } from "../../lib/api";
import { hiResCover, heroImage } from "../../lib/images";
import { StatusBadge } from "../../components/ui";
import { Hero, HeroButton, ScoreChip, PosterRow, PosterTile, SearchPill } from "../../components/media";
import { ANIME_STATUS_LABEL, ANIME_STATUS_ORDER, ANIME_STATUS_TONE } from "./status";
// Descubrir: mismo browse anónimo que el landing (AniList, keyless).
import {
  fetchSchedule,
  fetchSeasonAnime,
  getCurrentSeason,
  getNextSeason,
  seasonLabel,
} from "../../landing/anilist";

// Fila de descubrimiento (Schedule / temporadas). items ya normalizados a
// AnimeSearchResult para casar 1:1 con add() y la dedup por (source, externalId).
interface DiscoveryRow {
  title: string;
  items: AnimeSearchResult[];
}

const HERO_INTERVAL = 6000;
const SEARCH_ID = "anime-search";

// Destino del "+": una fila por estado, o una sección personalizada. Lo que se
// añada desde la búsqueda cae en ese destino.
type AddTarget = { status: WatchStatus } | { sectionId: string };

// Módulo Anime estilo mockup SkyAnime: Hero carrusel → búsqueda pill live → filas
// de pósters por estado. Todo con los componentes compartidos de components/media.
// Dedup por (source, externalId). Vive dentro del layout con sidebar.
export function AnimePage() {
  const [entries, setEntries] = useState<AnimeEntryDTO[]>([]);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<AnimeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  // Drag&drop: id del póster que se arrastra. addTarget: destino del "+" (estado
  // o sección). Secciones personalizadas del usuario + estado de edición inline.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [addTarget, setAddTarget] = useState<AddTarget | null>(null);
  // Descubrir: filas Schedule/temporadas (AniList). draggingDiscovery = la card de
  // descubrimiento que se arrastra (canal aparte de draggingId, que mueve guardados).
  const [discovery, setDiscovery] = useState<DiscoveryRow[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(true);
  const [draggingDiscovery, setDraggingDiscovery] = useState<AnimeSearchResult | null>(null);
  // Guarda de POSTs en vuelo (dedup por source:externalId): evita doble-guardado si
  // se clica/suelta la misma card de descubrimiento dos veces antes de que resuelva.
  const savingKeys = useRef<Set<string>>(new Set());
  const [sections, setSections] = useState<AnimeSectionDTO[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null); // sección renombrándose
  const [draftName, setDraftName] = useState("");
  // Reordenar secciones: id de la sección que se arrastra por su asa (grip) y la
  // que está debajo del cursor (resalte). Canal separado del drag de pósters.
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [sectionOverId, setSectionOverId] = useState<string | null>(null);

  const load = () => api.get<AnimeEntryDTO[]>("/anime").then(setEntries);
  const loadSections = () => api.get<AnimeSectionDTO[]>("/anime/sections").then(setSections);
  useEffect(() => {
    void load();
    void loadSections();
  }, []);

  // Descubrir (AniList, browse anónimo igual que el landing): Schedule de hoy +
  // esta temporada + la siguiente. Se normaliza a AnimeSearchResult (source
  // "anilist") para que add()/moveTo dedup y guardado funcionen sin cambios.
  useEffect(() => {
    let cancelled = false;
    const cur = getCurrentSeason();
    const nxt = getNextSeason();
    const toResult = (a: { id: number; title: string; image: string }): AnimeSearchResult => ({
      source: "anilist",
      externalId: String(a.id),
      title: a.title,
      coverImageUrl: a.image || null,
      bannerImageUrl: null,
    });
    Promise.allSettled([
      fetchSchedule(0),
      fetchSeasonAnime(cur.season, cur.year, 20),
      fetchSeasonAnime(nxt.season, nxt.year, 20),
    ])
      .then(([sched, thisS, nextS]) => {
        if (cancelled) return;
        const rows: DiscoveryRow[] = [];
        if (sched.status === "fulfilled" && sched.value.length)
          rows.push({ title: "Schedule", items: sched.value.map(toResult) });
        if (thisS.status === "fulfilled" && thisS.value.length)
          rows.push({ title: `This Season · ${seasonLabel(cur.season, cur.year)}`, items: thisS.value.map(toResult) });
        if (nextS.status === "fulfilled" && nextS.value.length)
          rows.push({ title: `Coming Next · ${seasonLabel(nxt.season, nxt.year)}`, items: nextS.value.map(toResult) });
        setDiscovery(rows);
      })
      .finally(() => { if (!cancelled) setDiscoveryLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Hero carrusel = anime con carátula (máx 5). Autoavance.
  const slides = entries.filter((a) => a.coverImageUrl).slice(0, 5);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setSlide((p) => (p + 1) % slides.length), HERO_INTERVAL);
    return () => clearInterval(t);
  }, [slides.length]);
  const featured = slides[slide];

  // Búsqueda LIVE: cada tecla dispara (debounce 350ms). Campo vacío limpia los
  // resultados. `cancelled` descarta respuestas viejas que lleguen tarde (race).
  useEffect(() => {
    const q = term.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await api.get<AnimeSearchResult[]>(`/anime/search?q=${encodeURIComponent(q)}`);
        if (!cancelled) {
          setResults(r);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Error buscando");
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [term]);

  const key = (r: { source: string; externalId: string }) => `${r.source}:${r.externalId}`;
  const savedIds = new Set(entries.map(key));

  // Guarda un resultado en un destino explícito (o el addTarget activo si no se
  // pasa). Drag-to-add pasa el destino de la fila donde se suelta.
  const addWith = async (r: AnimeSearchResult, target: AddTarget | null) => {
    setError(null);
    // Ya guardado (dedup por source+externalId): no dupliques, solo muévelo.
    const existing = entries.find((e) => key(e) === key(r));
    if (existing) {
      if (target) await moveTo(existing.id, target);
      return;
    }
    // Guarda contra doble-POST del mismo item (click+drop o dos clicks rápidos).
    const k = key(r);
    if (savingKeys.current.has(k)) return;
    savingKeys.current.add(k);
    try {
      const entry = await api.post<AnimeEntryDTO>("/anime", {
        source: r.source,
        externalId: r.externalId,
        title: r.title,
        coverImageUrl: r.coverImageUrl ?? undefined,
        bannerImageUrl: r.bannerImageUrl ?? undefined,
        // Destino: estado concreto o sección personalizada.
        ...(target && "status" in target ? { status: target.status } : {}),
        ...(target && "sectionId" in target ? { sectionId: target.sectionId } : {}),
      });
      setEntries((prev) => [entry, ...prev]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error guardando");
    } finally {
      savingKeys.current.delete(k);
    }
  };

  const add = (r: AnimeSearchResult) => addWith(r, addTarget);

  const cycleStatus = async (a: AnimeEntryDTO) => {
    const next =
      ANIME_STATUS_ORDER[(ANIME_STATUS_ORDER.indexOf(a.status) + 1) % ANIME_STATUS_ORDER.length]!;
    const updated = await api.patch<AnimeEntryDTO>(`/anime/${a.id}`, { status: next });
    setEntries((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
  };

  // Drag&drop: mover un anime a un destino (optimista, sin recargar). Destino =
  // estado (limpia sectionId) o sección personalizada (fija sectionId; el estado
  // queda como estaba). `patch` es lo que se manda; `optimistic` lo que se pinta.
  const moveTo = async (id: string, patch: { status: WatchStatus } | { sectionId: string }) => {
    const cur = entries.find((x) => x.id === id);
    if (!cur) return;
    const body = "status" in patch ? { status: patch.status, sectionId: null } : patch;
    // No-op si ya está donde se suelta.
    if ("status" in patch ? cur.status === patch.status && cur.sectionId == null : cur.sectionId === patch.sectionId) {
      return;
    }
    setEntries((prev) => prev.map((x) => (x.id === id ? { ...x, ...body } : x)));
    try {
      const updated = await api.patch<AnimeEntryDTO>(`/anime/${id}`, body);
      setEntries((prev) => prev.map((x) => (x.id === id ? updated : x)));
    } catch (err) {
      setEntries((prev) => prev.map((x) => (x.id === id ? cur : x))); // revierte
      setError(err instanceof ApiError ? err.message : "Error moviendo");
    }
  };

  // "+" de una fila: fija el destino y baja el foco a la búsqueda.
  const addInto = (target: AddTarget) => {
    setAddTarget(target);
    focusSearch();
  };

  // Drop de una fila: descubrimiento → añadir a ese destino; guardado → mover.
  // Se comprueba descubrimiento PRIMERO: al mover un guardado su nodo origen se
  // desmonta en el drop y el navegador puede no disparar dragend (queda draggingId
  // colgado); priorizar draggingDiscovery evita que un add se lea como move viejo.
  // Además los dos canales son mutuamente excluyentes al iniciar el drag (ver abajo).
  const dropInto = (target: AddTarget): (() => void) | undefined => {
    if (draggingDiscovery) {
      const r = draggingDiscovery;
      return () => addWith(r, target);
    }
    if (draggingId) return () => moveTo(draggingId, target);
    return undefined;
  };

  // Inicio de drag: cada canal limpia el otro (exclusión mutua). Blinda contra un
  // dragend perdido que dejaría el canal contrario colgado y confundiría dropInto.
  const startDragEntry = (id: string) => {
    setDraggingDiscovery(null);
    setDraggingId(id);
  };
  const startDragDiscovery = (r: AnimeSearchResult) => {
    setDraggingId(null);
    setDraggingDiscovery(r);
  };

  const remove = async (id: string) => {
    await api.del(`/anime/${id}`);
    setEntries((prev) => prev.filter((x) => x.id !== id));
  };

  // ─── Secciones personalizadas ───
  const createSection = async () => {
    const name = window.prompt("Nombre de la sección (ej: Top 10)")?.trim();
    if (!name) return;
    try {
      const sec = await api.post<AnimeSectionDTO>("/anime/sections", { name });
      setSections((prev) => [sec, ...prev]); // nueva arriba (backend position 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error creando sección");
    }
  };

  const startRename = (sec: AnimeSectionDTO) => {
    setEditingId(sec.id);
    setDraftName(sec.name);
  };

  const commitRename = async (id: string) => {
    const name = draftName.trim();
    setEditingId(null);
    const cur = sections.find((s) => s.id === id);
    if (!name || !cur || cur.name === name) return;
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s))); // optimista
    try {
      const updated = await api.patch<AnimeSectionDTO>(`/anime/sections/${id}`, { name });
      setSections((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      setSections((prev) => prev.map((s) => (s.id === id ? cur : s))); // revierte
      setError(err instanceof ApiError ? err.message : "Error renombrando");
    }
  };

  // Reordenar secciones (drag por el asa). Suelta `dragId` justo ANTES de `overId`
  // (o al final si overId es null). Optimista + persiste el orden completo.
  const reorderSection = async (dragId: string, overId: string | null) => {
    if (dragId === overId) return;
    const ids = sections.map((s) => s.id);
    const from = ids.indexOf(dragId);
    if (from < 0) return;
    ids.splice(from, 1);
    const to = overId ? ids.indexOf(overId) : ids.length;
    ids.splice(to < 0 ? ids.length : to, 0, dragId);
    const prev = sections;
    const reordered = ids.map((id) => prev.find((s) => s.id === id)!).filter(Boolean);
    if (reordered.length === prev.length && reordered.every((s, i) => s.id === prev[i]!.id)) return; // sin cambio
    setSections(reordered); // optimista
    try {
      const fresh = await api.patch<AnimeSectionDTO[]>("/anime/sections/reorder", { ids });
      setSections(fresh);
    } catch (err) {
      setSections(prev); // revierte
      setError(err instanceof ApiError ? err.message : "Error reordenando");
    }
  };

  const deleteSection = async (sec: AnimeSectionDTO) => {
    if (!window.confirm(`¿Borrar la sección "${sec.name}"? Sus animes vuelven a las filas por estado.`)) {
      return;
    }
    try {
      await api.del(`/anime/sections/${sec.id}`);
      setSections((prev) => prev.filter((s) => s.id !== sec.id));
      // Optimista: los animes de la sección borrada pierden su sectionId AHORA, así
      // reaparecen al instante en su fila por estado (sin parpadeo). Espeja el
      // SetNull del backend. load() con .catch confirma/repara sin promesa colgada.
      setEntries((prev) => prev.map((e) => (e.sectionId === sec.id ? { ...e, sectionId: null } : e)));
      load().catch(() => setError("Error recargando tras borrar sección"));
      if (addTarget && "sectionId" in addTarget && addTarget.sectionId === sec.id) setAddTarget(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error borrando sección");
    }
  };

  const focusSearch = () => {
    const el = document.getElementById(SEARCH_ID);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
  };

  // Animes de una fila por estado = ese estado Y sin sección personalizada.
  const byStatus = (s: WatchStatus) => entries.filter((e) => e.status === s && e.sectionId == null);
  // Animes de una sección personalizada.
  const bySection = (id: string) => entries.filter((e) => e.sectionId === id);
  // Etiqueta del destino activo del "+" (para el chip).
  const addTargetLabel = addTarget
    ? "status" in addTarget
      ? ANIME_STATUS_LABEL[addTarget.status]
      : (sections.find((s) => s.id === addTarget.sectionId)?.name ?? "sección")
    : null;

  return (
    <div className="-m-8">
      <Hero
        imageUrl={heroImage(featured)}
        fallbackImageUrl={hiResCover(featured?.coverImageUrl)}
        slideKey={featured?.id}
        eyebrow="Anime"
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
        title={featured?.title ?? "Tu lista de anime"}
        subtitle={
          featured
            ? "Destacado de tu lista personal de anime. Busca abajo para añadir más."
            : "Busca un anime y añádelo a tu lista para verlo aquí."
        }
        actions={
          featured ? (
            <>
              <HeroButton icon={<Icons.RefreshCw size={16} />} onClick={() => cycleStatus(featured)}>
                Cambiar estado
              </HeroButton>
              <HeroButton variant="glass" icon={<Icons.Plus size={16} />} onClick={focusSearch}>
                Añadir más
              </HeroButton>
            </>
          ) : (
            <HeroButton icon={<Icons.Search size={16} />} onClick={focusSearch}>
              Buscar anime
            </HeroButton>
          )
        }
        slideCount={slides.length}
        activeSlide={slide}
        onSlide={setSlide}
      />

      <div className="space-y-10 px-8 py-10">
        <SearchPill
          id={SEARCH_ID}
          value={term}
          onChange={setTerm}
          placeholder="Buscar anime…"
          searching={searching}
        />
        {/* Destino activo del "+": lo que se añada entra en esta fila/sección. */}
        {addTarget && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>
              Añadiendo a <span className="font-semibold text-accent">{addTargetLabel}</span>
            </span>
            <button
              onClick={() => setAddTarget(null)}
              className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400 transition hover:border-accent hover:text-accent"
            >
              Cancelar
            </button>
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Resultados de búsqueda */}
        {results.length > 0 && (
          <PosterRow title="Resultados">
            {results.map((r) => {
              const saved = savedIds.has(key(r));
              return (
                <PosterTile
                  key={key(r)}
                  title={r.title}
                  imageUrl={r.coverImageUrl}
                  dimmed={saved}
                  onClick={saved ? undefined : () => add(r)}
                  badge={<StatusBadge label={saved ? "Guardado" : "+ Añadir"} tone={saved ? "green" : "blue"} />}
                />
              );
            })}
          </PosterRow>
        )}

        {/* Crear sección personalizada — arriba del todo; las nuevas se insertan
            justo debajo (position 0 en el backend). */}
        <button
          onClick={createSection}
          className="flex items-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-3 text-sm text-slate-400 transition hover:border-accent hover:text-accent"
        >
          <Icons.FolderPlus size={16} /> Nueva sección
        </button>

        {/* Mis secciones personalizadas (ej "Top 10"). Reordenables arrastrando el
            asa (grip). Cada wrapper es zona de drop para REORDENAR secciones; el
            PosterRow interno sigue siendo zona de drop para MOVER animes. Los dos
            drags son mutuamente excluyentes (draggingSectionId vs draggingId). */}
        {sections.map((sec) => (
          <div
            key={sec.id}
            onDragOver={
              draggingSectionId
                ? (e) => {
                    e.preventDefault();
                    if (sectionOverId !== sec.id) setSectionOverId(sec.id);
                  }
                : undefined
            }
            onDrop={
              draggingSectionId
                ? (e) => {
                    e.preventDefault();
                    reorderSection(draggingSectionId, sec.id);
                    setSectionOverId(null);
                  }
                : undefined
            }
            className={`rounded-xl transition ${
              draggingSectionId && sectionOverId === sec.id && draggingSectionId !== sec.id
                ? "ring-2 ring-accent ring-offset-4 ring-offset-surface"
                : ""
            } ${draggingSectionId === sec.id ? "opacity-40" : ""}`}
          >
            <PosterRow
              title={
                editingId === sec.id ? (
                  <input
                    autoFocus
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={() => commitRename(sec.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(sec.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    maxLength={60}
                    className="rounded-lg border border-accent bg-white/5 px-2 py-1 text-xl font-bold text-white outline-none"
                  />
                ) : (
                  <span className="flex items-center gap-2">
                    <span
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", sec.id);
                        setDraggingSectionId(sec.id);
                      }}
                      onDragEnd={() => {
                        setDraggingSectionId(null);
                        setSectionOverId(null);
                      }}
                      title="Arrastra para reordenar"
                      className="cursor-grab text-slate-500 transition hover:text-slate-200 active:cursor-grabbing"
                    >
                      <Icons.GripVertical size={18} />
                    </span>
                    {sec.name}
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-normal text-slate-400">
                      {bySection(sec.id).length}
                    </span>
                  </span>
                )
              }
              empty="Arrastra aquí un anime o pulsa + para añadir."
              onDrop={dropInto({ sectionId: sec.id })}
              right={
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => addInto({ sectionId: sec.id })}
                    title={`Añadir a ${sec.name}`}
                    aria-label={`Añadir a ${sec.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-accent hover:text-accent"
                  >
                    <Icons.Plus size={16} />
                  </button>
                  <button
                    onClick={() => startRename(sec)}
                    title="Renombrar"
                    aria-label="Renombrar sección"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-accent hover:text-accent"
                  >
                    <Icons.Pencil size={14} />
                  </button>
                  <button
                    onClick={() => deleteSection(sec)}
                    title="Borrar sección"
                    aria-label="Borrar sección"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-red-400 hover:text-red-400"
                  >
                    <Icons.Trash2 size={14} />
                  </button>
                </div>
              }
            >
              {bySection(sec.id).map((a) => (
                <PosterTile
                  key={a.id}
                  title={a.title}
                  imageUrl={hiResCover(a.coverImageUrl)}
                  onClick={() => cycleStatus(a)}
                  onDelete={() => remove(a.id)}
                  draggable
                  onDragStart={() => startDragEntry(a.id)}
                  onDragEnd={() => setDraggingId(null)}
                  badge={<StatusBadge label={ANIME_STATUS_LABEL[a.status]} tone={ANIME_STATUS_TONE[a.status]} />}
                />
              ))}
            </PosterRow>
          </div>
        ))}

        {/* Zona de drop para mover una sección al FINAL (solo visible al arrastrar). */}
        {draggingSectionId && sections.length > 1 && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (sectionOverId !== "__end__") setSectionOverId("__end__");
            }}
            onDrop={(e) => {
              e.preventDefault();
              reorderSection(draggingSectionId, null);
              setSectionOverId(null);
            }}
            className={`rounded-xl border border-dashed py-4 text-center text-xs transition ${
              sectionOverId === "__end__"
                ? "border-accent bg-accent/10 text-accent"
                : "border-white/15 text-slate-500"
            }`}
          >
            Soltar aquí para mover al final
          </div>
        )}

        {/* Mi lista, agrupada por estado. TODAS las filas se muestran para poder
            arrastrar/añadir a cualquiera, incl. vacías (zona de soltado). */}
        {entries.length === 0 && !term ? (
          <p className="text-slate-500">Sin anime todavía. Busca arriba para empezar.</p>
        ) : (
          ANIME_STATUS_ORDER.map((s) => (
            <PosterRow
              key={s}
              title={ANIME_STATUS_LABEL[s]}
              empty="Arrastra aquí o pulsa + para añadir."
              onDrop={dropInto({ status: s })}
              right={
                <button
                  onClick={() => addInto({ status: s })}
                  title={`Añadir a ${ANIME_STATUS_LABEL[s]}`}
                  aria-label={`Añadir a ${ANIME_STATUS_LABEL[s]}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-accent hover:text-accent"
                >
                  <Icons.Plus size={16} />
                </button>
              }
            >
              {byStatus(s).map((a) => (
                <PosterTile
                  key={a.id}
                  title={a.title}
                  imageUrl={hiResCover(a.coverImageUrl)}
                  onClick={() => cycleStatus(a)}
                  onDelete={() => remove(a.id)}
                  draggable
                  onDragStart={() => startDragEntry(a.id)}
                  onDragEnd={() => setDraggingId(null)}
                  badge={<StatusBadge label={ANIME_STATUS_LABEL[a.status]} tone={ANIME_STATUS_TONE[a.status]} />}
                />
              ))}
            </PosterRow>
          ))
        )}

        {/* ─── Descubrir (AniList) — bajo "Abandonado". Arrastra una card a
            cualquier fila/sección de arriba para guardarla, o haz click. Las ya
            guardadas se ven atenuadas. */}
        <div className="border-t border-white/5 pt-8">
          <h2 className="mb-1 text-lg font-bold text-slate-200">Descubrir</h2>
          <p className="mb-6 text-sm text-slate-500">
            Arrastra una card a una fila de arriba para guardarla · o haz click para añadirla.
          </p>
          {discoveryLoading ? (
            <p className="text-sm text-slate-500">Cargando descubrimiento…</p>
          ) : (
            <div className="space-y-10">
              {discovery.map((row) => (
                <PosterRow key={row.title} title={row.title}>
                  {row.items.map((r) => {
                    const saved = savedIds.has(key(r));
                    return (
                      <PosterTile
                        key={key(r)}
                        title={r.title}
                        imageUrl={hiResCover(r.coverImageUrl)}
                        dimmed={saved}
                        onClick={saved ? undefined : () => add(r)}
                        draggable={!saved}
                        onDragStart={() => startDragDiscovery(r)}
                        onDragEnd={() => setDraggingDiscovery(null)}
                        badge={<StatusBadge label={saved ? "Guardado" : "+ Añadir"} tone={saved ? "green" : "blue"} />}
                      />
                    );
                  })}
                </PosterRow>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-600">
          Click en un póster para ciclar estado · arrástralo a otra fila/sección para moverlo · + añade ahí ·
          crea secciones propias como "Top 10" · arrastra desde Descubrir para guardar.
        </p>
      </div>
    </div>
  );
}
