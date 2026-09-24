import type { ProviderId } from "@hub/shared";
import { AIProvider, AIProviderError } from "./provider.js";
import { OllamaProvider } from "./ollama.js";
import { ClaudeProvider } from "./claude.js";

export * from "./provider.js";
export { OllamaProvider } from "./ollama.js";
export { ClaudeProvider } from "./claude.js";

export interface AIConfig {
  defaultProvider: ProviderId;
  ollama: { baseUrl: string; model: string };
  claude: { apiKey: string; model: string };
}

// Factory/registro. Construye providers de forma perezosa y enruta por id.
// El interruptor: pick(id) devuelve UN proveedor entero. Sin encadenar.
export class AIRegistry {
  private readonly cache = new Map<ProviderId, AIProvider>();
  constructor(private readonly cfg: AIConfig) {}

  get defaultProvider(): ProviderId {
    return this.cfg.defaultProvider;
  }

  pick(id?: ProviderId): AIProvider {
    const target = id ?? this.cfg.defaultProvider;
    const cached = this.cache.get(target);
    if (cached) return cached;

    let provider: AIProvider;
    switch (target) {
      case "ollama":
        provider = new OllamaProvider(this.cfg.ollama);
        break;
      case "claude":
        provider = new ClaudeProvider(this.cfg.claude);
        break;
      default:
        throw new AIProviderError(target, `Proveedor desconocido: ${target}`);
    }
    this.cache.set(target, provider);
    return provider;
  }
}
