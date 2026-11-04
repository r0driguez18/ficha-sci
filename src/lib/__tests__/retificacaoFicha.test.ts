import { describe, expect, it } from 'vitest';
import { computeFichaHash } from '../signatureHash';
import { assinaturaRetificada, diffFicha, retificacaoDe, rotuloChave, type ConteudoFicha } from '../retificacaoFicha';

const base = (): ConteudoFicha => ({
  date: '2026-10-02',
  turn_data: {
    turno1: { operator: 'nalves', entrada: '07:00', saida: '15:00', observations: '' },
    verificacaoTapes: { verificadoPor: '', bmmes: false },
  },
  tasks: { turno1: { datacenter: true, percurso76857_7h30: false, interromperRealTimeHora: '' } },
  table_rows: [{ id: 1, hora: '08:00', tarefa: 'ETR', nomeAs: 'X', operacao: '123456789', executado: 'ok', tipo: '' }],
});

describe('diffFicha', () => {
  it('sem alterações não há diferenças', () => {
    expect(diffFicha(base(), base())).toEqual([]);
  });

  it('data, turno, tarefa, tapes e tabela', () => {
    const d = base();
    d.date = '2026-10-01';
    (d.turn_data.turno1 as any).saida = '16:00';
    (d.turn_data.verificacaoTapes as any).verificadoPor = 'Elvis';
    (d.tasks.turno1 as any).percurso76857_7h30 = true;
    d.table_rows[0].operacao = '987654321';
    d.table_rows.push({ id: 2, hora: '09:00', tarefa: 'Nova', nomeAs: '', operacao: '', executado: '', tipo: '' });
    const campos = diffFicha(base(), d).map((x) => `${x.campo}: ${x.de} -> ${x.para}`);
    expect(campos).toContain('Data da ficha: 2026-10-02 -> 2026-10-01');
    expect(campos).toContain('Turno 1 · saída: 15:00 -> 16:00');
    expect(campos).toContain('Tapes · verificado por: — -> Elvis');
    expect(campos).toContain('Turno 1 · percurso 76857 7h30: não -> sim');
    expect(campos).toContain('Tabela · linha 1 · operação: 123456789 -> 987654321');
    expect(campos.some((c) => c.startsWith('Tabela · linha 2: não existia'))).toBe(true);
  });

  it('linha apagada', () => {
    const d = base();
    d.table_rows = [];
    expect(diffFicha(base(), d)[0]).toMatchObject({ campo: 'Tabela · linha 1', para: 'apagada' });
  });
});

describe('assinatura retificada', () => {
  it('mantém o signatário original e troca o selo', async () => {
    const original = { signerName: 'Nelson', signedAt: 'x', imageDataUrl: null, method: 'pin' as const, contentHash: 'velho' };
    const novo = await computeFichaHash({ date: 'd', formType: 'dia-util', turnData: {}, tasks: {}, tableRows: [] });
    const s = assinaturaRetificada(original, novo, { versao: 2, por: 'ebrito', porUserId: 'u', em: 'e', motivo: 'm' });
    expect(s.signerName).toBe('Nelson');
    expect(s.contentHash).toBe(novo);
    expect(retificacaoDe(s)?.versao).toBe(2);
    expect(retificacaoDe(original)).toBeNull();
  });
  it('rotuloChave', () => {
    expect(rotuloChave('abrirServidores')).toBe('abrir servidores');
    expect(rotuloChave('percurso76857_7h30')).toBe('percurso 76857 7h30');
  });
});
