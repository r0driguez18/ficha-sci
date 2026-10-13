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
  sugerirCodigo,
} from '@/services/adminUtilizadoresService';

interface LinkGerado {
  nome: string;
  email: string;
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
  const [codigo, setCodigo] = useState('');
  const [codigoMexido, setCodigoMexido] = useState(false);
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
    if (!codigoMexido) setCodigo(sugerirCodigo(v));
  };

  const mensagem = useMemo(() => {
    if (!gerado) return '';
    const primeiro = gerado.nome.split(' ')[0];
    return (
      `Olá ${primeiro}, já tens conta no SCI. Abre este link para escolheres a tua palavra-passe ` +
      `(serve uma vez e expira em cerca de 1 hora):\n${gerado.link}`
    );
  }, [gerado]);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setACriar(true);
    const r = await criarUtilizador({ email: email.trim(), nome: nome.trim(), codigo: codigo.trim() });
    setACriar(false);
    if (r.erro) {
      setErro(r.erro);
      return;
    }
    setGerado({ nome: r.dados.nome, email: r.dados.email, link: r.dados.link });
    if (r.dados.jaExistia) toast.info('Essa conta já existia — gerei um link novo para ela.');
    setNome('');
    setEmail('');
    setCodigo('');
    setCodigoMexido(false);
    queryClient.invalidateQueries({ queryKey: ['admin-utilizadores'] });
    queryClient.invalidateQueries({ queryKey: ['operators'] });
  };

  const novoLink = async (u: { email: string; nome: string }) => {
    setAGerarPara(u.email);
    const r = await novoLinkUtilizador(u.email);
    setAGerarPara(null);
    if (r.erro) {
      toast.error(r.erro);
      return;
    }
    setGerado({ nome: u.nome || u.email, email: u.email, link: r.dados.link });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Utilizadores</CardTitle>
          <CardDescription>
            Cria a conta de um colega e liga-a ao código de operador. Ninguém vê a palavra-passe: recebes um
            link, envias à pessoa e ela escolhe a dela.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={criar} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                <Label htmlFor="adm-codigo">Código de operador</Label>
                <Input
                  id="adm-codigo"
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value.toLowerCase());
                    setCodigoMexido(true);
                  }}
                  placeholder="ex.: nalves"
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
                        setCodigo(o.codigo);
                        setCodigoMexido(true);
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
                      <TableHead>Email</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lista.data.utilizadores.map((u) => (
                      <TableRow key={u.email}>
                        <TableCell>{u.nome || '—'}</TableCell>
                        <TableCell className="text-xs">{u.email}</TableCell>
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
                            disabled={aGerarPara === u.email}
                            onClick={() => novoLink(u)}
                            title="Gera um link novo para a pessoa definir a palavra-passe"
                          >
                            {aGerarPara === u.email ? (
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
              Envia à pessoa ({gerado?.email}). Serve uma só vez e expira em cerca de 1 hora. Esta janela é a
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
