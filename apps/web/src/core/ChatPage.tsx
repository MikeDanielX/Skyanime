import { useEffect, useState } from "react";
import type {
  AnimeEntryDTO,
  BookEntryDTO,
  ChatMessage,
  ChatResponse,
  NoteDTO,
  ProviderId,
} from "@hub/shared";
import { api, ApiError } from "../lib/api";
import { Button, Card, Input } from "../components/ui";
import { ANIME_STATUS_LABEL } from "../modules/anime/status";
import { BOOK_STATUS_LABEL } from "../modules/books/status";

// Construye el mensaje `system` con los datos reales del hub (anime + libros +
// notas) para que la IA responda "¿qué he visto/leído?" sin inventar. Se antepone
// al enviar, no se muestra en el historial. Vacío → null (no ensuciamos el prompt).
function buildContext(anime: AnimeEntryDTO[], books: BookEntryDTO[], notes: NoteDTO[]): ChatMessage | null {
  if (anime.length === 0 && books.length === 0 && notes.length === 0) return null;

  const animeLines = anime.map(
    // score es 0-100 en el modelo → lo mostramos así.
    (a) => `- ${a.title} [${ANIME_STATUS_LABEL[a.status]}]${a.score != null ? ` (${a.score}/100)` : ""}`,
  );
  const bookLines = books.map(
    (b) => `- ${b.title}${b.author ? ` — ${b.author}` : ""} [${BOOK_STATUS_LABEL[b.status]}]`,
  );
  const noteLines = notes.map((n) => {
    const preview = n.body.trim().replace(/\s+/g, " ").slice(0, 120);
    return `- ${n.title} [${n.status}]${preview ? `: ${preview}` : ""}`;
  });

  const parts = [
    "Eres el asistente personal de Mike dentro de su Personal Hub.",
    "Tienes acceso a SUS datos reales de la app. Úsalos para responder. No inventes títulos que no estén en las listas.",
    "",
    animeLines.length ? `ANIME DE MIKE (${anime.length}):\n${animeLines.join("\n")}` : "ANIME DE MIKE: (lista vacía)",
    "",
    bookLines.length ? `LIBROS DE MIKE (${books.length}):\n${bookLines.join("\n")}` : "LIBROS DE MIKE: (biblioteca vacía)",
    "",
    noteLines.length ? `NOTAS DE MIKE (${notes.length}):\n${noteLines.join("\n")}` : "NOTAS DE MIKE: (sin notas)",
  ];

  return { role: "system", content: parts.join("\n") };
}

// Chat de texto con selector MANUAL de proveedor (Ollama local / Claude).
// Demuestra el principio del AIProvider: cada mensaje va a UN proveedor entero.
export function ChatPage() {
  const [providers, setProviders] = useState<ProviderId[]>([]);
  const [provider, setProvider] = useState<ProviderId>("ollama");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anime, setAnime] = useState<AnimeEntryDTO[]>([]);
  const [books, setBooks] = useState<BookEntryDTO[]>([]);
  const [notes, setNotes] = useState<NoteDTO[]>([]);

  useEffect(() => {
    api
      .get<{ providers: ProviderId[]; default: ProviderId }>("/ai/providers")
      .then((r) => {
        setProviders(r.providers);
        setProvider(r.default); // preferencia inicial = default del server
      })
      .catch(() => setProviders(["ollama", "claude"]));
  }, []);

  // Contexto del hub para la IA. Se recarga al entrar en el chat.
  useEffect(() => {
    api.get<AnimeEntryDTO[]>("/anime").then(setAnime).catch(() => {});
    api.get<BookEntryDTO[]>("/books").then(setBooks).catch(() => {});
    api.get<NoteDTO[]>("/notes").then(setNotes).catch(() => {});
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    setError(null);

    const next: ChatMessage[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      // El system con datos del hub se antepone SOLO en el envío (no al historial visible).
      const ctx = buildContext(anime, books, notes);
      const payload = ctx ? [ctx, ...next] : next;
      const res = await api.post<ChatResponse>("/ai/chat", { messages: payload, provider });
      setMessages((prev) => [...prev, { role: "assistant", content: res.text }]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error de IA");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-100">Chat IA</h1>
        {/* Interruptor manual: selección de cerebro. */}
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as ProviderId)}
          className="rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm text-slate-100"
        >
          {providers.map((p) => (
            <option key={p} value={p}>
              {p === "ollama" ? "Local (Qwen)" : "Claude"}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {messages.map((m, i) => (
          <Card key={i} className={m.role === "user" ? "border-accent/40" : ""}>
            <span className="mb-1 block text-xs uppercase text-slate-500">{m.role}</span>
            <p className="whitespace-pre-wrap text-slate-200">{m.content}</p>
          </Card>
        ))}
        {busy && <p className="text-slate-500">Pensando… ({provider})</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <form onSubmit={send} className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe un mensaje…" />
        <Button type="submit" disabled={busy}>
          Enviar
        </Button>
      </form>
    </div>
  );
}
