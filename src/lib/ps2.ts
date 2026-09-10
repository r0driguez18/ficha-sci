/**
 * Gerador de ficheiros PS2 (F17).
 *
 * Porte fiel da macro VBA "GerarFicheiroPS2" do Excel — mesma estrutura de
 * linhas, mesmas validações, mesmo formato de 80 caracteres. Nada da lógica
 * foi alterado; só foi adaptado de VBA para TypeScript e a gravação em
 * `U:\...\Trabalho\` passou a ser um download do browser.
 *
 * Estrutura:
 *   PS21  cabeçalho  — "PS2"+"1"+tipo(2)+"00"+"0"+NIBempresa+"CVE"+data(AAAAMMDD)+ref(20)  -> 80, completa com "0"
 *   PS22  registo    — "PS2"+"2"+tipo(2)+"00"+"0"+NIB(21)+valor(13)+descritivo(35)+"00"     -> 80, completa com " "
 *   PS29  rodapé     — "PS2"+"9"+tipo(2)+"00"+"0"+"000000"+nRegistos(14)+total(11)          -> 80, completa com "0"
 */

export interface PS2Linha {
  /** NIB do beneficiário (já montado, ex.: "00030000" + conta + "10176"). */
  nib: string;
  /** Montante. Só a parte inteira entra no ficheiro (como no VBA: Fix). */
  valor: number | string;
  /** Descritivo (já com o prefixo, ex.: "Ordenado <nome>"). */
  descritivo: string;
}

export interface PS2Input {
  /** Tipo de operação — um dos rótulos de TIPOS_OPERACAO. */
  tipo: string;
  /** NIB da empresa ordenante (montado como na folha). */
  nibEmpresa: string;
  /** Data de processamento (Date ou "AAAA-MM-DD"). */
  data: Date | string;
  /** Referência do ordenante (máx. 35; usada truncada/preenchida a 20). */
  referenciaOrdenante: string;
  linhas: PS2Linha[];
}

export interface PS2Resultado {
  conteudo: string;
  totalRegistos: number;
  somaTotal: number;
  linhasIgnoradas: number;
  erros: string[];
}

/** Rótulos exatamente como na folha (coluna T). O código faz LCase para mapear. */
export const TIPOS_OPERACAO = [
  'Ordenado',
  'Fornecedores',
  'Transferencia',
  'Quotas',
  'BCA',
  'Diversos (Crédito Empresa)',
  'Diversos (Débito Empresa)',
] as const;

/** ObterCodigoTipo — mesmo Select Case do VBA. "" = inválido. */
export function obterCodigoTipo(tipo: string): string {
  switch ((tipo || '').toLowerCase()) {
    case 'ordenado':
      return '08';
    case 'fornecedores':
      return '09';
    case 'transferencia':
      return '12';
    case 'quotas':
      return '61';
    case 'bca':
      return '05';
    case 'diversos (crédito empresa)':
      return '06';
    case 'diversos (débito empresa)':
      return '03';
    default:
      return '';
  }
}

/** AjustarNIBEstrutura — porte fiel (prefixo 4 + filler + conta≥8 + natureza 5, total 21). */
export function ajustarNibEstrutura(nibRaw: string): string {
  const nib = (nibRaw || '').replace(/ /g, '');
  const prefixo = nib.slice(0, 4);
  const natureza = nib.slice(-5);
  // VBA: Mid(nib, 9, Len(nib) - 13)  → índice 9 (base 1) = 8 (base 0)
  let conta = nib.slice(8, 8 + Math.max(0, nib.length - 13));
  if (conta.length < 8) conta = ('00000000' + conta).slice(-8);
  const filler = '0'.repeat(Math.max(0, 12 - conta.length));
  let out = prefixo + filler + conta + natureza;
  if (out.length < 21) out += '0'.repeat(21 - out.length);
  return out;
}

/** Monta o NIB da empresa/beneficiário como a folha: "00030000" + conta + "10176". */
export function montarNib(contaCurta: string): string {
  return '00030000' + (contaCurta || '').replace(/\s/g, '') + '10176';
}

const zeros = (n: number) => '0'.repeat(Math.max(0, n));
const espacos = (n: number) => ' '.repeat(Math.max(0, n));
const fix = (v: number) => Math.trunc(v);
const padZeros = (s: string, n: number) => (s.length >= n ? s : zeros(n - s.length) + s);

function formatarData(d: Date | string): string | null {
  const date = d instanceof Date ? d : new Date(`${d}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export function gerarPS2(input: PS2Input): PS2Resultado {
  const erros: string[] = [];
  const tipoOperacao = obterCodigoTipo(input.tipo);
  if (tipoOperacao === '') {
    erros.push(
      'Tipo de operação inválido. Usa: Ordenado, Fornecedores, Transferência, Quotas, BCA, Diversos (Crédito/Débito Empresa).',
    );
  }

  const contaEmpresa = (input.nibEmpresa || '').replace(/\s/g, '');
  if (contaEmpresa.length === 0) erros.push('NIB da empresa em falta.');
  else if (contaEmpresa.slice(0, 4) !== '0003') erros.push('O NIB da empresa não pertence ao BCA.');
  else if (contaEmpresa.length > 21) erros.push('O NIB da empresa não pode ter mais de 21 dígitos.');

  const dataProcessamento = formatarData(input.data);
  if (!dataProcessamento) erros.push('A data de processamento não é válida.');

  const referenciaOrdenante = (input.referenciaOrdenante || '').trim();
  if (referenciaOrdenante.length === 0) erros.push('A referência do ordenante é obrigatória.');
  else if (referenciaOrdenante.length > 35)
    erros.push('A referência do ordenante não pode ter mais de 35 caracteres.');

  // Validação e recolha das linhas (o VBA aborta ao primeiro erro; aqui
  // juntam-se todos, mas o ficheiro só é gerado se não houver nenhum).
  let somaTotal = 0;
  let totalRegistos = 0;
  let linhasIgnoradas = 0;
  const registos: { nib: string; valorFormatado: string; descricao: string }[] = [];

  input.linhas.forEach((l, i) => {
    const numLinha = i + 1;
    const nibRaw = String(l.nib ?? '').replace(/\s/g, '');
    const valorTxt = String(l.valor ?? '').trim();
    if (nibRaw.length === 0 || valorTxt === '') {
      linhasIgnoradas += 1;
      return;
    }
    if (nibRaw.slice(0, 4) !== '0003') {
      erros.push(`Erro na linha ${numLinha}: o NIB não pertence ao BCA.`);
      return;
    }
    if (nibRaw.length > 21) {
      erros.push(`Erro na linha ${numLinha}: o NIB não pode ter mais de 21 dígitos.`);
      return;
    }
    const descritivo = String(l.descritivo ?? '').trim();
    if (descritivo.length === 0) {
      erros.push(
        `Erro na linha ${numLinha}: o campo DESCRITIVO é obrigatório quando há NIB e valor.`,
      );
      return;
    }
    const valor = Number(valorTxt.replace(',', '.'));
    if (Number.isNaN(valor)) {
      erros.push(`Erro na linha ${numLinha}: o montante não é um número.`);
      return;
    }
    somaTotal += valor;
    totalRegistos += 1;
    registos.push({
      nib: ajustarNibEstrutura(nibRaw),
      valorFormatado: padZeros(String(fix(valor)), 11) + '00',
      descricao: (descritivo + espacos(35)).slice(0, 35),
    });
  });

  if (erros.length > 0) {
    return { conteudo: '', totalRegistos, somaTotal, linhasIgnoradas, erros };
  }

  const moeda = 'CVE';
  let cabecalho =
    'PS2' +
    '1' +
    tipoOperacao +
    '00' +
    '0' +
    ajustarNibEstrutura(contaEmpresa) +
    moeda +
    dataProcessamento +
    (referenciaOrdenante + espacos(20)).slice(0, 20);
  cabecalho =
    cabecalho.length < 80
      ? cabecalho + zeros(80 - cabecalho.length)
      : cabecalho.slice(0, 80);

  const linhas: string[] = [cabecalho];
  for (const r of registos) {
    let linhaPS22 = 'PS2' + '2' + tipoOperacao + '00' + '0' + r.nib + r.valorFormatado + r.descricao + '00';
    if (linhaPS22.length < 80) linhaPS22 += espacos(80 - linhaPS22.length);
    linhas.push(linhaPS22);
  }

  let rodape =
    'PS2' +
    '9' +
    tipoOperacao +
    '00' +
    '0' +
    '000000' +
    padZeros(String(totalRegistos), 14) +
    padZeros(String(fix(somaTotal)), 11);
  rodape += zeros(80 - rodape.length);
  linhas.push(rodape);

  return {
    // O VBA usa vbCrLf entre linhas e Print #1 acrescenta um CRLF final.
    conteudo: linhas.join('\r\n') + '\r\n',
    totalRegistos,
    somaTotal,
    linhasIgnoradas,
    erros: [],
  };
}

/** Nome sugerido pelo VBA: PS2_AAAAMMDD.txt (data de hoje). */
export function nomeFicheiroPS2(d: Date = new Date()): string {
  return `PS2_${formatarData(d)}.txt`;
}
