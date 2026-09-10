/**
 * Registo do service worker (F16 — resiliência).
 *
 * O SW (gerado pelo vite-plugin-pwa) faz precache do "shell" da app —
 * JS/CSS/HTML/ícones/fontes locais — pelo que a aplicação abre mesmo com o
 * servidor Supabase em baixo. As chamadas ao Supabase nunca passam pela
 * cache; ficam a cargo do `ServerStatusProvider`.
 */
export function registerServiceWorker(): void {
  if (import.meta.env.DEV) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  if (typeof window !== 'undefined' && window.isSecureContext === false) return;

  // Import dinâmico: o módulo virtual só existe no build de produção.
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      try {
        registerSW({
          immediate: true,
          onOfflineReady() {
            console.info('SCI pronta para funcionar sem ligação (shell em cache).');
          },
          onRegisterError() {
            /* alguns webviews sandboxed recusam SW — a app funciona na mesma */
          },
        });
      } catch {
        /* ignora — sem cache offline, mas a app continua a funcionar */
      }
    })
    .catch(() => {
      /* sem PWA — a app continua a funcionar, só não fica em cache */
    });
}
