import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // Un solo .env en la raíz del monorepo (mismo que lee la API).
  envDir: "../../",
});
