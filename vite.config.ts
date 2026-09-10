import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      // Registamos o SW à mão (src/lib/registerServiceWorker.ts).
      injectRegister: null,
      workbox: {
        // Precache do shell: JS/CSS/HTML/ícones/fontes locais.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/rest\//, /^\/auth\//, /^\/storage\//, /^\/functions\//],
        // Nunca servir respostas do Supabase a partir da cache — são sempre rede.
        runtimeCaching: [],
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: "BCA - SCI",
        short_name: "SCI",
        description: "Sistema de Controlo Interno — Centro Informática",
        lang: "pt",
        theme_color: "#18467e",
        background_color: "#f7f9fb",
        display: "standalone",
        start_url: "/dashboard",
        icons: [
          { src: "/bca-icon.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
