import type { ReadStatus } from "@hub/shared";

// Estado de lectura → etiqueta ES + tono del badge. Compartido por BooksPage,
// HomePage y el contexto del chat (un solo sitio = consistencia).
export const BOOK_STATUS_LABEL: Record<ReadStatus, string> = {
  PLANNED: "Por leer",
  READING: "Leyendo",
  COMPLETED: "Leído",
  DROPPED: "Abandonado",
};

export const BOOK_STATUS_TONE: Record<ReadStatus, "neutral" | "blue" | "green" | "red"> = {
  PLANNED: "neutral",
  READING: "blue",
  COMPLETED: "green",
  DROPPED: "red",
};

// Orden de ciclo al hacer click en el badge/póster.
export const BOOK_STATUS_ORDER: ReadStatus[] = ["PLANNED", "READING", "COMPLETED", "DROPPED"];
