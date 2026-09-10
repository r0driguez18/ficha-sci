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
      'Grava sozinha enquanto se preenche (não é preciso "guardar").',
      'Assinatura eletrónica com o PIN do operador (Configurações → PIN). Fica com o nome, a hora e um selo de integridade no PDF.',
      'Nos dias não úteis e no último dia do mês aparece o "Procedimento Verificação de Tapes". O display (PDF ou TXT) anexa-se depois — a ficha só pode ser descarregada depois de o display estar anexado.',
      'O PDF exporta-se com o nome FD DD.MM.AA.pdf.',
      '"Recomeçar" limpa a ficha toda (ecrã e servidor) — pede confirmação.',
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
      'Uma nota por turno e por data (ocorrências, pendências a acompanhar, avisos).',
      'Quem entra confirma a leitura — fica registado com o operador e a hora.',
      'As notas não se apagam.',
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
    title: 'Gerador PS2',
    intro: 'Transforma a folha de salários em ficheiro PS2 para o banco.',
    points: [
      'Cola a folha do Excel ou carrega o .xlsx; as colunas (NIB, valor, nome) são detetadas e podem ajustar-se.',
      'As contas são convertidas para NIB do BCA. O formato das contas recebidas escolhe-se no seletor: detetar automaticamente, só o nº de conta, ou NIB completo.',
      'A natureza no fim do NIB é convertida pela tabela (1 → 10176, 2 → 10273, …). Contas de outros bancos ficam de fora do ficheiro.',
      'Linhas que não dão um NIB de 21 dígitos ficam "em alerta" para corrigir à mão — o contador "em alerta" filtra a pré-visualização a essas linhas. Pode excluir-se linhas (ex.: a linha "TOTAL GERAL").',
      'O nº de conta da empresa escreve-se com a natureza no fim; é sempre tratado automaticamente.',
      'Descarrega PS2_AAAAMMDD.txt.',
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
