import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { ClipboardCheck, PieChart, ArrowRight, CalendarClock, FileCheck2, Bell, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import { DailyAlertsWidget } from '@/components/alerts/DailyAlertsWidget';
import { useAlerts } from '@/hooks/useAlerts';
import { fichaDoDia } from '@/lib/fichaDoDia';
import { todayIso } from '@/lib/taskboardDefaults';
import { existeExportadaNaData } from '@/services/exportedTaskboardService';
import { listarOcorrencias } from '@/services/ocorrenciasService';
import { nomeCategoria, nomeGravidade, resumirOcorrencias } from '@/lib/ocorrencias';

const MODULES = [
  { title: 'SCI', description: 'Sistema de Controlo Interno', icon: ClipboardCheck, path: '/sci/procedimentos' },
  { title: 'Processamentos', description: 'Estatísticas dos processamentos', icon: PieChart, path: '/easyvista/estatisticas' },
];

function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

const Dashboard = () => {
  const now = useNow();
  const { dailyAlerts, loading: alertsLoading } = useAlerts();
  const [, setPermissaoTick] = useState(0);
  const fd = useMemo(() => fichaDoDia(now), [now]);
  const hoje = todayIso();

  const [exportada, setExportada] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    existeExportadaNaData(hoje).then(({ exportada }) => {
      if (alive) setExportada(exportada);
    });
    return () => {
      alive = false;
    };
  }, [hoje]);

  // Ocorrências abertas (a mesma consulta e cache da página de ocorrências).
  const ocorrencias = useQuery({
    queryKey: ['ocorrencias'],
    queryFn: async () => {
      const r = await listarOcorrencias();
      if (r.erro) throw new Error(r.erro);
      return r.ocorrencias;
    },
    refetchInterval: 60_000,
  });
  const abertas = useMemo(() => (ocorrencias.data ?? []).filter((o) => o.estado === 'aberta'), [ocorrencias.data]);
  const resumoOcorrencias = useMemo(() => resumirOcorrencias(ocorrencias.data ?? [], hoje), [ocorrencias.data, hoje]);

  const proximoAlerta = useMemo(() => {
    const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const futuros = (dailyAlerts ?? [])
      .filter((a) => (a.alert_time ?? '').slice(0, 5) > hm)
      .sort((a, b) => a.alert_time.localeCompare(b.alert_time));
    const prox = futuros[0];
    if (!prox) return null;
    const [h, m] = prox.alert_time.split(':').map(Number);
    const alvo = new Date(now);
    alvo.setHours(h, m, 0, 0);
    const min = Math.max(0, Math.round((alvo.getTime() - now.getTime()) / 60000));
    const contagem = min >= 60 ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}min` : `${min} min`;
    return { nome: prox.alert_name, hora: prox.alert_time.slice(0, 5), contagem };
  }, [dailyAlerts, now]);

  return (
    <PageContainer size="wide">
      <PageHeader title="Hoje em resumo" subtitle="O estado do turno num relance" />

      {/* Ficha de hoje */}
      <Card className="mb-6 border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Ficha de hoje</CardTitle>
              <Badge variant="outline">{fd.label}</Badge>
            </div>
            <RouterLink to={fd.path}>
              <Button size="sm">
                Abrir ficha de hoje
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </RouterLink>
          </div>
        </CardHeader>
        <CardContent className="pt-0 text-sm">
          <span className="text-muted-foreground">{hoje} · </span>
          {exportada === null ? (
            <span className="text-muted-foreground">a verificar…</span>
          ) : exportada ? (
            <span className="text-success font-medium">já foi exportada uma ficha para hoje</span>
          ) : (
            <span className="text-foreground font-medium">ainda sem ficha exportada hoje</span>
          )}
        </CardContent>
      </Card>

      {/* Próximo alerta */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4" /> Próximo alerta de hora certa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <p className="text-sm text-muted-foreground">a carregar…</p>
          ) : proximoAlerta ? (
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold tabular-nums">{proximoAlerta.contagem}</span>
              <span className="text-sm text-muted-foreground">
                até <strong>{proximoAlerta.nome}</strong> ({proximoAlerta.hora})
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Bell className="h-4 w-4" /> Sem mais alertas de hora certa para hoje.
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            À hora de cada alerta aparece um aviso no ecrã até escolheres “Já feito” ou “Adiar 10 min”.
          </p>
          {typeof Notification !== 'undefined' && Notification.permission === 'default' && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => void Notification.requestPermission().then(() => setPermissaoTick((t) => t + 1))}
            >
              <Bell className="h-4 w-4 mr-1.5" /> Ativar também avisos do sistema (com a app em segundo plano)
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Ocorrências abertas */}
      <Card className={`mb-6 ${resumoOcorrencias.abertasAltas > 0 ? 'border-destructive/50' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Ocorrências abertas
            </CardTitle>
            <RouterLink to="/sci/ocorrencias">
              <Button size="sm" variant="outline">
                Ver ocorrências
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </RouterLink>
          </div>
        </CardHeader>
        <CardContent>
          {ocorrencias.isLoading ? (
            <p className="text-sm text-muted-foreground">a carregar…</p>
          ) : ocorrencias.isError ? (
            <p className="text-sm text-muted-foreground">Não consegui carregar as ocorrências.</p>
          ) : abertas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ocorrência aberta.</p>
          ) : (
            <>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold tabular-nums">{abertas.length}</span>
                <span className="text-sm text-muted-foreground">
                  {resumoOcorrencias.abertasAltas > 0
                    ? `${resumoOcorrencias.abertasAltas} de gravidade alta`
                    : 'nenhuma de gravidade alta'}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {abertas.slice(0, 3).map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-2">
                    <Badge variant={o.gravidade === 'alta' ? 'destructive' : o.gravidade === 'media' ? 'default' : 'secondary'}>
                      {nomeGravidade(o.gravidade)}
                    </Badge>
                    <span className="font-medium">{o.titulo}</span>
                    <span className="text-xs text-muted-foreground">
                      {nomeCategoria(o.categoria)}
                      {o.sistema ? ` · ${o.sistema}` : ''} · {o.data}
                    </span>
                  </li>
                ))}
              </ul>
              {abertas.length > 3 && <p className="mt-2 text-xs text-muted-foreground">e mais {abertas.length - 3}…</p>}
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {MODULES.map((module) => (
          <RouterLink to={module.path} key={module.title} className="group">
            <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <module.icon className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="mt-4 text-lg">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
            </Card>
          </RouterLink>
        ))}

        <div className="h-full">
          <DailyAlertsWidget />
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
