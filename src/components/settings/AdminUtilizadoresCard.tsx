import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, KeyRound, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  criarUtilizador,
  listarUtilizadores,
  novoLinkUtilizador,
} from '@/services/adminUtilizadoresService';
import { sugerirUtilizador, validarUtilizador } from '@/lib/utilizador';

interface LinkGerado {
  nome: string;
  /** O que a pessoa escreve no login (ou o email, nas contas antigas). */
  entrada: string;
  link: string;
}

const dataCurta = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '—';

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success('Copiado.');
  } catch {
    toast.error('Não consegui copiar — seleciona o texto e copia à mão.');
  }
}

/** Só aparece a administradores (ver Settings). O servidor volta a verificar em cada pedido. */
export function AdminUtilizadoresCard() {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [utilizador, setUtilizador] = useState('');
  const [utilizadorMexido, setUtilizadorMexido] = useState(false);
  const [aCriar, setACriar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [gerado, setGerado] = useState<LinkGerado | null>(null);
  const [aGerarPara, setAGerarPara] = useState<string | null>(null);

  const lista = useQuery({
    queryKey: ['admin-utilizadores'],
    queryFn: async () => {
      const r = await listarUtilizadores();
      if (r.erro) throw new Error(r.erro);
      return r.dados;
    },
    retry: false,
  });

  const livres = lista.data?.operadoresSemConta ?? [];

  const aoMudarNome = (v: string) => {
    setNome(v);
    if (!utilizadorMexido) setUtilizador(sugerirUtilizador(v));
  };

  const mensagem = useMemo(() => {
    if (!gerado) return '';
    const primeiro = gerado.nome.split(' ')[0];
    return (
      `Olá ${primeiro}, já tens conta no SCI. O teu utilizador é "${gerado.entrada}". ` +
      `Abre este link para escolheres a tua palavra-passe ` +
      `(serve uma vez e expira em cerca de 1 hora):\n${gerado.link}`
    );
  }, [gerado]);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    const problema = validarUtilizador(utilizador);
    setErro(problema);
    if (problema) return;
    setACriar(true);
    const r = await criarUtilizador({
      email: email.trim(),
      nome: nome.trim(),
      utilizador: utilizador.trim().toLowerCase(),
    });
    setACriar(false);
    if (r.erro) {
      setErro(r.erro);
      return;
    }
    setGerado({ nome: r.dados.nome, entrada: r.dados.utilizador, link: r.dados.link });
    if (r.dados.retomada) toast.info('A conta já existia, ainda sem palavra-passe — gerei um link novo.');
    setNome('');
    setEmail('');
    setUtilizador('');
    setUtilizadorMexido(false);
    queryClient.invalidateQueries({ queryKey: ['admin-utilizadores'] });
    queryClient.invalidateQueries({ queryKey: ['operators'] });
  };

  const novoLink = async (u: { conta: string; nome: string; utilizador: string | null }) => {
    setAGerarPara(u.conta);
    const r = await novoLinkUtilizador(u.conta);
    setAGerarPara(null);
    if (r.erro) {
      toast.error(r.erro);
      return;
    }
    setGerado({ nome: u.nome || u.conta, entrada: u.utilizador ?? u.conta, link: r.dados.link });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Utilizadores</CardTitle>
          <CardDescription>
            Cria a conta de um colega. O utilizador é o que ele escreve no login e é também o código de
            operador (ex.: nalves). Ninguém vê a palavra-passe: recebes um link, envias à pessoa e ela escolhe
            a dela.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={criar} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="adm-nome">Nome</Label>
                <Input
                  id="adm-nome"
                  value={nome}
                  onChange={(e) => aoMudarNome(e.target.value)}
                  placeholder="Nome e apelido"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-email">Email</Label>
                <Input
                  id="adm-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@dominio"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-utilizador">Utilizador</Label>
                <Input
                  id="adm-utilizador"
                  value={utilizador}
                  onChange={(e) => {
                    setUtilizador(e.target.value.toLowerCase());
                    setUtilizadorMexido(true);
                  }}
                  placeholder="ex.: nalves (sem @)"
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            {livres.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Operadores ainda sem conta:{' '}
                {livres.map((o, i) => (
                  <React.Fragment key={o.codigo}>
                    {i > 0 && ', '}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => {
                        setUtilizador(o.codigo);
                        setUtilizadorMexido(true);
                        if (!nome) setNome(o.nome);
                      }}
                    >
                      {o.nome} ({o.codigo})
                    </button>
                  </React.Fragment>
                ))}
                .
              </p>
            )}

            {erro && (
              <Alert variant="destructive">
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={aCriar}>
              {aCriar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Criar utilizador e gerar link
            </Button>
          </form>

          <div>
            <h3 className="mb-2 text-sm font-medium">Contas existentes</h3>
            {lista.isLoading && <p className="text-sm text-muted-foreground">A carregar…</p>}
            {lista.isError && (
              <Alert variant="destructive">
                <AlertDescription>{(lista.error as Error).message}</AlertDescription>
              </Alert>
            )}
            {lista.data && (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Utilizador</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lista.data.utilizadores.map((u) => (
                      <TableRow key={u.conta}>
                        <TableCell>{u.nome || '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{u.utilizador ?? '—'}</TableCell>
                        <TableCell className="text-xs">{u.email ?? '—'}</TableCell>
                        <TableCell>
                          {u.codigo ? <span className="font-mono text-xs">{u.codigo}</span> : '—'}
                          {u.papel === 'administrador' && (
                            <Badge variant="outline" className="ml-2">
                              admin
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {u.pendente ? (
                            <Badge variant="secondary">à espera da palavra-passe</Badge>
                          ) : (
                            <span className="text-muted-foreground">último acesso {dataCurta(u.ultimoAcesso)}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={aGerarPara === u.conta}
                            onClick={() => novoLink(u)}
                            title="Gera um link novo para a pessoa definir a palavra-passe"
                          >
                            {aGerarPara === u.conta ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <KeyRound className="mr-1 h-4 w-4" />
                            )}
                            Novo link
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!gerado} onOpenChange={(aberto) => !aberto && setGerado(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Link para {gerado?.nome}</DialogTitle>
            <DialogDescription>
              Envia à pessoa (utilizador: <strong>{gerado?.entrada}</strong>). Serve uma só vez e expira em cerca de 1 hora. Esta janela é a
              única vez que o link aparece — se se perder, gera outro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Link</Label>
              <div className="flex gap-2">
                <Input readOnly value={gerado?.link ?? ''} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                <Button type="button" variant="outline" onClick={() => copiar(gerado?.link ?? '')}>
                  <Copy className="mr-1 h-4 w-4" /> Copiar
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Mensagem pronta</Label>
              <pre className="whitespace-pre-wrap break-all rounded-md border bg-muted/40 p-3 text-xs">{mensagem}</pre>
              <Button type="button" variant="outline" size="sm" onClick={() => copiar(mensagem)}>
                <Copy className="mr-1 h-4 w-4" /> Copiar mensagem
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setGerado(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
