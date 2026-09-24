// ─── Punto de entrada SERVERLESS de Vercel para toda la API ───
// Vercel detecta este archivo (carpeta /api en la raíz) y lo despliega como UNA
// función. Montamos la app Fastify entera aquí SIN llamar a listen() — en
// serverless no hay puerto: Vercel nos pasa (req,res) de Node y se los "emitimos"
// a Fastify. index.ts (con listen) sigue siendo solo para dev local.
//
// Importa el server YA COMPILADO (dist), no el fuente: dist usa imports .js que
// Node resuelve; el fuente usa extensiones .js apuntando a .ts que el bundler no
// reescribe. Por eso el buildCommand compila apps/api antes.
import type { IncomingMessage, ServerResponse } from "node:http";

// dist/ es ESM ("type":"module"); Vercel compila esta función como CommonJS, y
// un require() de ESM revienta (ERR_REQUIRE_ESM). Por eso cargamos el server con
// import() DINÁMICO (funciona desde CJS y carga el módulo ESM sin transpilar).
type ServerModule = typeof import("../apps/api/dist/core/server.js");
type App = Awaited<ReturnType<ServerModule["buildServer"]>>;
let appPromise: Promise<App> | null = null;

function getApp(): Promise<App> {
  if (!appPromise) {
    appPromise = import("../apps/api/dist/core/server.js").then(async (mod) => {
      const app = await mod.buildServer();
      await app.ready();
      return app;
    });
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();

  // El frontend llama a /api/auth/login, /api/notes, … pero las rutas de Fastify
  // son "desnudas" (/auth/login, /notes). Quitamos el prefijo /api antes de
  // emitir. El lookahead (?=\/|$) evita comerse rutas tipo /apixyz.
  if (req.url) {
    req.url = req.url.replace(/^\/api(?=\/|$)/, "") || "/";
  }

  app.server.emit("request", req, res);
}

// Auth (argon2) + arranque de Prisma en frío pueden pasar del timeout por defecto.
export const config = { maxDuration: 30 };
