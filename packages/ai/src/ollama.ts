import type { ChatMessage } from "@hub/shared";
import { AIProvider, AIProviderError } from "./provider.js";

export interface OllamaConfig {
  baseUrl: string; // ej "http://localhost:11434"
  model: string; // ej "qwen2.5:7b"
}

// Proveedor local vía Ollama. Gratis, offline, 0 tokens. Default del hub.
// Usa el endpoint /api/chat de Ollama (no streaming en Fase 1 — texto completo).
export class OllamaProvider implements AIProvider {
  readonly id = "ollama" as const;
  constructor(private readonly cfg: OllamaConfig) {}

  async generate(messages: ChatMessage[]): Promise<string> {
    let res: Response;
    try {
      res = await fetch(`${this.cfg.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: this.cfg.model, messages, stream: false }),
      });
    } catch (cause) {
      // Típico: Ollama no está corriendo. Mensaje accionable.
      throw new AIProviderError(
        this.id,
        `No se pudo conectar a Ollama en ${this.cfg.baseUrl}. ¿Está corriendo? (ollama run ${this.cfg.model})`,
        cause,
      );
    }
    if (!res.ok) {
      throw new AIProviderError(this.id, `Ollama respondió ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as { message?: { content?: string } };
    const text = data.message?.content;
    if (!text) throw new AIProviderError(this.id, "Ollama devolvió respuesta vacía.");
    return text;
  }
}
