import { z } from "zod";

// Seguridad: validamos el entorno AL ARRANCAR. Si falta un secret o está mal,
// el proceso muere aquí con un error claro — nunca corre a medio configurar.
// Los secrets viven solo en .env (fuera de git). Nada hardcodeado.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url(),
  // Solo la usa prisma migrate (URL directa sin pooler). En runtime serverless no
  // existe y NO debe hacer fallar el arranque de la función → opcional.
  DIRECT_URL: z.string().url().optional(),
  API_PORT: z.coerce.number().int().positive().default(3000),
  // Origen del frontend para CORS en dev. En prod es same-origin (SPA + API en el
  // mismo dominio de Vercel) → CORS irrelevante, por eso default y no requerido.
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET debe tener >=16 chars"),

  // IA — el proveedor por defecto y config de cada backend.
  AI_DEFAULT_PROVIDER: z.enum(["ollama", "claude"]).default("ollama"),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("qwen2.5:7b"),
  ANTHROPIC_API_KEY: z.string().default(""),
  CLAUDE_MODEL: z.string().default("claude-sonnet-5"),

  // TMDB — token de lectura v4 (Bearer). Solo el backend lo usa para ENRIQUECER
  // los resultados de anime con imágenes de TMDB (póster + backdrop). Opcional:
  // vacío = sin enriquecer, se usan las imágenes de AniList/Kitsu tal cual.
  TMDB_READ_TOKEN: z.string().default(""),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Variables de entorno inválidas:\n", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
