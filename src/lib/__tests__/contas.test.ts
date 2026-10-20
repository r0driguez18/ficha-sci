import { describe, expect, it } from 'vitest';
import { SENHA_MIN, precisaTrocarSenha, validarSenha } from '../politicaSenha';
import { emailDeLogin, sugerirUtilizador, validarUtilizador } from '../utilizador';

describe('politicaSenha', () => {
  it('exige o tamanho mínimo e a confirmação igual', () => {
    expect(validarSenha('a'.repeat(SENHA_MIN - 1), 'a'.repeat(SENHA_MIN - 1))).toMatch(/pelo menos/);
    expect(validarSenha('a'.repeat(SENHA_MIN), 'b'.repeat(SENHA_MIN))).toMatch(/não coincidem/);
    expect(validarSenha('a'.repeat(SENHA_MIN), 'a'.repeat(SENHA_MIN))).toBeNull();
  });

  it('a troca obrigatória só vale com true (nunca com texto ou ausente)', () => {
    expect(precisaTrocarSenha({ must_change_password: true })).toBe(true);
    expect(precisaTrocarSenha({ must_change_password: 'true' })).toBe(false);
    expect(precisaTrocarSenha({})).toBe(false);
    expect(precisaTrocarSenha(null)).toBe(false);
    expect(precisaTrocarSenha(undefined)).toBe(false);
  });
});

describe('utilizador de login', () => {
  it('completa com o domínio interno e respeita quem escreve o email', () => {
    expect(emailDeLogin('NAlves')).toBe('nalves@bca.cv');
    expect(emailDeLogin('  elvisb ')).toBe('elvisb@bca.cv');
    expect(emailDeLogin('Fulano@Outro.com')).toBe('fulano@outro.com');
  });

  it('valida o formato do utilizador', () => {
    expect(validarUtilizador('nalves')).toBeNull();
    expect(validarUtilizador('e_tavares2')).toBeNull();
    for (const mau of ['ab', '1abc', 'tem espaço', 'a@b', 'x'.repeat(21), '']) {
      expect(validarUtilizador(mau), mau).not.toBeNull();
    }
  });

  it('sugere inicial do 1.º nome + último apelido, sem acentos', () => {
    expect(sugerirUtilizador('Nelson Alves')).toBe('nalves');
    expect(sugerirUtilizador('Elvis Brito')).toBe('ebrito');
    expect(sugerirUtilizador('João Álvaro da Silva')).toBe('jsilva');
    expect(sugerirUtilizador('Madonna')).toBe('madonna');
    expect(sugerirUtilizador('')).toBe('');
  });
});
