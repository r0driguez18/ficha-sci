import { describe, expect, it } from 'vitest';
import { computeFichaHash, shortHash } from '../signatureHash';

const base = {
  date: '2026-10-16',
  formType: 'dia-util',
  turnData: { turno1: { operator: 'elvisb', entrada: '07:00' } },
  tasks: { turno1: { datacenter: true } },
  tableRows: [{ id: 1, hora: '09:12', tarefa: 'Salários' }],
};

describe('computeFichaHash (selo da ficha assinada)', () => {
  it('é determinístico e tem 64 hex (SHA-256)', async () => {
    const a = await computeFichaHash(base);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await computeFichaHash(structuredClone(base))).toBe(a);
  });

  it('não depende da ordem das chaves', async () => {
    const trocada = {
      ...base,
      turnData: { turno1: { entrada: '07:00', operator: 'elvisb' } },
    };
    expect(await computeFichaHash(trocada)).toBe(await computeFichaHash(base));
  });

  it('muda com qualquer alteração ao conteúdo', async () => {
    const h = await computeFichaHash(base);
    expect(await computeFichaHash({ ...base, date: '2026-10-17' })).not.toBe(h);
    expect(await computeFichaHash({ ...base, formType: 'dia-nao-util' })).not.toBe(h);
    expect(await computeFichaHash({ ...base, tasks: { turno1: { datacenter: false } } })).not.toBe(h);
    expect(await computeFichaHash({ ...base, tableRows: [{ id: 1, hora: '09:13', tarefa: 'Salários' }] })).not.toBe(h);
  });

  it('a folha de tapes só entra no hash quando existe (fichas antigas mantêm o selo)', async () => {
    const h = await computeFichaHash(base);
    expect(await computeFichaHash({ ...base, verificacaoTapes: null })).toBe(h);
    expect(await computeFichaHash({ ...base, verificacaoTapes: undefined })).toBe(h);
    expect(await computeFichaHash({ ...base, verificacaoTapes: { a: 1 } })).not.toBe(h);
  });

  it('a ordem das linhas da tabela conta (é um array)', async () => {
    const r1 = { id: 1, hora: '09:00' };
    const r2 = { id: 2, hora: '10:00' };
    expect(await computeFichaHash({ ...base, tableRows: [r1, r2] })).not.toBe(
      await computeFichaHash({ ...base, tableRows: [r2, r1] }),
    );
  });
});

describe('shortHash', () => {
  it('mostra os primeiros 12 caracteres', () => expect(shortHash('abcdef0123456789')).toBe('abcdef012345'));
  it('aceita vazio', () => {
    expect(shortHash(undefined)).toBe('');
    expect(shortHash(null)).toBe('');
  });
});
