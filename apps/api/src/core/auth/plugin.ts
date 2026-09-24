import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import type { Session, User } from "lucia";
import { lucia } from "./lucia.js";

// Extiende el request con el usuario/sesión resueltos.
declare module "fastify" {
  interface FastifyRequest {
    user: User | null;
    session: Session | null;
  }
  interface FastifyInstance {
    /** Guard: úsalo en preHandler para exigir sesión. Devuelve 401 si no hay. */
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

// Plugin de autenticación:
// 1. onRequest: lee la cookie de sesión, valida contra Lucia, refresca si toca.
// 2. decorate requireAuth: guard reusable para rutas protegidas.
async function authPluginImpl(app: FastifyInstance) {
  app.decorateRequest("user", null);
  app.decorateRequest("session", null);

  app.addHook("onRequest", async (req, reply) => {
    const cookieName = lucia.sessionCookieName;
    const sessionId = req.cookies[cookieName] ?? null;
    if (!sessionId) {
      req.user = null;
      req.session = null;
      return;
    }

    const { session, user } = await lucia.validateSession(sessionId);

    // Lucia rota la sesión: si es "fresh", reescribimos la cookie con nueva expiry.
    if (session?.fresh) {
      const cookie = lucia.createSessionCookie(session.id);
      reply.setCookie(cookie.name, cookie.value, cookie.attributes);
    }
    // Sesión inválida/expirada → cookie en blanco para limpiarla del navegador.
    if (!session) {
      const blank = lucia.createBlankSessionCookie();
      reply.setCookie(blank.name, blank.value, blank.attributes);
    }

    req.user = user;
    req.session = session;
  });

  app.decorate("requireAuth", async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      await reply.code(401).send({ error: "No autenticado" });
    }
  });
}

export const authPlugin = fp(authPluginImpl, { name: "auth-plugin" });
