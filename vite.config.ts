import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const hanWikiProxy = {
  "/__hanwiki": {
    target: "https://wiki.michaelhan.net",
    changeOrigin: true,
    secure: true,
    rewrite: (path: string) => path.replace(/^\/__hanwiki/, ""),
  },
} as const;

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { ...hanWikiProxy },
  },
  preview: {
    proxy: { ...hanWikiProxy },
  },
});
