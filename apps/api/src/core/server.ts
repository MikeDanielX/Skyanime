import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { authPlugin } from "./auth/plugin.js";
import { authRoutes } from "./auth/routes.js";
import { aiRoutes } from "./ai/routes.js";
import { moduleManifest, registerModules } from "../modules/registry.js";

// Construye la app Fastify. Separado de index.ts para poder testearla con Supertest
// sin abrir un puerto (app.inject / listen efímero).
export async function buildServer() {
  const app = Fastify({ logger: env.NODE_ENV !== "test" });

  // CORS: solo el frontend conocido, y con credenciales (para enviar la cookie).
  await app.register(cors, { origin: env.WEB_ORIGIN, credentials: true });

  // Cookies firmadas con AUTH_SECRET.
  await app.register(cookie, { secret: env.AUTH_SECRET });

  // Auth: resuelve req.user en cada request + expone requireAuth.
  await app.register(authPlugin);

  app.get("/health", async () => ({ ok: true }));

  // Manifiesto de módulos para que la UI pinte la nav dinámica.
  app.get("/modules", async () => moduleManifest);

  await app.register(authRoutes);
  await app.register(aiRoutes);
  await registerModules(app);

  return app;
}
