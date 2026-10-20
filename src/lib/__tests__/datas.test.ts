import { describe, expect, it } from 'vitest';
import { calcularPascoa, ehFeriadoCaboVerde } from '../feriadosCaboVerde';
import { businessDaysBetween, isBusinessDay, nextBusinessDay, returnStatus, toIsoDate } from '../cobrancasSla';
import { fichaDoDia } from '../fichaDoDia';

const d = (iso: string) => {
  const [y, m, dia] = iso.split('-').map(Number);
  return new Date(y, m - 1, dia);
};

describe('Páscoa e feriados de Cabo Verde', () => {
  it('calcula a Páscoa', () => {
    expect(toIsoDate(calcularPascoa(2024))).toBe('2024-03-31');
    expect(toIsoDate(calcularPascoa(2025))).toBe('2025-04-20');
    expect(toIsoDate(calcularPascoa(2026))).toBe('2026-04-05');
  });

  it('feriados fixos, móveis e municipais da Praia', () => {
    for (const f of ['2026-01-01', '2026-07-05', '2026-12-25', '2026-04-29', '2026-05-19']) {
      expect(ehFeriadoCaboVerde(d(f)), f).toBe(true);
    }
    // 2026: Cinzas 18/02, Sexta-feira Santa 03/04, Páscoa 05/04
    for (const f of ['2026-02-18', '2026-04-03', '2026-04-05']) expect(ehFeriadoCaboVerde(d(f)), f).toBe(true);
    for (const f of ['2026-10-16', '2026-03-10', '2026-04-04']) expect(ehFeriadoCaboVerde(d(f)), f).toBe(false);
  });
});

describe('dias úteis', () => {
  it('fim de semana e feriado não são úteis', () => {
    expect(isBusinessDay(d('2026-10-16'))).toBe(true); // sexta
    expect(isBusinessDay(d('2026-10-17'))).toBe(false); // sábado
    expect(isBusinessDay(d('2026-10-18'))).toBe(false); // domingo
    expect(isBusinessDay(d('2026-04-03'))).toBe(false); // sexta-feira santa
    expect(isBusinessDay(d('2026-12-25'))).toBe(false); // Natal (sexta)
  });

  it('o próximo dia útil salta o fim de semana e os feriados', () => {
    expect(toIsoDate(nextBusinessDay(d('2026-10-16')))).toBe('2026-10-19');
    expect(toIsoDate(nextBusinessDay(d('2026-04-02')))).toBe('2026-04-06'); // quinta → salta sexta santa, sáb, dom
  });

  it('conta dias úteis entre datas, com sinal', () => {
    expect(businessDaysBetween(d('2026-10-16'), d('2026-10-19'))).toBe(1);
    expect(businessDaysBetween(d('2026-10-19'), d('2026-10-16'))).toBe(-1);
    expect(businessDaysBetween(d('2026-10-16'), d('2026-10-16'))).toBe(0);
  });
});

describe('estado dos retornos de cobrança (SLA)', () => {
  const hoje = d('2026-10-20'); // terça
  const esperado = (iso: string, enviado = false) =>
    returnStatus({ retorno_enviado: enviado, data_retorno_esperada: iso }, hoje);

  it('enviado ganha sempre', () => {
    expect(esperado('2026-10-01', true).severity).toBe('enviado');
  });

  it('pendente, vence hoje, atrasado e urgente', () => {
    expect(esperado('2026-10-22').severity).toBe('pendente');
    expect(esperado('2026-10-21').label).toBe('Falta 1 dia útil');
    expect(esperado('2026-10-20').severity).toBe('due');
    expect(esperado('2026-10-19').severity).toBe('atrasado');
    expect(esperado('2026-10-16').severity).toBe('atrasado');
    expect(esperado('2026-10-15').severity).toBe('urgente');
    expect(esperado('2026-10-15').label).toMatch(/^URGENTE/);
  });
});

describe('qual ficha abre em cada dia', () => {
  it('fim de semana → dia não útil; resto → dia útil', () => {
    expect(fichaDoDia(d('2026-10-16')).formType).toBe('dia-util');
    expect(fichaDoDia(d('2026-10-17')).formType).toBe('dia-nao-util');
    expect(fichaDoDia(d('2026-10-18')).formType).toBe('dia-nao-util');
    expect(fichaDoDia(d('2026-10-19')).formType).toBe('dia-util');
  });
});
