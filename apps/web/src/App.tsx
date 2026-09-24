import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./core/auth";
import { LoginPage } from "./core/LoginPage";
import { Layout } from "./core/Layout";
import { HomePage } from "./core/HomePage";
import { ChatPage } from "./core/ChatPage";
import { LandingPage } from "./landing/LandingPage";
import { WEB_MODULES } from "./modules/registry";

// Gate de auth. Sin sesión → landing público (/). La cookie decide, no el cliente.
// (Antes iba a /login; tras sign out el usuario cae en el landing desloagueado.)
function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-slate-500">Cargando…</div>;
  if (!user) return <Navigate to="/" replace />;
  return <Outlet />;
}

// Ruta login: si ya hay sesión, sal a la app.
function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-slate-500">Cargando…</div>;
  if (user) return <Navigate to="/home" replace />;
  return <LoginPage />;
}

// Raíz pública: landing SkyAnime para visitantes; logueado → dashboard.
// view alterna Anime (/) vs Books (/books); ambas son browse anónimo.
function LandingRoute({ view = "anime" }: { view?: "anime" | "books" }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-slate-500">Cargando…</div>;
  if (user) return <Navigate to="/home" replace />;
  return <LandingPage view={view} />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing público SkyAnime (visitantes). Logueado → /home.
              OJO: books público va en /discover/books, NO /books — /books es la
              página del MÓDULO logueado (registry) y colisionaría. */}
          <Route path="/" element={<LandingRoute view="anime" />} />
          <Route path="/discover/books" element={<LandingRoute view="books" />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route element={<RequireAuth />}>
            {/* Dashboard del hub con sidebar (requiere sesión) */}
            <Route element={<Layout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/chat" element={<ChatPage />} />
              {WEB_MODULES.map((m) => (
                <Route key={m.id} path={m.path} element={<m.Page />} />
              ))}
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
