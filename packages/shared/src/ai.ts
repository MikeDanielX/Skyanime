import { z } from "zod";

// ── Contrato del AIProvider (compartido front/back) ──
// Principio: una petición va a UN proveedor entero. NO es un filtro ni cadena.
// El usuario elige el proveedor; la capa `packages/ai` enruta.

export const AI_PROVIDERS = ["ollama", "claude"] as const;
export const providerIdSchema = z.enum(AI_PROVIDERS);
export type ProviderId = z.infer<typeof providerIdSchema>;

export const chatRoleSchema = z.enum(["system", "user", "assistant"]);
export type ChatRole = z.infer<typeof chatRoleSchema>;

export const chatMessageSchema = z.object({
  role: chatRoleSchema,
  content: z.string().min(1).max(20_000),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Body del endpoint POST /ai/chat. `provider` opcional: si falta, usa el default del server.
export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(50),
  provider: providerIdSchema.optional(),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export interface ChatResponse {
  provider: ProviderId;
  text: string;
}

// FASE 3: aquí entrarán los tipos de tool-calling (definición de tool, tool_use,
// tool_result). Se mantienen fuera del contrato base a propósito — Fase 1 es solo texto.
