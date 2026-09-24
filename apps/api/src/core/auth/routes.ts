import { hash, verify } from "@node-rs/argon2";
import { credentialsSchema } from "@hub/shared";
import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { lucia } from "./lucia.js";

// Parámetros argon2id recomendados (OWASP). argon2id resiste cracking por GPU
// mucho mejor que bcrypt — por eso lo elegimos para hashear passwords.
const ARGON2_OPTS = { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 };

export async function authRoutes(app: FastifyInstance) {
  // ── Registro ──
  app.post("/auth/register", async (req, reply) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Datos inválidos", details: parsed.error.flatten() });
    }
    const { email, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return reply.code(409).send({ error: "Ese email ya está registrado" });

    const passwordHash = await hash(password, ARGON2_OPTS);
    const user = await db.user.create({ data: { email, passwordHash } });

    // Crea sesión y setea cookie httpOnly.
    const session = await lucia.createSession(user.id, {});
    const cookie = lucia.createSessionCookie(session.id);
    reply.setCookie(cookie.name, cookie.value, cookie.attributes);

    return reply.code(201).send({ id: user.id, email: user.email });
  });

  // ── Login ──
  app.post("/auth/login", async (req, reply) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Datos inválidos" });
    }
    const { email, password } = parsed.data;

    const user = await db.user.findUnique({ where: { email } });
    // Mensaje genérico a propósito: no revelar si el email existe (anti-enumeración).
    const genericFail = () => reply.code(401).send({ error: "Credenciales inválidas" });
    if (!user) {
      // Verifica contra un hash falso igualmente para no filtrar timing.
      await verify(
        "$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        password,
        ARGON2_OPTS,
      ).catch(() => false);
      return genericFail();
    }

    const ok = await verify(user.passwordHash, password, ARGON2_OPTS);
    if (!ok) return genericFail();

    const session = await lucia.createSession(user.id, {});
    const cookie = lucia.createSessionCookie(session.id);
    reply.setCookie(cookie.name, cookie.value, cookie.attributes);

    return reply.send({ id: user.id, email: user.email });
  });

  // ── Logout ──
  app.post("/auth/logout", async (req, reply) => {
    if (req.session) await lucia.invalidateSession(req.session.id);
    const blank = lucia.createBlankSessionCookie();
    reply.setCookie(blank.name, blank.value, blank.attributes);
    return reply.send({ ok: true });
  });

  // ── Usuario actual ──
  app.get("/auth/me", async (req, reply) => {
    if (!req.user) return reply.code(401).send({ error: "No autenticado" });
    return reply.send({ id: req.user.id, email: req.user.email });
  });
}
