import type React from 'react';

/**
 * Para campos onde se cola/escreve texto separado por tabs (folhas do Excel): a tecla Tab
 * escreve um separador em vez de saltar para o elemento seguinte. Para sair do campo com o
 * teclado: Esc e depois Tab (mantém a página acessível).
 */
export function tabNoCampo(e: React.KeyboardEvent<HTMLTextAreaElement>) {
  const el = e.currentTarget;

  if (e.key === 'Escape') {
    el.dataset.saiComTab = '1';
    return;
  }
  if (e.key !== 'Tab') {
    delete el.dataset.saiComTab;
    return;
  }
  if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;

  if (el.dataset.saiComTab === '1') {
    delete el.dataset.saiComTab;
    return; // deixa o Tab fazer o seu trabalho: sai do campo
  }

  e.preventDefault();
  el.setRangeText('\t', el.selectionStart, el.selectionEnd, 'end');
  // Avisa o React (onChange) de que o conteúdo mudou.
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

export const DICA_TAB = 'Tab escreve um separador no campo; para sair com o teclado: Esc e depois Tab.';
