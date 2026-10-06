import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import * as Icons from "lucide-react";
import { useAuth } from "./auth";
import { WEB_MODULES } from "../modules/registry";

// Layout con NAVBAR superior (estilo mockup SkyAnime opción C). La nav se genera
// desde el registro de módulos + entradas del core (Home, Chat). Añadir módulo →
// aparece aquí solo. El contenido va full-bleed debajo (las páginas usan
// -m-4 md:-m-8 3xl:-m-16, espejo del padding de <main>). En móvil (<md) los links van a un
// menú hamburguesa: en una fila no caben y ensanchaban toda la página.
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

const NAV_LINKS = [
  ...CORE_LINKS,
  ...WEB_MODULES.map((m) => ({ to: m.path, label: m.label, icon: m.icon })),
];

export function Layout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  // Cierra el menú móvil al navegar.
  useEffect(() => setMenuOpen(false), [pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 text-sm font-medium transition-colors ${
      isActive ? "text-white" : "text-slate-400 hover:text-white"
    }`;

  return (
    <div className="min-h-screen">
      {/* NAVBAR superior sticky (mockup opción C) */}
      <nav className="sticky top-0 z-30 border-b border-white/5 bg-surface/80 backdrop-blur-md">
        <div className="flex items-center gap-4 px-4 py-3 md:gap-6 md:px-8 3xl:px-16">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            className="text-slate-300 transition hover:text-white md:hidden"
          >
            {menuOpen ? <Icons.X size={22} /> : <Icons.Menu size={22} />}
          </button>
          <span className="shrink-0 text-lg font-bold md:text-xl">
            <span className="text-red-500">SkyAnime</span>
            <span className="hidden sm:inline">
              <span className="text-slate-500"> | </span>
              <span className="text-accent">Personal Hub</span>
            </span>
          </span>
          <div className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                <Icon name={l.icon} /> {l.label}
              </NavLink>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden max-w-[14rem] truncate text-xs text-slate-500 lg:block">
              {user?.email}
            </span>
            <button
              onClick={logout}
              title="Salir"
              aria-label="Salir"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition hover:border-accent hover:text-accent"
            >
              <Icons.LogOut size={15} /> <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Menú desplegable móvil */}
        {menuOpen && (
          <div className="flex flex-col gap-1 border-t border-white/5 px-4 py-3 md:hidden">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? "bg-white/5 text-white" : "text-slate-400 hover:text-white"
                  }`
                }
              >
                <Icon name={l.icon} /> {l.label}
              </NavLink>
            ))}
            {user?.email && <p className="truncate px-3 pt-2 text-xs text-slate-500">{user.email}</p>}
          </div>
        )}
      </nav>

      <main className="p-4 md:p-8 3xl:p-16">
        <Outlet />
      </main>
    </div>
  );
}
