import { createRoot } from 'react-dom/client'
// Inter self-alojado (rede isolada não tem acesso ao Google Fonts).
// Subconjunto "latin" — cobre PT-PT e mantém o precache pequeno.
import '@fontsource/inter/latin-300.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './lib/registerServiceWorker'

createRoot(document.getElementById("root")!).render(<App />);

registerServiceWorker();
