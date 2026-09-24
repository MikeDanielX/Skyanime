import { chatRequestSchema, type ChatResponse } from "@hub/shared";
import { AIProviderError, AIRegistry } from "@hub/ai";
import type { FastifyInstance } from "fastify";
import { env } from "../env.js";

// Registro IA compartido por el server (construido una vez).
const registry = new AIRegistry({
  defaultProvider: env.AI_DEFAULT_PROVIDER,
  ollama: { baseUrl: env.OLLAMA_BASE_URL, model: env.OLLAMA_MODEL },
  claude: { apiKey: env.ANTHROPIC_API_KEY, model: env.CLAUDE_MODEL },
});

export async function aiRoutes(app: FastifyInstance) {
  // Rutas protegidas — solo el dueño usa su IA.
  app.addHook("preHandler", app.requireAuth);

  // Qué proveedores hay y cuál es el default (para el selector de la UI).
  app.get("/ai/providers", async () => ({
    providers: ["ollama", "claude"],
    default: registry.defaultProvider,
  }));

  // Chat de texto. El usuario elige proveedor; enruta a UNO entero.
  app.post("/ai/chat", async (req, reply): Promise<ChatResponse | undefined> => {
    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      await reply.code(400).send({ error: "Datos inválidos", details: parsed.error.flatten() });
      return;
    }
    const { messages, provider } = parsed.data;
    try {
      const p = registry.pick(provider);
      const text = await p.generate(messages);
      return { provider: p.id, text };
    } catch (err) {
      if (err instanceof AIProviderError) {
        // 502: fallo del proveedor upstream (Ollama caído, key mala, etc).
        await reply.code(502).send({ error: err.message, provider: err.providerId });
        return;
      }
      throw err;
    }
    // FASE 3: aquí colgará el modo agente (tool-calling sobre módulos vía tools tipados).
  });
}
