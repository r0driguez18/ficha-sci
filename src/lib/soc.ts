/**
 * SOC — análise do relatório de e-mails em quarentena (Cisco ESA) que o SOC envia.
 *
 * Objetivo: descobrir que remetentes legítimos (sobretudo de Cabo Verde e Portugal) estão a ser
 * bloqueados por engano, para pedir a sua libertação/whitelist, sem libertar o que é mesmo ameaça.
 *
 * Diferenças para a ferramenta antiga (soc.py):
 *  - analisa só o domínio do REMETENTE (origem); a antiga misturava origem e destino e punha o
 *    próprio bca.cv (o destino de todas as mensagens) na lista de domínios "bloqueados";
 *  - separa os remetentes que falham o DMARC (podem ser falsificações) dos que só foram apanhados
 *    pelo anti-spam; nunca recomenda libertar quem teve vírus ou se parece com o banco.
 * Lógica pura (sem React nem I/O) para se poder testar.
 */

export interface LinhaSoc {
  data: Date | null;
  acao: string;
  origem: string;
  destino: string;
  assunto: string;
  dmarc: string;
  antiSpam: string;
  antiVirus: string;
}

export type CampoSoc = keyof LinhaSoc;
export type MapaColunas = Record<CampoSoc, number>;

const semAcentos = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '');
const norm = (s: unknown) => semAcentos(String(s ?? '')).toLowerCase().trim();

/** Descobre em que coluna está cada campo, pelo cabeçalho. null se faltar o essencial (origem e destino). */
export function mapearColunas(cabecalhos: unknown[]): MapaColunas | null {
  const h = cabecalhos.map(norm);
  const acha = (...chaves: string[]) => h.findIndex((x) => x !== '' && chaves.some((k) => x.includes(k)));
  const mapa: MapaColunas = {
    data: acha('data'),
    acao: acha('acao', 'action'),
    origem: acha('origem', 'source', 'from', 'remetente'),
    destino: acha('destino', 'destination', 'recipient', 'to'),
    assunto: acha('assunto', 'subject'),
    dmarc: acha('dmarc'),
    antiSpam: acha('spam'),
    antiVirus: acha('virus'),
  };
  if (mapa.origem < 0 || mapa.destino < 0) return null;
  return mapa;
}

const MESES: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

/** "Oct 4, 2026 @ 12:19:17.000" (exportação do Kibana) ou qualquer data que o JS perceba. */
export function lerData(v: unknown): Date | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  const s = String(v ?? '').trim();
  if (!s) return null;
  const m = /^([A-Za-z]{3})[a-z]* (\d{1,2}), (\d{4}) @ (\d{2}):(\d{2}):(\d{2})/.exec(s);
  if (m && MESES[m[1].toLowerCase()] !== undefined) {
    return new Date(Number(m[3]), MESES[m[1].toLowerCase()], Number(m[2]), Number(m[4]), Number(m[5]), Number(m[6]));
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Linhas da folha (matriz) → linhas tipadas. Ignora as linhas em branco; as de origem "-" ficam (sem remetente). */
export function lerLinhas(matriz: unknown[][], mapa: MapaColunas): LinhaSoc[] {
  const cel = (r: unknown[], i: number) => (i >= 0 ? String(r[i] ?? '').trim() : '');
  const linhas: LinhaSoc[] = [];
  for (const r of matriz) {
    const origem = cel(r, mapa.origem);
    if (!origem) continue;
    linhas.push({
      data: mapa.data >= 0 ? lerData(r[mapa.data]) : null,
      acao: cel(r, mapa.acao),
      origem: origem.toLowerCase(),
      destino: cel(r, mapa.destino).toLowerCase(),
      assunto: cel(r, mapa.assunto),
      dmarc: cel(r, mapa.dmarc),
      antiSpam: cel(r, mapa.antiSpam),
      antiVirus: cel(r, mapa.antiVirus),
    });
  }
  return linhas;
}

export const dominioDe = (email: string) => {
  const i = email.lastIndexOf('@');
  return i < 0 ? '' : email.slice(i + 1).toLowerCase().replace(/[>\s]+$/g, '');
};

export type Classe = 'cv' | 'pt' | 'publico' | 'suspeito' | 'outro';

const WEBMAIL = new Set(['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'protonmail.com', 'icloud.com', 'aol.com', 'mail.com', 'live.com']);
const TLD_SUSPEITOS = ['top', 'xyz', 'click', 'live', 'info', 'site', 'online', 'store', 'tech', 'club', 'work', 'ro', 'ru', 'cn', 'ua', 'pl', 'hu'];
/** Entidades de Cabo Verde que não têm o domínio .cv. */
const CV_SEM_TLD = new Set(['oasisatlantico.com']);

export function classificarDominio(d: string): Classe {
  if (d.endsWith('.cv') || CV_SEM_TLD.has(d)) return 'cv';
  if (d.endsWith('.pt')) return 'pt';
  if (WEBMAIL.has(d)) return 'publico';
  const tld = d.split('.').pop() ?? '';
  if (TLD_SUSPEITOS.includes(tld)) return 'suspeito';
  return 'outro';
}

export const NOME_CLASSE: Record<Classe, string> = {
  cv: 'Cabo Verde',
  pt: 'Portugal',
  publico: 'Webmail público',
  suspeito: 'Domínio suspeito',
  outro: 'Outro',
};

export type Recomendacao = 'whitelist' | 'verificar-remetente' | 'nao-libertar' | 'verificar' | 'manter';

export const NOME_RECOMENDACAO: Record<Recomendacao, string> = {
  whitelist: 'Pedir whitelist',
  'verificar-remetente': 'Verificar com o remetente',
  'nao-libertar': 'Não libertar',
  verificar: 'Verificar caso a caso',
  manter: 'Manter bloqueado',
};

const positivo = (v: string) => /^(positive|fail|true|yes)$/i.test(v.trim());

/** Distância de edição (Levenshtein), para apanhar domínios parecidos com o do banco. */
export function distancia(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

/**
 * O domínio parece-se com um dos nossos (ex.: "bca-cv.com", "bcacv.pt", "bca.cv.exemplo.com")
 * sem ser ele? Compara só a primeira parte do nome (a "marca").
 */
export function pareceComPropriedade(dominio: string, proprios: string[]): string | null {
  for (const p of proprios) {
    if (dominio === p) return null;
    const marca = p.split('.')[0];
    if (marca.length < 3) continue;
    const partes = dominio.split('.');
    const primeira = partes[0];
    const tokens = primeira.split(/[-_]/);
    const junto = primeira.replace(/[-_]/g, '');
    if (tokens.includes(marca) || (junto.startsWith(marca) && junto !== marca) || (partes.length > 2 && partes.slice(0, -1).join('.').includes(`${marca}.`))) return p;
    if (marca.length >= 5 && distancia(primeira, marca) === 1) return p;
  }
  return null;
}

export interface DominioSoc {
  dominio: string;
  classe: Classe;
  mensagens: number;
  remetentes: number;
  dmarcFail: number;
  dmarcPass: number;
  dmarcOutro: number;
  antiSpam: number;
  antiVirus: number;
  primeira: Date | null;
  ultima: Date | null;
  recomendacao: Recomendacao;
  motivo: string;
  parecidoCom: string | null;
  /** Até 3 assuntos de exemplo (só para o operador ver o contexto no ecrã). */
  assuntos: string[];
}

export interface ResumoSoc {
  mensagens: number;
  /** Mensagens sem remetente identificável (origem "-"). */
  semRemetente: number;
  dominiosOrigem: number;
  remetentes: number;
  antiSpam: number;
  antiVirus: number;
  dmarcFail: number;
  dmarcPass: number;
  dmarcOutro: number;
  primeira: Date | null;
  ultima: Date | null;
}

export interface ResultadoSoc {
  resumo: ResumoSoc;
  dominios: DominioSoc[];
  /** Domínios de destino (os nossos): excluídos da lista de remetentes. */
  proprios: string[];
}

function motivoDe(d: Omit<DominioSoc, 'recomendacao' | 'motivo'>, rec: Recomendacao): string {
  switch (rec) {
    case 'nao-libertar':
      return d.antiVirus > 0
        ? `O anti-vírus detetou ameaça em ${d.antiVirus} mensagem(ns)`
        : `Parece-se com ${d.parecidoCom} — possível falsificação do banco`;
    case 'verificar-remetente':
      return `DMARC falhou em ${d.dmarcFail} de ${d.mensagens}: o remetente não passa SPF/DKIM — pode ser falsificação ou configuração errada`;
    case 'whitelist':
      return `Marcado como spam em ${d.antiSpam} de ${d.mensagens} mensagens, sem falhas de DMARC nem vírus`;
    case 'verificar':
      return 'Webmail público: depende do remetente concreto';
    default:
      return d.classe === 'suspeito' ? 'Domínio de risco (extensão ou país suspeito)' : 'Fora de Cabo Verde e Portugal';
  }
}

export function recomendar(d: Omit<DominioSoc, 'recomendacao' | 'motivo'>): Recomendacao {
  if (d.antiVirus > 0 || d.parecidoCom) return 'nao-libertar';
  if (d.classe === 'suspeito') return 'manter';
  if (d.classe === 'cv' || d.classe === 'pt') return d.dmarcFail > 0 ? 'verificar-remetente' : 'whitelist';
  if (d.classe === 'publico') return 'verificar';
  return 'manter';
}

/** Analisa as linhas: um registo por domínio de REMETENTE, do mais frequente para o menos. */
export function analisarSoc(linhas: LinhaSoc[], opcoes: { dominiosProprios?: string[] } = {}): ResultadoSoc {
  // Os destinos são os nossos domínios (quase sempre um só): nunca são "remetentes bloqueados".
  const destinos = new Map<string, number>();
  for (const l of linhas) {
    const d = dominioDe(l.destino);
    if (d) destinos.set(d, (destinos.get(d) ?? 0) + 1);
  }
  const proprios = opcoes.dominiosProprios ?? [...destinos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([d]) => d);

  interface Acum {
    mensagens: number;
    remetentes: Set<string>;
    dmarcFail: number;
    dmarcPass: number;
    dmarcOutro: number;
    antiSpam: number;
    antiVirus: number;
    primeira: Date | null;
    ultima: Date | null;
    assuntos: string[];
  }
  const porDominio = new Map<string, Acum>();
  const remetentesTodos = new Set<string>();
  const resumo: ResumoSoc = {
    mensagens: linhas.length,
    semRemetente: 0,
    dominiosOrigem: 0,
    remetentes: 0,
    antiSpam: 0,
    antiVirus: 0,
    dmarcFail: 0,
    dmarcPass: 0,
    dmarcOutro: 0,
    primeira: null,
    ultima: null,
  };

  for (const l of linhas) {
    // Totais do relatório: contam todas as mensagens, também as sem remetente identificável.
    const dm = l.dmarc.toLowerCase();
    const spam = positivo(l.antiSpam);
    const virus = positivo(l.antiVirus);
    if (dm === 'fail') resumo.dmarcFail += 1;
    else if (dm === 'pass') resumo.dmarcPass += 1;
    else resumo.dmarcOutro += 1;
    if (spam) resumo.antiSpam += 1;
    if (virus) resumo.antiVirus += 1;
    if (l.data) {
      if (!resumo.primeira || l.data < resumo.primeira) resumo.primeira = l.data;
      if (!resumo.ultima || l.data > resumo.ultima) resumo.ultima = l.data;
    }

    const dom = dominioDe(l.origem);
    if (!dom) {
      resumo.semRemetente += 1;
      continue;
    }
    remetentesTodos.add(l.origem);
    const a: Acum =
      porDominio.get(dom) ??
      { mensagens: 0, remetentes: new Set(), dmarcFail: 0, dmarcPass: 0, dmarcOutro: 0, antiSpam: 0, antiVirus: 0, primeira: null, ultima: null, assuntos: [] };
    a.mensagens += 1;
    a.remetentes.add(l.origem);
    if (dm === 'fail') a.dmarcFail += 1;
    else if (dm === 'pass') a.dmarcPass += 1;
    else a.dmarcOutro += 1;
    if (spam) a.antiSpam += 1;
    if (virus) a.antiVirus += 1;
    if (l.data) {
      if (!a.primeira || l.data < a.primeira) a.primeira = l.data;
      if (!a.ultima || l.data > a.ultima) a.ultima = l.data;
    }
    if (l.assunto && a.assuntos.length < 3 && !a.assuntos.includes(l.assunto)) a.assuntos.push(l.assunto);
    porDominio.set(dom, a);
  }

  const dominios: DominioSoc[] = [];
  for (const [dominio, a] of porDominio) {
    if (proprios.includes(dominio)) continue; // o nosso próprio domínio não é um remetente a libertar
    const base = {
      dominio,
      classe: classificarDominio(dominio),
      mensagens: a.mensagens,
      remetentes: a.remetentes.size,
      dmarcFail: a.dmarcFail,
      dmarcPass: a.dmarcPass,
      dmarcOutro: a.dmarcOutro,
      antiSpam: a.antiSpam,
      antiVirus: a.antiVirus,
      primeira: a.primeira,
      ultima: a.ultima,
      parecidoCom: pareceComPropriedade(dominio, proprios),
      assuntos: a.assuntos,
    };
    const recomendacao = recomendar(base);
    dominios.push({ ...base, recomendacao, motivo: motivoDe(base, recomendacao) });
  }
  dominios.sort((x, y) => y.mensagens - x.mensagens || x.dominio.localeCompare(y.dominio));

  resumo.dominiosOrigem = dominios.length;
  resumo.remetentes = remetentesTodos.size;
  return { resumo, dominios, proprios };
}

export const contarPor = (dominios: DominioSoc[], rec: Recomendacao) => dominios.filter((d) => d.recomendacao === rec).length;

/** Um domínio por linha, pronto a colar na whitelist do ESA. */
export function listaParaEsa(dominios: DominioSoc[]): string {
  return dominios.map((d) => d.dominio).sort().join('\n');
}

/** Saudação conforme a hora. */
export const saudacao = (d: Date = new Date()) => (d.getHours() < 12 ? 'Bom dia' : d.getHours() < 19 ? 'Boa tarde' : 'Boa noite');

/** O e-mail para o responsável pela segurança, com os domínios escolhidos e o motivo de cada um. */
export function textoEmail(dominios: DominioSoc[], opcoes: { destinatario?: string; ficheiro?: string; quando?: Date } = {}): string {
  const quando = opcoes.quando ?? new Date();
  const linhas: string[] = [];
  linhas.push(`${saudacao(quando)}, ${opcoes.destinatario ?? 'Victor'}`, '');
  linhas.push(
    'Os domínios abaixo são de entidades de Cabo Verde e Portugal que estão a ser colocados em quarentena',
    'no Cisco ESA e que podem estar a afetar a comunicação com parceiros e clientes.',
    'Pedimos a análise e, se confirmar, a sua libertação (whitelist):',
    '',
  );
  for (const d of dominios) {
    linhas.push(`  • ${d.dominio} — ${d.mensagens} mensagem(ns), ${d.remetentes} remetente(s)`);
    linhas.push(`      ${d.motivo}`);
  }
  linhas.push('', `Total: ${dominios.length} domínio(s), ${dominios.reduce((s, d) => s + d.mensagens, 0)} mensagem(ns).`);
  if (opcoes.ficheiro) linhas.push(`Relatório analisado: ${opcoes.ficheiro}`);
  linhas.push('', 'Obrigado.');
  return linhas.join('\n');
}

const csv = (v: unknown) => {
  const s = String(v ?? '');
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV (separador ;, para abrir no Excel em português) com todos os domínios. */
export function paraCsv(dominios: DominioSoc[]): string {
  const cab = ['Domínio', 'Classe', 'Mensagens', 'Remetentes', 'DMARC fail', 'DMARC pass', 'Anti-Spam', 'Anti-Vírus', 'Recomendação', 'Motivo'];
  const linhas = dominios.map((d) =>
    [d.dominio, NOME_CLASSE[d.classe], d.mensagens, d.remetentes, d.dmarcFail, d.dmarcPass, d.antiSpam, d.antiVirus, NOME_RECOMENDACAO[d.recomendacao], d.motivo].map(csv).join(';'),
  );
  return '﻿' + [cab.join(';'), ...linhas].join('\r\n');
}
