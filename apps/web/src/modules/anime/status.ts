import type { WatchStatus } from "@hub/shared";

// Estado de anime → etiqueta ES + tono del badge. Compartido por AnimePage,
// HomePage y Big Picture (un solo sitio = consistencia).
export const ANIME_STATUS_LABEL: Record<WatchStatus, string> = {
  PLANNED: "Pendiente",
  WATCHING: "Viendo",
  COMPLETED: "Completado",
  DROPPED: "Abandonado",
};

export const ANIME_STATUS_TONE: Record<WatchStatus, "neutral" | "blue" | "green" | "red"> = {
  PLANNED: "neutral",
  WATCHING: "blue",
  COMPLETED: "green",
  DROPPED: "red",
};

// Orden de ciclo al hacer click en el badge.
export const ANIME_STATUS_ORDER: WatchStatus[] = ["PLANNED", "WATCHING", "COMPLETED", "DROPPED"];
