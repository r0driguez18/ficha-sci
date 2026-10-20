import { defineConfig } from "vitest/config";
import path from "path";

// Testes de lógica pura e das funções do servidor (sem browser nem base de dados).
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "supabase/functions/**/*.test.ts"],
    // As datas dos testes são locais: fixa o fuso para não depender da máquina.
    env: { TZ: "Atlantic/Cape_Verde" },
  },
});
