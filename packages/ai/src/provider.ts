import type { ChatMessage, ProviderId } from "@hub/shared";

// ── AIProvider: el "enchufe/interruptor" ──
// Independencia del cerebro IA: si un proveedor cae, otro toma su lugar sin tocar
// el resto del sistema. Cada implementación enruta la petición ENTERA a un solo
// backend. NO es un filtro ni una cadena de proveedores.
export interface AIProvider {
  readonly id: ProviderId;
  /** Toma la conversación, devuelve texto. Contrato mínimo de Fase 1. */
  generate(messages: ChatMessage[]): Promise<string>;

  // FASE 3: se añadirá `generateWithTools(messages, tools)` para Jarvis (tool-calling).
  // La interfaz mínima de arriba se mantiene estable — el agente es una capa encima.
}

// Error uniforme para que el endpoint traduzca a HTTP sin conocer el proveedor.
export class AIProviderError extends Error {
  constructor(
    public readonly providerId: ProviderId,
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}
