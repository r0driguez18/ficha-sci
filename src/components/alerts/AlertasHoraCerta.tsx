import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { getTodayAlerts, type DailyAlert } from '@/services/alertsService';
import { isBusinessDay } from '@/utils/businessDays';
import { todayIso } from '@/lib/taskboardDefaults';

/** Alerta que já passou há mais do que isto não aparece ao abrir a app (só os recentes). */
const JANELA_MIN = 30;
const ADIAR_MIN = 10;
const VERIFICA_CADA_MS = 15_000;
const RECARREGA_CADA_MS = 10 * 60_000;

interface Estado {
  /** Alertas dados por feitos hoje (neste navegador). */
  feitos: string[];
  /** id → instante (ms) até ao qual o alerta está adiado. */
  adiados: Record<string, number>;
}

const chave = () => `alertas-hora-certa:${todayIso()}`;

function lerEstado(): Estado {
  try {
    const raw = localStorage.getItem(chave());
    if (raw) {
      const e = JSON.parse(raw) as Partial<Estado>;
      return { feitos: Array.isArray(e.feitos) ? e.feitos : [], adiados: e.adiados ?? {} };
    }
  } catch {
    /* sem storage: só vale durante a sessão */
  }
  return { feitos: [], adiados: {} };
}

function gravarEstado(e: Estado) {
  try {
    localStorage.setItem(chave(), JSON.stringify(e));
  } catch {
    /* ignora */
  }
}

const minutosDoDia = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Aviso no ecrã à hora de cada alerta de hora certa (tabela daily_alerts):
 * um aviso que fica até alguém dizer "Já feito" ou "Adiar 10 min". Se a app
 * estiver em segundo plano e as notificações do navegador estiverem
 * permitidas, também sai uma notificação do sistema.
 *
 * O "já feito" guarda-se neste navegador, por dia: não é partilhado entre
 * operadores (cada posto trata dos seus avisos).
 */
export function AlertasHoraCerta() {
  const { user } = useAuth();
  const alertas = useRef<DailyAlert[]>([]);
  const estado = useRef<Estado>(lerEstado());
  const dia = useRef(todayIso());
  const visiveis = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;
    let vivo = true;

    const carregar = async () => {
      const { data } = await getTodayAlerts();
      if (vivo && data) alertas.current = data;
    };

    const marcarFeito = (id: string) => {
      estado.current.feitos = [...new Set([...estado.current.feitos, id])];
      delete estado.current.adiados[id];
      gravarEstado(estado.current);
      visiveis.current.delete(id);
    };

    const adiar = (id: string) => {
      estado.current.adiados[id] = Date.now() + ADIAR_MIN * 60_000;
      gravarEstado(estado.current);
      visiveis.current.delete(id);
    };

    const mostrar = (a: DailyAlert) => {
      const hora = a.alert_time.slice(0, 5);
      visiveis.current.add(a.id);
      toast.warning(`${hora} — ${a.alert_name}`, {
        id: `alerta-${a.id}`,
        description: a.description || undefined,
        duration: Infinity,
        closeButton: false,
        action: { label: 'Já feito', onClick: () => marcarFeito(a.id) },
        cancel: { label: `Adiar ${ADIAR_MIN} min`, onClick: () => adiar(a.id) },
        onDismiss: () => {
          // Fechado sem escolher: volta a lembrar daqui a pouco, não se perde.
          if (visiveis.current.has(a.id)) adiar(a.id);
        },
      });
      try {
        if (
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted' &&
          document.visibilityState === 'hidden'
        ) {
          new Notification(`${hora} — ${a.alert_name}`, { body: a.description || undefined, tag: `alerta-${a.id}` });
        }
      } catch {
        /* notificações não disponíveis */
      }
    };

    const verificar = () => {
      const agora = new Date();
      // Virou o dia: recomeça (o estado é por dia).
      if (dia.current !== todayIso()) {
        dia.current = todayIso();
        estado.current = lerEstado();
        visiveis.current.clear();
        void carregar();
      }
      if (!isBusinessDay(agora)) return;
      const min = agora.getHours() * 60 + agora.getMinutes();

      for (const a of alertas.current) {
        if (estado.current.feitos.includes(a.id) || visiveis.current.has(a.id)) continue;
        const adiadoAte = estado.current.adiados[a.id];
        if (adiadoAte !== undefined) {
          if (Date.now() >= adiadoAte) mostrar(a);
          continue;
        }
        const desde = min - minutosDoDia(a.alert_time);
        if (desde >= 0 && desde <= JANELA_MIN) mostrar(a);
      }
    };

    void carregar().then(verificar);
    const t1 = setInterval(verificar, VERIFICA_CADA_MS);
    const t2 = setInterval(() => void carregar(), RECARREGA_CADA_MS);
    return () => {
      vivo = false;
      clearInterval(t1);
      clearInterval(t2);
    };
  }, [user?.id]);

  return null;
}
