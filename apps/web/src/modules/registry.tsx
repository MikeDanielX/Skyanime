import type { ComponentType } from "react";
import { NotesPage } from "./notes/NotesPage";
import { AnimePage } from "./anime/AnimePage";
import { BooksPage } from "./books/BooksPage";

// ── Registro central de módulos (frontend) ──
// Espeja el registro del backend. Añadir módulo = importar su página + meta aquí.
// El layout pinta la nav a partir de esta lista; el router monta las rutas.
export interface WebModule {
  id: string;
  label: string;
  path: string; // ruta en el router web
  icon: string; // nombre lucide-react
  Page: ComponentType;
}

export const WEB_MODULES: WebModule[] = [
  { id: "notes", label: "Notas", path: "/notes", icon: "StickyNote", Page: NotesPage },
  { id: "anime", label: "Anime", path: "/anime", icon: "Tv", Page: AnimePage },
  { id: "books", label: "Libros", path: "/books", icon: "BookOpen", Page: BooksPage },
];
