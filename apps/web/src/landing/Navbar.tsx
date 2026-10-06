import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Input } from "./ui";

// Navbar del landing público. La búsqueda real vive tras la sesión, así que
// tanto el submit como el botón "Sign In" llevan al login (Lucia/Postgres).
export function Navbar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate("/login");
  };

  const linkClass = (active: boolean) =>
    active ? "text-white" : "transition hover:text-white";

  return (
    <nav className="fixed top-0 z-50 flex w-full items-center gap-3 border-b border-gray-800 bg-gray-900/95 px-4 py-3 backdrop-blur md:gap-6 md:px-6">
      <Link to="/" className="shrink-0 text-xl font-bold tracking-wider text-red-500">
        SkyAnime
      </Link>

      <div className="hidden items-center gap-4 text-sm font-medium text-gray-300 md:flex">
        <Link to="/" className={linkClass(pathname === "/")}>
          Anime
        </Link>
        <Link to="/discover/books" className={linkClass(pathname === "/discover/books")}>
          Books
        </Link>
      </div>

      <div className="flex-1" />

      <form onSubmit={onSubmit} className="w-28 min-w-0 sm:w-48 lg:w-64">
        <Input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <Link
        to="/login"
        className="shrink-0 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700 md:px-4"
      >
        Sign In
      </Link>
    </nav>
  );
}
