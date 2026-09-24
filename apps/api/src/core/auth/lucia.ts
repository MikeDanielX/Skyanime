import { Lucia } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { db } from "../db.js";
import { isProd } from "../env.js";

// Lucia corre EN NUESTRO backend (no servicio externo) — mismo principio de
// independencia que el AIProvider. Vemos y controlamos cómo funciona la sesión.
const adapter = new PrismaAdapter(db.session, db.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      // Seguridad de cookie:
      secure: isProd, // solo HTTPS en prod (en dev http://localhost no lo permite)
      sameSite: "lax", // mitiga CSRF; "lax" deja navegación normal, bloquea POST cross-site
      // httpOnly lo pone Lucia por defecto → JS del navegador no puede leerla (anti-XSS)
    },
  },
  getUserAttributes: (attrs) => ({ email: attrs.email }),
});

// Tipado del módulo Lucia para este proyecto.
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: { email: string };
  }
}
