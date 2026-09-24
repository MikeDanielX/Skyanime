import { useEffect, useState } from "react";
import type { NoteDTO, NoteStatus } from "@hub/shared";
import { api } from "../../lib/api";
import { Button, Card, Input, StatusBadge } from "../../components/ui";

const STATUS_TONE: Record<NoteStatus, "neutral" | "amber" | "green"> = {
  TODO: "neutral",
  DOING: "amber",
  DONE: "green",
};

// Primer módulo end-to-end: valida el pipeline entero (auth → API → DB → UI).
export function NotesPage() {
  const [notes, setNotes] = useState<NoteDTO[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => api.get<NoteDTO[]>("/notes").then(setNotes).finally(() => setLoading(false));
  useEffect(() => void load(), []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const note = await api.post<NoteDTO>("/notes", { title: title.trim() });
    setNotes((prev) => [note, ...prev]);
    setTitle("");
  };

  const cycleStatus = async (n: NoteDTO) => {
    const order: NoteStatus[] = ["TODO", "DOING", "DONE"];
    const next = order[(order.indexOf(n.status) + 1) % order.length]!;
    const updated = await api.patch<NoteDTO>(`/notes/${n.id}`, { status: next });
    setNotes((prev) => prev.map((x) => (x.id === n.id ? updated : x)));
  };

  const remove = async (id: string) => {
    await api.del(`/notes/${id}`);
    setNotes((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-100">Notas</h1>

      <form onSubmit={create} className="flex gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nueva nota…" />
        <Button type="submit">Añadir</Button>
      </form>

      {loading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : notes.length === 0 ? (
        <p className="text-slate-500">Sin notas todavía.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <Card key={n.id} className="flex items-center justify-between gap-3">
              <span className="flex-1 truncate text-slate-200">{n.title}</span>
              <button onClick={() => cycleStatus(n)} title="Cambiar estado">
                <StatusBadge label={n.status} tone={STATUS_TONE[n.status]} />
              </button>
              <Button variant="danger" onClick={() => remove(n.id)} className="px-2 py-1 text-xs">
                Borrar
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
