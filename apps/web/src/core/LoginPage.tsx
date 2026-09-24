import { useState } from "react";
import { credentialsSchema } from "@hub/shared";
import { useAuth } from "./auth";
import { ApiError } from "../lib/api";
import { Button, Card, Input } from "../components/ui";

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación cliente (feedback rápido). El servidor revalida siempre.
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }

    setBusy(true);
    try {
      await (mode === "login" ? login(parsed.data) : register(parsed.data));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error inesperado");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-slate-100">
          {mode === "login" ? "Entrar" : "Crear cuenta"} · SkyAnime | Personal Hub
        </h1>
        <form onSubmit={submit} className="space-y-3">
          <Input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <Input
            type="password"
            placeholder="contraseña (mín. 8)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "…" : mode === "login" ? "Entrar" : "Registrarse"}
          </Button>
        </form>
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entra"}
        </button>
      </Card>
    </div>
  );
}
