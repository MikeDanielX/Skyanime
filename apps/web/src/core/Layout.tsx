import { NavLink, Outlet } from "react-router-dom";
import * as Icons from "lucide-react";
import { useAuth } from "./auth";
import { WEB_MODULES } from "../modules/registry";

// Layout con NAVBAR superior (estilo mockup SkyAnime opción C). La nav se genera
// desde el registro de módulos + entradas del core (Home, Chat). Añadir módulo →
// aparece aquí solo. El contenido va full-bleed debajo (las páginas usan -m-8).
function Icon({ name }: { name: string }) {
  const map = Icons as unknown as Record<string, Icons.LucideIcon>;
  const C = map[name] ?? Icons.Circle;
  return <C size={16} />;
}

// Links del navbar: Home + Chat del core, luego los módulos registrados.
const CORE_LINKS = [
  { to: "/home", label: "Home", icon: "Home" },
  { to: "/chat", label: "Chat IA", icon: "Sparkles" },
];

export function Layout() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 text-sm font-medium transition-colors ${
      isActive ? "text-white" : "text-slate-400 hover:text-white"
    }`;

  return (
    <div className="min-h-screen">
      {/* NAVBAR superior sticky (mockup opción C) */}
      <nav className="sticky top-0 z-30 flex items-center gap-6 border-b border-white/5 bg-surface/80 px-8 py-3 backdrop-blur-md">
        <span className="text-xl font-bold">
          <span className="text-red-500">SkyAnime</span>
          <span className="text-slate-500"> | </span>
          <span className="text-accent">Personal Hub</span>
        </span>
        {CORE_LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} className={linkClass}>
            <Icon name={l.icon} /> {l.label}
          </NavLink>
        ))}
        {WEB_MODULES.map((m) => (
          <NavLink key={m.id} to={m.path} className={linkClass}>
            <Icon name={m.icon} /> {m.label}
          </NavLink>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden max-w-[14rem] truncate text-xs text-slate-500 sm:block">
            {user?.email}
          </span>
          <button
            onClick={logout}
            title="Salir"
            aria-label="Salir"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition hover:border-accent hover:text-accent"
          >
            <Icons.LogOut size={15} /> Salir
          </button>
        </div>
      </nav>

      <main className="p-8">
        <Outlet />
      </main>
    </div>
  );
}
