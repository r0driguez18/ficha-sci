import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Home,
  ClipboardCheck,
  Archive,
  Undo2,
  ArrowRightLeft,
  Banknote,
  ShieldCheck,
  BarChart3,
  Settings,
  Search,
  CreditCard,
} from 'lucide-react';

interface Seccao {
  icon: React.ElementType;
  title: string;
  intro: string;
  points: string[];
}

const SECCOES: Seccao[] = [
  {
    icon: Home,
    title: 'Início',
    intro: 'Resumo do turno numa vista.',
    points: [
      'Cartão "Ficha de hoje" — abre já a variante certa (dia útil / dia não útil) para a data de hoje e diz se já foi exportada uma ficha.',
      'Próximo alerta de hora certa, com a contagem decrescente.',
      'Atalhos para os módulos e a lista de retornos a vencer.',
    ],
  },
  {
    icon: ClipboardCheck,
    title: 'Ficha de Procedimentos',
    intro: 'A ficha do turno — tarefas, observações e assinatura.',
    points: [
      'Uma aba por turno (1, 2, 3). O contador na aba e a barra mostram o progresso; "Próxima por marcar" salta para a primeira tarefa por fazer.',
      'Nenhuma tarefa é obrigatória — marca-se o que se fez.',
      'Grava sozinha enquanto se preenche (não há botão de "guardar" à parte) — o cabeçalho mostra "Guardado às HH:MM".',
      'Assinatura eletrónica com o PIN do operador (Configurações → PIN). Fica com o nome, a hora e um selo de integridade no PDF.',
      'Nos dias não úteis e no último dia do mês aparece o "Procedimento Verificação de Tapes". O display (PDF ou TXT) anexa-se depois — a ficha só pode ser descarregada depois de o display estar anexado.',
      '"Exportar e guardar" faz tudo num passo: valida, regista os processamentos da tabela na Estatística, gera o PDF (FD DD.MM.AA.pdf), arquiva a ficha no Histórico e avança a data para o dia seguinte.',
      '"Limpar" apaga o rascunho no ecrã e no servidor — pede confirmação. As fichas já exportadas ficam no Histórico.',
    ],
  },
  {
    icon: Archive,
    title: 'Histórico de Fichas',
    intro: 'As fichas de procedimentos já guardadas, de toda a equipa.',
    points: [
      'Filtros por tipo de ficha, por operador e por estado do display de tapes; pesquisa por data.',
      'Pré-visualizar ou descarregar o PDF (com o display de tapes já incluído no fim, quando existe).',
      'Anexar / substituir o display de tapes nas fichas que ficaram pendentes.',
      'Uma pendência de display com 3 ou mais dias fica marcada "em atraso".',
    ],
  },
  {
    icon: Undo2,
    title: 'Retornos de Cobranças',
    intro: 'Acompanhamento dos retornos dos ficheiros de cobrança, com prazo.',
    points: [
      'O retorno é esperado no dia útil seguinte ao envio.',
      'A partir daí conta-se o atraso em dias úteis; com mais de 2 dias úteis de atraso passa a URGENTE.',
      'Marca-se um ou vários como enviados de uma vez, com observações opcionais.',
      'O prazo esperado de cada retorno pode ser corrigido à mão.',
    ],
  },
  {
    icon: ArrowRightLeft,
    title: 'Passagem de Turno',
    intro: 'O resumo que quem sai deixa para quem entra.',
    points: [
      'Cada nota deixada (ocorrências, pendências a acompanhar, avisos) fica como entrada nova no turno e na data — nada se reescreve.',
      'Cada pessoa confirma a leitura de cada nota — fica registado quem leu e a que horas; o dia mostra quantas notas estão por ler.',
      'As notas não se editam nem se apagam: para corrigir, deixa uma nova. O histórico consulta-se mudando a data.',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'CRC — Inconsistências',
    intro: 'Fecho em massa das inconsistências pendentes no CRC Front Office.',
    points: [
      'Corre através de um serviço local que abre o Chrome. Fluxo: Iniciar (abre o Chrome) → fazer login e escolher o código de inconsistência no CRC → "Já fiz login" arranca a passagem.',
      'No fim o Chrome fica aberto: Repetir (mesmo código ou outro) ou Terminar.',
      'Cada passagem fica registada no histórico com os processados, as falhas e um resumo. Só respostas 200 contam como sucesso.',
      'Se uma página falhar a meio, salta-a e continua; se for a primeira, marca "erro".',
    ],
  },
  {
    icon: Banknote,
    title: 'Geradores PS2 / OIC',
    intro: 'Um separador por gerador: PS2 (folha de salários → ficheiro PS2 para o banco) e OIC (pagamentos interbancários → Interbancario_AAAAMMDD.txt, linhas de 135 caracteres em ANSI, como a macro do Gerador OIC.xlsm; limpa espaços, hífenes e apóstrofos dos NIBs).',
    points: [
      'Separador PS2 — cola a folha do Excel ou carrega o .xlsx; as colunas (NIB, valor, nome) são detetadas e podem ajustar-se.',
      'As contas são convertidas para NIB do BCA. O formato das contas recebidas escolhe-se no seletor: detetar automaticamente, só o nº de conta, ou NIB completo.',
      'Contas até 8 dígitos são sempre tratadas como só o nº de conta (mesmo a acabar em 1): só se acrescenta a natureza 10176. A natureza no fim só é detetada quando há mais de 8 dígitos.',
      'A natureza no fim do NIB é convertida pela tabela (1 → 10176, 2 → 10273, …). Contas de outros bancos ficam de fora do ficheiro.',
      'Linhas que não dão um NIB de 21 dígitos ficam "em alerta" para corrigir à mão — o contador "em alerta" filtra a pré-visualização a essas linhas. Pode excluir-se linhas (ex.: a linha "TOTAL GERAL").',
      'O nº de conta da empresa escreve-se com a natureza no fim; é sempre tratado automaticamente.',
      'Descarrega PS2_AAAAMMDD.txt.',
    ],
  },
  {
    icon: CreditCard,
    title: 'Renovação de Cartões',
    intro: 'Divide o export de renovação do banco em lotes de até 490 cartões, por balcão.',
    points: [
      'Cola a folha ou carrega o ficheiro do banco (.xls/.xlsx/.csv); as colunas Balcão e Nº de Cartão são detetadas automaticamente.',
      'Linhas sem balcão ou sem nº de cartão válido ficam assinaladas — nunca são descartadas em silêncio.',
      'A sessão fica guardada no servidor: recarregar a página, ou continuar noutro computador, retoma exatamente onde ficou — nenhum cartão se perde ou duplica.',
      'Escolhe os balcões e gera um lote — no máximo 490 cartões (o limite do banco é 500); o que sobra fica pendente para o lote seguinte.',
      'Cada lote descarrega-se logo como .prn (um nº de cartão por linha, a 7 dígitos) e pode voltar a descarregar-se mais tarde a partir da lista de lotes.',
      '"Terminar sessão" só fica disponível quando não sobra nenhum cartão pendente.',
    ],
  },
  {
    icon: BarChart3,
    title: 'Estatísticas',
    intro: 'Evolução mensal e detalhe dos processamentos de ficheiros.',
    points: [
      'Filtro por intervalo de datas; barras por mês e por tipo (salário, cobranças, compensação).',
      'Exportação da tabela em XLSX ou PDF.',
      'Os dados vêm dos processamentos registados na Ficha de Procedimentos.',
    ],
  },
  {
    icon: Settings,
    title: 'Configurações',
    intro: 'Conta, segurança e aspeto.',
    points: [
      'Associar a conta a um código de operador (para o nome sair certo no PDF e no histórico).',
      'Definir / alterar o PIN de assinatura e a palavra-passe.',
      'Tema: claro, escuro ou alto contraste — a escolha fica guardada neste dispositivo.',
    ],
  },
  {
    icon: Search,
    title: 'Navegação',
    intro: 'Mover-se pela aplicação.',
    points: [
      'Ctrl + K (ou o botão "Pesquisar" na barra lateral) abre a paleta de comandos — escrever filtra, ↑/↓ movem, Enter abre.',
      'A barra lateral recolhe-se para dar mais espaço; o botão está no cabeçalho.',
      'Se o servidor ficar sem ligação, aparece um aviso no topo e a aplicação continua a funcionar — recupera sozinha quando a ligação voltar.',
    ],
  },
];

const Documentation = () => (
  <PageContainer size="default">
    <PageHeader title="Documentação" subtitle="O que cada parte da aplicação faz" />

    <div className="space-y-6">
      {SECCOES.map((s) => (
        <Card key={s.title}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <s.icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">{s.title}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">{s.intro}</p>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {s.points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  </PageContainer>
);

export default Documentation;
