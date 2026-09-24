import { describe, expect, it } from "vitest";
import { AIRegistry } from "./index.js";
import { OllamaProvider } from "./ollama.js";

const cfg = {
  defaultProvider: "ollama" as const,
  ollama: { baseUrl: "http://localhost:11434", model: "qwen2.5:7b" },
  claude: { apiKey: "sk-test", model: "claude-sonnet-5" },
};

describe("AIRegistry", () => {
  it("pick() sin id usa el default", () => {
    const reg = new AIRegistry(cfg);
    expect(reg.pick().id).toBe("ollama");
  });

  it("pick('claude') devuelve el proveedor claude", () => {
    const reg = new AIRegistry(cfg);
    expect(reg.pick("claude").id).toBe("claude");
  });

  it("cachea la instancia entre llamadas", () => {
    const reg = new AIRegistry(cfg);
    const a = reg.pick("ollama");
    const b = reg.pick("ollama");
    expect(a).toBe(b);
    expect(a).toBeInstanceOf(OllamaProvider);
  });
});
