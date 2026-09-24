import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "@hub/shared";
import { AIProvider, AIProviderError } from "./provider.js";

export interface ClaudeConfig {
  apiKey: string;
  model: string; // ej "claude-sonnet-5"
}

// Proveedor Claude — potente, gasta tokens. Alternativa manual al local.
// Claude separa el system prompt del array de mensajes: lo extraemos aquí.
export class ClaudeProvider implements AIProvider {
  readonly id = "claude" as const;
  private readonly client: Anthropic;

  constructor(private readonly cfg: ClaudeConfig) {
    if (!cfg.apiKey) {
      throw new AIProviderError(this.id, "ANTHROPIC_API_KEY vacío. No se puede usar el proveedor claude.");
    }
    this.client = new Anthropic({ apiKey: cfg.apiKey });
  }

  async generate(messages: ChatMessage[]): Promise<string> {
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const turns = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    try {
      const res = await this.client.messages.create({
        model: this.cfg.model,
        max_tokens: 2048,
        ...(system ? { system } : {}),
        messages: turns,
      });
      // Fase 1: solo bloques de texto. FASE 3: aquí se manejará tool_use.
      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      if (!text) throw new AIProviderError(this.id, "Claude no devolvió texto.");
      return text;
    } catch (cause) {
      if (cause instanceof AIProviderError) throw cause;
      throw new AIProviderError(this.id, `Fallo llamando a Claude: ${(cause as Error).message}`, cause);
    }
  }
}
