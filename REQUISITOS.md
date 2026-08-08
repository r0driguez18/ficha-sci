# Documento de Requisitos — Sistema SCI (Centro Informática / BCA)

**Projeto:** SCI — Sistema de Controlo Interno
**Cliente:** Banco Comercial do Atlântico (BCA) — Direção de Sistemas de Informação, Centro Informática (DSI-CI)
**Versão do documento:** 1.0
**Estado:** Em produção (ambiente interno, self-hosted)

---

## 1. Enquadramento

### 1.1. O problema que o cliente nos trouxe

> "No Centro Informática temos equipas a trabalhar em três turnos, 24 horas por dia. Cada turno tem uma lista de tarefas obrigatórias que tem de executar — arranque de sistemas, fecho do dia, backups, tratamento de ficheiros de compensação, abertura de servidores, etc.
>
> Até agora isto era controlado em papel. O operador imprimia a ficha de procedimentos, ia riscando o que fazia à mão, assinava no fim e arquivava numa pasta. O problema é evidente: as fichas perdem-se, a letra é ilegível, não conseguimos saber quem fez o quê nem a que horas, e quando a auditoria pede o histórico de um dia específico é uma caça ao tesouro.
>
> Queremos passar isto para uma aplicação web interna. Cada operador entra com o seu utilizador, preenche a ficha do turno dele durante o serviço, e no fim exporta um PDF idêntico ao formulário oficial em papel — porque a auditoria e a chefia continuam a exigir esse formato. Esse PDF fica arquivado no sistema e podemos consultá-lo mais tarde.
>
> Além disso, aproveitem para juntar outras coisas que andamos a controlar em Excel: o registo de processamentos de ficheiros, os retornos de cobranças que temos de devolver dentro do prazo, e alertas para não nos esquecermos das tarefas de hora certa."

### 1.2. Restrição fundamental

O sistema corre **exclusivamente na rede interna isolada do banco**. Não há acesso à internet a partir dos servidores de produção. Toda a infraestrutura (base de dados, autenticação, armazenamento) é **self-hosted via Docker**.

---

## 2. Requisitos Funcionais

### RF-01 — Autenticação e Acesso

| ID | Requisito |
|---|---|
| RF-01.1 | O sistema deve exigir autenticação (email + password) antes de dar acesso a qualquer funcionalidade. |
| RF-01.2 | Todas as páginas internas devem ser rotas protegidas — um utilizador não autenticado é redirecionado para o login. |
| RF-01.3 | Deve existir fluxo de recuperação/reposição de password. |
| RF-01.4 | A sessão deve persistir entre recargas da página e a identidade do operador deve ficar visível na aplicação. |

**Na voz do cliente:** *"Cada operador tem de entrar com a conta dele. Preciso de saber quem preencheu cada ficha — isso é o mínimo que a auditoria exige."*

---

### RF-02 — Ficha de Procedimentos (módulo central)

O coração do sistema. Reproduz digitalmente a ficha em papel usada no Centro Informática.

| ID | Requisito |
|---|---|
| RF-02.1 | Devem existir **quatro variantes** da ficha, porque os procedimentos mudam consoante o dia: <br>• **Dia útil normal** (3 turnos) <br>• **Dia não útil** (apenas Turno 3) <br>• **Final de mês em dia útil** (3 turnos + tarefas de fecho mensal) <br>• **Final de mês em dia não útil** (Turno 3 + tarefas de fecho mensal) |
| RF-02.2 | Cada turno tem a sua própria lista de tarefas (checkboxes), organizada por secções lógicas (ex.: *Operações do Fecho do Dia*, *Depois do Fecho*). |
| RF-02.3 | Certas tarefas exigem **registo da hora de execução** (ex.: início do fecho, término do fecho, abertura do Real Time). |
| RF-02.4 | Certas tarefas exigem **valor associado** (ex.: saldo da conta, com indicação de saldo positivo/negativo). |
| RF-02.5 | Cada turno regista obrigatoriamente: **Operador**, **Hora de Entrada** e **Hora de Saída**. Sem estes três campos a ficha não pode ser guardada. |
| RF-02.6 | Cada turno tem um campo livre de **Observações**. |
| RF-02.7 | Deve existir uma **tabela de processamentos** onde o operador regista linha a linha: Hora, Tarefa, Nome AS400, Nº de Operação, Executado por, Tipo. |
| RF-02.8 | O **Nº de Operação** deve ter 9 dígitos e o sistema deve avisar quando é introduzido um número já registado (deteção de duplicados). |
| RF-02.9 | A ficha deve ser **assinada digitalmente** no fim (nome do signatário) antes da exportação. |
| RF-02.10 | A navegação entre turnos faz-se por **separadores (tabs)**. |
| RF-02.11 | O operador deve poder **reiniciar o formulário** (limpar tudo e recomeçar). |

**Na voz do cliente:** *"A ficha digital tem de ser fiel à de papel. Se o operador está habituado a ver as tarefas por aquela ordem, mantenham a ordem. Não inventem."*

---

### RF-03 — Gravação Automática e Sincronização

| ID | Requisito |
|---|---|
| RF-03.1 | O preenchimento deve ser **guardado automaticamente** enquanto o operador trabalha, sem precisar de clicar em "Guardar". |
| RF-03.2 | Os dados devem persistir **localmente** (para resistir a fecho acidental do browser) **e no servidor** (para não se perderem). |
| RF-03.3 | Deve existir um **indicador visual do estado de sincronização** (guardado / a guardar / erro). |
| RF-03.4 | Só pode existir **uma ficha por operador, por tipo de ficha e por data**. Reabrir a mesma ficha carrega o que já estava preenchido. |

**Na voz do cliente:** *"Um turno dura oito horas. Se o operador preencheu metade da ficha e o computador reinicia, ele não pode perder o trabalho. Isso mata a adesão ao sistema logo na primeira semana."*

---

### RF-04 — Exportação para PDF

| ID | Requisito |
|---|---|
| RF-04.1 | A ficha deve poder ser exportada em **PDF com layout idêntico ao formulário oficial em papel**. |
| RF-04.2 | O PDF deve conter os cabeçalhos institucionais **"CENTRO INFORMÁTICA"** e **"DSI-CI/2025"**. |
| RF-04.3 | O PDF **não deve conter o logótipo do BCA**. |
| RF-04.4 | O PDF deve incluir a assinatura, o operador, as horas e a tabela de processamentos. |
| RF-04.5 | Cada turno tem um layout de PDF próprio. |

---

### RF-05 — Gestão de Data e Ciclo Diário

| ID | Requisito |
|---|---|
| RF-05.1 | A data da ficha **mantém-se fixa** enquanto a ficha não for exportada. |
| RF-05.2 | A data **só avança para o dia seguinte após a exportação do PDF**. |
| RF-05.3 | O sistema deve identificar automaticamente se a data corresponde a **fim de mês** e/ou **dia não útil**, para sugerir a variante correta da ficha. |

**Na voz do cliente:** *"O Turno 3 entra às 23h e sai às 7h da manhã seguinte. A ficha é do dia em que o turno começou, não do dia em que acabou. Só quando ele fecha e exporta é que passamos ao dia seguinte."*

---

### RF-06 — Histórico de Fichas

| ID | Requisito |
|---|---|
| RF-06.1 | Todas as fichas exportadas ficam **arquivadas** no sistema. |
| RF-06.2 | Deve ser possível **pesquisar e filtrar** o histórico (por data, tipo de ficha, operador). |
| RF-06.3 | Deve ser possível **reabrir e visualizar o PDF** de uma ficha arquivada, regenerado a partir dos dados guardados. |

**Na voz do cliente:** *"Quando a auditoria pedir a ficha do dia 14 de março, quero ir ao sistema, filtrar e imprimir. Trinta segundos, não três horas."*

---

### RF-07 — Retornos de Cobranças

| ID | Requisito |
|---|---|
| RF-07.1 | Quando é processado um ficheiro de cobranças, o sistema deve **registar automaticamente** o retorno pendente. |
| RF-07.2 | Cada registo guarda: data de aplicação, **data de retorno esperada**, nome do ficheiro, estado (enviado/pendente) e observações. |
| RF-07.3 | O sistema deve mostrar um **contador de retornos pendentes** na navegação lateral. |
| RF-07.4 | O operador deve poder **marcar um retorno como enviado**, registando a data efetiva. |

**Na voz do cliente:** *"Os ficheiros de cobrança têm prazo de retorno. Se falharmos o prazo há penalização. Quero um número bem visível a dizer-me quantos estão pendentes."*

---

### RF-08 — Processamento de Ficheiros (CRC / DIS)

| ID | Requisito |
|---|---|
| RF-08.1 | Módulo **CRC** — registo e tratamento de ficheiros da Central de Riscos de Crédito. |
| RF-08.2 | Módulo **DIS** — consulta e gestão de dados. |
| RF-08.3 | Os processamentos registados devem ser **categorizados por tipo** (incluindo distinção de processamentos de salários). |

---

### RF-09 — Estatísticas de Processamentos

| ID | Requisito |
|---|---|
| RF-09.1 | Painel com **gráficos de barras** da evolução dos processamentos. |
| RF-09.2 | **Tabela detalhada** com todos os processamentos registados. |
| RF-09.3 | Separação entre a visão global e a visão de salários. |

---

### RF-10 — Alertas Diários

| ID | Requisito |
|---|---|
| RF-10.1 | O sistema deve permitir configurar **alertas recorrentes** com nome, descrição, hora e dias da semana. |
| RF-10.2 | Os alertas ativos devem aparecer num **widget no Dashboard**. |

**Na voz do cliente:** *"Há tarefas que têm hora marcada — o percurso das 23h00, por exemplo. Se o operador se distrai, atrasa o fecho todo. Um lembrete no ecrã resolve."*

---

### RF-11 — Dashboard e Navegação

| ID | Requisito |
|---|---|
| RF-11.1 | Página inicial com **acesso rápido aos módulos** e widget de alertas. |
| RF-11.2 | **Barra lateral** com os módulos (SCI, CRC, DIS, Processamentos) e área de Sistema (Configurações, Documentação). |
| RF-11.3 | A barra lateral deve poder **recolher para modo de ícones**, com tooltips. |
| RF-11.4 | Deve existir **pesquisa global** para saltar diretamente para qualquer página. |
| RF-11.5 | Deve existir **navegação por breadcrumbs**. |

---

### RF-12 — Calendário

| ID | Requisito |
|---|---|
| RF-12.1 | Vista de calendário mensal com **marcação de eventos e notas** por dia. |
| RF-12.2 | Identificação de **dias úteis e não úteis**. |

---

## 3. Requisitos Não Funcionais

### RNF-01 — Infraestrutura e Alojamento

| ID | Requisito |
|---|---|
| RNF-01.1 | O backend corre em **Supabase self-hosted via Docker**, na rede interna isolada do banco. |
| RNF-01.2 | **Não é permitida** dependência de serviços cloud externos em produção. |
| RNF-01.3 | O frontend é servido por **IIS ou NGINX** em servidor Windows, com reverse proxy para o Supabase. |
| RNF-01.4 | O deployment é automatizado por **scripts PowerShell** (`deploy.ps1`, `backup.ps1`, `health-check.ps1`). |

### RNF-02 — Segurança

| ID | Requisito |
|---|---|
| RNF-02.1 | Acesso exclusivamente autenticado; sem áreas públicas. |
| RNF-02.2 | **Row Level Security (RLS)** ativa em todas as tabelas, com políticas **PERMISSIVE** (adequadas ao ambiente self-hosted de rede fechada). |
| RNF-02.3 | Credenciais e chaves nunca versionadas no código — apenas em ficheiros de ambiente no servidor. |
| RNF-02.4 | A `service_role_key` nunca é exposta ao frontend. |
| RNF-02.5 | Restrição de unicidade `(user_id, form_type, date)` para impedir fichas duplicadas. |

### RNF-03 — Usabilidade

| ID | Requisito |
|---|---|
| RNF-03.1 | Interface integralmente em **Português (Portugal)**. |
| RNF-03.2 | Nenhum conteúdo de navegação pode depender de *hover* — tudo permanentemente visível ou acessível por clique. |
| RNF-03.3 | Formulários longos devem ser **agrupados em secções visuais** com hierarquia clara. |
| RNF-03.4 | Feedback imediato de todas as ações através de notificações (*toasts*). |
| RNF-03.5 | O sistema é usado durante turnos noturnos — a leitura deve ser confortável e o contraste elevado. |

### RNF-04 — Identidade Visual

| ID | Requisito |
|---|---|
| RNF-04.1 | Cor institucional primária: **Azul BCA `#0066B3`**. |
| RNF-04.2 | Fundo em tons de cinza neutro. |
| RNF-04.3 | Todas as cores definidas como **tokens semânticos** no design system — sem cores fixas nos componentes. |
| RNF-04.4 | Nos PDFs: cabeçalhos institucionais em texto, **sem logótipo**. |

### RNF-05 — Acessibilidade

| ID | Requisito |
|---|---|
| RNF-05.1 | Contraste de texto conforme **WCAG AA**. |
| RNF-05.2 | Todos os campos de formulário com etiquetas (*labels*) explícitas e associadas. |
| RNF-05.3 | Navegação por teclado funcional; estados de foco visíveis. |
| RNF-05.4 | Componentes de UI assentes em primitivos acessíveis (Radix UI). |

### RNF-06 — Fiabilidade

| ID | Requisito |
|---|---|
| RNF-06.1 | Persistência em duas camadas (local + servidor) para tolerância a falhas. |
| RNF-06.2 | Gravação automática com *debounce* para não sobrecarregar a base de dados. |
| RNF-06.3 | Trigger de base de dados a manter `updated_at` sempre atualizado. |
| RNF-06.4 | Procedimento de **backup** documentado e automatizado. |

### RNF-07 — Manutenibilidade

| ID | Requisito |
|---|---|
| RNF-07.1 | Stack: **React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui**. |
| RNF-07.2 | Tipagem estrita — sem erros de TypeScript na compilação. |
| RNF-07.3 | Lógica de negócio isolada em serviços dedicados (`src/services/`). |
| RNF-07.4 | Geração de PDF modularizada por turno (`src/utils/pdf/`). |
| RNF-07.5 | Esquema da base de dados gerido por **migrações versionadas**. |
| RNF-07.6 | Base de código sem ficheiros, componentes ou dependências não utilizados. |

### RNF-08 — Compatibilidade

| ID | Requisito |
|---|---|
| RNF-08.1 | Suporte aos browsers modernos disponíveis nos postos de trabalho do banco. |
| RNF-08.2 | Layout responsivo, otimizado para monitores de secretária. |

---

## 4. Modelo de Dados

| Tabela | Finalidade |
|---|---|
| `taskboard_data` | Fichas em preenchimento (rascunho auto-guardado). Único por `(user_id, form_type, date)`. |
| `exported_taskboards` | Arquivo histórico das fichas exportadas em PDF, com assinatura. |
| `file_processes` | Registo de processamentos de ficheiros (inclui marcação de salários). |
| `cobrancas_retornos` | Controlo de prazos de retorno de ficheiros de cobrança. |
| `daily_alerts` | Configuração de alertas recorrentes por hora e dia da semana. |
| `salary_processes` *(vista)* | Vista filtrada de `file_processes` onde `is_salary = true`. |

**Armazenamento de ficheiros:** bucket `shift-maps` (mapas de turno).

---

## 5. Operadores Registados

| Utilizador | Nome |
|---|---|
| `nalves` | Nelson Alves |
| `etavares` | Evandro Tavares |
| `edelgado` | Emanuel Delgado |
| `ebrito` | Elvis Brito |
| `lspencer` | Louis Spencer |

---

## 6. Fora de Âmbito

Funcionalidades explicitamente **não incluídas**:

- Notificações via bot de Telegram *(removido — a rede isolada não permite acesso a APIs externas)*.
- Qualquer integração com serviços cloud de terceiros.
- Acesso público ou a partir do exterior da rede do banco.
- Aplicação móvel nativa.

---

## 7. Critérios de Aceitação

O sistema considera-se aceite quando:

1. Um operador consegue autenticar-se, preencher a ficha completa do seu turno e exportar o PDF no formato oficial.
2. O trabalho em curso sobrevive ao fecho e reabertura do browser.
3. A data só avança após a exportação do PDF.
4. Qualquer ficha exportada é recuperável a partir do histórico.
5. Os retornos de cobranças pendentes são visíveis e contabilizados.
6. Todo o sistema funciona sem qualquer acesso à internet.
7. O projeto compila sem erros de TypeScript.

---

*Documento elaborado para o Centro Informática — DSI-CI, Banco Comercial do Atlântico.*
