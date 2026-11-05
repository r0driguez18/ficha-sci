import { describe, expect, it } from 'vitest';
import { CAMPO_HORA, decidirHora, horaAgora, horaValida } from '../horasAutomaticas';

const t3 = (extra: Record<string, unknown> = {}) => ({ inicioFechoHora: '', terminoFechoHora: '', abrirRealTimeHora: '', interromperRealTimeHora: '', ...extra });

describe('horas automáticas do Turno 3', () => {
  it('os quatro procedimentos com hora', () => {
    expect(Object.keys(CAMPO_HORA).sort()).toEqual(['abrirRealTime', 'inicioFecho', 'interromperRealTime', 'terminoFecho']);
  });

  it('formato da hora', () => {
    expect(horaAgora(new Date(2026, 10, 5, 7, 4))).toBe('07:04');
    expect(horaAgora(new Date(2026, 10, 5, 23, 59))).toBe('23:59');
    expect(horaValida('22:40')).toBe(true);
    expect(horaValida('24:00')).toBe(false);
    expect(horaValida('')).toBe(false);
    expect(horaValida(undefined)).toBe(false);
  });

  it('marcar com o campo vazio: entra a hora de agora', () => {
    expect(decidirHora('inicioFecho', true, t3(), '22:40')).toEqual({ campo: 'inicioFechoHora', valor: '22:40' });
    expect(decidirHora('abrirRealTime', true, t3(), '04:02')).toEqual({ campo: 'abrirRealTimeHora', valor: '04:02' });
    expect(decidirHora('interromperRealTime', true, t3(), '23:10')?.campo).toBe('interromperRealTimeHora');
    expect(decidirHora('terminoFecho', true, t3(), '05:15')?.campo).toBe('terminoFechoHora');
  });

  it('marcar com uma hora já escrita (à mão ou de antes): fica como está', () => {
    expect(decidirHora('inicioFecho', true, t3({ inicioFechoHora: '22:15' }), '22:40')).toBeNull();
  });

  it('uma hora inválida conta como vazia', () => {
    expect(decidirHora('inicioFecho', true, t3({ inicioFechoHora: '99:99' }), '22:40')).toEqual({ campo: 'inicioFechoHora', valor: '22:40' });
  });

  it('desmarcar apaga a hora, seja a automática ou a escrita à mão', () => {
    expect(decidirHora('inicioFecho', false, t3({ inicioFechoHora: '22:40' }), '23:00')).toEqual({ campo: 'inicioFechoHora', valor: '' });
    expect(decidirHora('abrirRealTime', false, t3({ abrirRealTimeHora: '04:02' }), '23:00')).toEqual({ campo: 'abrirRealTimeHora', valor: '' });
  });

  it('desmarcar com o campo já vazio: nada a fazer', () => {
    expect(decidirHora('inicioFecho', false, t3(), '23:00')).toBeNull();
  });

  it('outros procedimentos não levam hora', () => {
    expect(decidirHora('datacenter', true, t3(), '22:40')).toBeNull();
    expect(decidirHora('datacenter', false, t3(), '22:40')).toBeNull();
  });
});
