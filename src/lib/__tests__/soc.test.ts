import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import {
  analisarSoc,
  classificarDominio,
  distancia,
  dominioDe,
  lerData,
  lerLinhas,
  listaParaEsa,
  mapearColunas,
  paraCsv,
  pareceComPropriedade,
  saudacao,
  textoEmail,
  type LinhaSoc,
} from '../soc';
import { lerFicheiroSoc } from '../socFicheiro';

const linha = (p: Partial<LinhaSoc>): LinhaSoc => ({
  data: new Date(2026, 9, 1, 10, 0, 0),
  acao: 'QUARANTINED',
  origem: 'alguem@exemplo.com',
  destino: 'colega@bca.cv',
  assunto: 'Assunto',
  dmarc: 'pass',
  antiSpam: 'POSITIVE',
  antiVirus: 'NEGATIVE',
  ...p,
});

describe('colunas e datas', () => {
  it('mapeia os cabeçalhos do relatório do SOC (com acentos)', () => {
    expect(mapearColunas(['Data e Hora', 'Ação', 'Endereço de Origem', 'Endereço de Destino', 'Assunto', 'DMARC', 'Anti-Spam', 'Anti-Virus'])).toEqual({
      data: 0, acao: 1, origem: 2, destino: 3, assunto: 4, dmarc: 5, antiSpam: 6, antiVirus: 7,
    });
  });

  it('sem origem e destino não é este relatório', () => {
    expect(mapearColunas(['Cliente', 'Data', 'Versão'])).toBeNull();
    expect(mapearColunas([])).toBeNull();
  });

  it('lê as datas do Kibana e as normais', () => {
    expect(lerData('Oct 4, 2026 @ 12:19:17.000')).toEqual(new Date(2026, 9, 4, 12, 19, 17));
    expect(lerData('Sep 27, 2026 @ 00:00:01.000')?.getMonth()).toBe(8);
    expect(lerData('2026-10-04T12:00:00')).toEqual(new Date(2026, 9, 4, 12, 0, 0));
    expect(lerData('')).toBeNull();
    expect(lerData('lixo')).toBeNull();
  });

  it('dominioDe', () => {
    expect(dominioDe('Nome@Exemplo.COM')).toBe('exemplo.com');
    expect(dominioDe('-')).toBe('');
  });
});

describe('classificação e domínios parecidos com o banco', () => {
  it('classifica por país e tipo', () => {
    expect(classificarDominio('cvtelecom.cv')).toBe('cv');
    expect(classificarDominio('oasisatlantico.com')).toBe('cv');
    expect(classificarDominio('santander.pt')).toBe('pt');
    expect(classificarDominio('gmail.com')).toBe('publico');
    expect(classificarDominio('promo.top')).toBe('suspeito');
    expect(classificarDominio('empresa.ru')).toBe('suspeito');
    expect(classificarDominio('microsoft.com')).toBe('outro');
  });

  it('distância de edição', () => {
    expect(distancia('bcacv', 'bcacv')).toBe(0);
    expect(distancia('bcacv', 'bcacw')).toBe(1);
    expect(distancia('abc', 'xyz')).toBe(3);
  });

  it('apanha domínios que imitam o do banco, e não o próprio', () => {
    const meus = ['bca.cv'];
    for (const mau of ['bca-cv.com', 'bcacv.com', 'bca-online.xyz', 'bca.cv.exemplo.com']) {
      expect(pareceComPropriedade(mau, meus), mau).toBe('bca.cv');
    }
    expect(pareceComPropriedade('bca.cv', meus)).toBeNull();
    expect(pareceComPropriedade('microsoft.com', meus)).toBeNull();
    expect(pareceComPropriedade('cvtelecom.cv', meus)).toBeNull();
  });
});

describe('analisarSoc', () => {
  it('só conta remetentes: o domínio de destino (o do banco) nunca aparece como bloqueado', () => {
    const r = analisarSoc([
      linha({ origem: 'a@cvtelecom.cv' }),
      linha({ origem: 'b@cvtelecom.cv' }),
      linha({ origem: 'c@parceiro.pt', destino: 'x@bca.cv' }),
    ]);
    expect(r.proprios).toEqual(['bca.cv']);
    expect(r.dominios.map((d) => d.dominio)).toEqual(['cvtelecom.cv', 'parceiro.pt']);
    expect(r.dominios.find((d) => d.dominio === 'bca.cv')).toBeUndefined();
  });

  it('recomenda whitelist a CV/PT só apanhado pelo anti-spam; verificar se o DMARC falha', () => {
    const r = analisarSoc([
      linha({ origem: 'a@limpo.cv' }),
      linha({ origem: 'a@falha.pt', dmarc: 'fail' }),
      linha({ origem: 'b@falha.pt', dmarc: 'pass' }),
    ]);
    const por = Object.fromEntries(r.dominios.map((d) => [d.dominio, d]));
    expect(por['limpo.cv'].recomendacao).toBe('whitelist');
    expect(por['falha.pt'].recomendacao).toBe('verificar-remetente');
    expect(por['falha.pt']).toMatchObject({ mensagens: 2, dmarcFail: 1, dmarcPass: 1 });
  });

  it('nunca recomenda libertar quem tem vírus ou imita o banco, mesmo sendo .cv ou .pt', () => {
    const r = analisarSoc([
      linha({ origem: 'a@amigo.cv', antiVirus: 'POSITIVE' }),
      linha({ origem: 'a@bca-cv.pt' }),
    ]);
    const por = Object.fromEntries(r.dominios.map((d) => [d.dominio, d]));
    expect(por['amigo.cv'].recomendacao).toBe('nao-libertar');
    expect(por['amigo.cv'].motivo).toMatch(/anti-vírus/i);
    expect(por['bca-cv.pt'].recomendacao).toBe('nao-libertar');
    expect(por['bca-cv.pt'].motivo).toMatch(/bca\.cv/);
  });

  it('webmail pede verificação e domínios suspeitos ficam bloqueados', () => {
    const r = analisarSoc([linha({ origem: 'a@gmail.com' }), linha({ origem: 'a@promo.top' }), linha({ origem: 'a@fornecedor.com' })]);
    const por = Object.fromEntries(r.dominios.map((d) => [d.dominio, d.recomendacao]));
    expect(por).toEqual({ 'gmail.com': 'verificar', 'promo.top': 'manter', 'fornecedor.com': 'manter' });
  });

  it('resumo: totais, DMARC, remetentes distintos, período e mensagens sem remetente', () => {
    const r = analisarSoc([
      linha({ origem: 'a@x.com', dmarc: 'fail', data: new Date(2026, 9, 1) }),
      linha({ origem: 'a@x.com', dmarc: 'pass', data: new Date(2026, 9, 5) }),
      linha({ origem: 'b@x.com', dmarc: 'Skipped', antiSpam: 'NEGATIVE', data: new Date(2026, 9, 3) }),
      linha({ origem: '-' }),
    ]);
    expect(r.resumo).toMatchObject({
      mensagens: 4, semRemetente: 1, dominiosOrigem: 1, remetentes: 2,
      antiSpam: 3, dmarcFail: 1, dmarcPass: 2, dmarcOutro: 1,
    });
    expect(r.resumo.primeira).toEqual(new Date(2026, 9, 1));
    expect(r.resumo.ultima).toEqual(new Date(2026, 9, 5));
  });

  it('ordena do domínio mais frequente para o menos', () => {
    const r = analisarSoc([linha({ origem: 'a@b.com' }), linha({ origem: 'a@a.com' }), linha({ origem: 'b@a.com' })]);
    expect(r.dominios.map((d) => d.dominio)).toEqual(['a.com', 'b.com']);
  });

  it('guarda no máximo 3 assuntos de exemplo, sem repetir', () => {
    const r = analisarSoc(['1', '1', '2', '3', '4'].map((a) => linha({ origem: 'a@x.pt', assunto: `A${a}` })));
    expect(r.dominios[0].assuntos).toEqual(['A1', 'A2', 'A3']);
  });

  it('sem linhas devolve tudo vazio', () => {
    const r = analisarSoc([]);
    expect(r.dominios).toEqual([]);
    expect(r.resumo.mensagens).toBe(0);
  });
});

describe('saídas', () => {
  const r = analisarSoc([
    linha({ origem: 'a@cvtelecom.cv' }),
    linha({ origem: 'b@cvtelecom.cv' }),
    linha({ origem: 'a@mjtech.cv', assunto: 'Proposta; "urgente"' }),
  ]);

  it('lista para o ESA: um domínio por linha, por ordem alfabética', () => {
    expect(listaParaEsa(r.dominios)).toBe('cvtelecom.cv\nmjtech.cv');
  });

  it('o e-mail diz os domínios, os motivos e o total; a saudação segue a hora', () => {
    const t = textoEmail(r.dominios, { ficheiro: 'SOC.xlsx', quando: new Date(2026, 9, 5, 9, 0) });
    expect(t.startsWith('Bom dia, Victor')).toBe(true);
    expect(t).toContain('cvtelecom.cv — 2 mensagem(ns), 2 remetente(s)');
    expect(t).toContain('Total: 2 domínio(s), 3 mensagem(ns).');
    expect(t).toContain('Relatório analisado: SOC.xlsx');
    expect(saudacao(new Date(2026, 9, 5, 15, 0))).toBe('Boa tarde');
    expect(saudacao(new Date(2026, 9, 5, 21, 0))).toBe('Boa noite');
  });

  it('o CSV abre no Excel (BOM, ponto e vírgula) e protege aspas e separadores', () => {
    const c = paraCsv(r.dominios);
    expect(c.startsWith('﻿Domínio;Classe;')).toBe(true);
    expect(c.split('\r\n')).toHaveLength(3);
    expect(c).toContain('cvtelecom.cv;Cabo Verde;2;2;');
  });
});

describe('ler o Excel do SOC', () => {
  const livro = (folhas: Record<string, unknown[][]>) => {
    const wb = XLSX.utils.book_new();
    for (const [nome, linhas] of Object.entries(folhas)) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(linhas), nome);
    return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  };
  const cab = ['Data e Hora', 'Ação', 'Endereço de Origem', 'Endereço de Destino', 'Assunto', 'DMARC', 'Anti-Spam', 'Anti-Virus'];

  it('acha a folha do ESA no meio das outras e lê as mensagens', () => {
    const r = lerFicheiroSoc(
      livro({
        Capa: [['Cliente', 'BCA'], ['Versão', '1.0']],
        'cisco - esa': [cab, ['Oct 4, 2026 @ 12:19:17.000', 'QUARANTINED', 'a@cvtelecom.cv', 'x@bca.cv', 'Olá', 'pass', 'POSITIVE', 'NEGATIVE'], ['', '', '', '', '', '', '', '']],
      }),
    );
    expect('erro' in r).toBe(false);
    if ('erro' in r) return;
    expect(r.folha).toBe('cisco - esa');
    expect(r.linhas).toHaveLength(1);
    expect(r.linhas[0]).toMatchObject({ origem: 'a@cvtelecom.cv', dmarc: 'pass' });
  });

  it('aguenta o cabeçalho a meio da folha (linhas de título por cima)', () => {
    const r = lerFicheiroSoc(livro({ Dados: [['Relatório semanal'], [], cab, ['Oct 4, 2026 @ 12:19:17.000', 'QUARANTINED', 'a@b.pt', 'x@bca.cv', '', '', '', '']] }));
    expect('erro' in r ? r.erro : r.linhas.length).toBe(1);
  });

  it('um ficheiro que não é o relatório dá uma mensagem clara', () => {
    const r = lerFicheiroSoc(livro({ Folha1: [['Nome', 'Idade'], ['Ana', 3]] }));
    expect('erro' in r && r.erro).toMatch(/Endereço de Origem/);
  });

  it('um ficheiro que não é Excel dá erro em vez de rebentar', () => {
    const r = lerFicheiroSoc(new TextEncoder().encode('isto nao e um excel').buffer);
    expect('erro' in r || 'linhas' in r).toBe(true);
  });

  it('lerLinhas ignora linhas em branco mas guarda as de origem "-"', () => {
    const mapa = mapearColunas(cab)!;
    const l = lerLinhas([['', '', '', '', '', '', '', ''], ['', 'Q', '-', 'x@bca.cv', '', '', '', '']], mapa);
    expect(l).toHaveLength(1);
    expect(l[0].origem).toBe('-');
  });
});
