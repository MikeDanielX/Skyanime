// Contratos compartidos front <-> back. Fuente única de verdad de los tipos.
// El backend valida con estos schemas Zod; el frontend infiere los tipos de aquí.
export * from "./module.js";
export * from "./auth.js";
export * from "./ai.js";
export * from "./modules/notes.js";
export * from "./modules/anime.js";
export * from "./modules/books.js";
