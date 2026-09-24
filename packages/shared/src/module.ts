// Contrato de módulo. Define qué es un "módulo" del hub a nivel de metadatos.
// El backend y el frontend tienen cada uno su propio registro (rutas/UI), pero
// comparten esta descripción para nav, íconos y — FASE 3 — exposición como tools.

export interface ModuleMeta {
  /** id estable, kebab-case. Ej "notes". Usado en rutas y registro. */
  id: string;
  /** Nombre visible en la UI. */
  label: string;
  /** Ruta base en la API y en el router web. Ej "/notes". */
  basePath: string;
  /** Ícono (nombre lucide-react) para la nav. */
  icon: string;
}

// FASE 3: aquí se añadirá la descripción de las "tools" que cada módulo expone
// al agente Jarvis (nombre, JSON-schema de input, handler tipado). El contrato
// de módulo ya vive aquí a propósito para que ese salto no toque el core.
