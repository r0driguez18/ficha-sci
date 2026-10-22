# PRD — Documento de Requisitos do Produto

**Produto:** SCI — Sistema de Controlo Interno (aplicação interna do Centro Informática)
**Cliente:** Banco Comercial do Atlântico (BCA) — Direção de Sistemas de Informação, Centro Informática (DSI-CI)
**Versão:** 2.0 · **Data:** 2026-10-15 · **Estado:** em produção (rede interna), em evolução

> Este documento **substitui** os requisitos originais (v1.0, retirados do repositório), que descreviam módulos entretanto
> retirados (CRC, DIS, Calendário) e uma instalação Windows/IIS que não é a real. Descreve o produto
> **como está hoje**, e assinala o que ainda está em aberto.

Documentos relacionados: [TRD](02-TRD.md) · [UI/UX](03-UI-UX-Design.md) · [App Flow](04-App-Flow.md) ·
[Backend Schema](05-Backend-Schema.md) · [Plano de Implementação](06-Plano-de-Implementacao.md)

---

## 1. Contexto e problema

O Centro Informática trabalha em **três turnos, 24 horas por dia**. Cada turno executa uma lista de
procedimentos (arranque, fecho do dia, backups, tratamento de ficheiros, abertura de servidores…) que
era controlada **em papel**: fichas impressas, riscadas à mão, assinadas e arquivadas em pasta.

Problemas do papel:

- fichas perdidas, letra ilegível;
- impossível saber **quem fez o quê e a que horas**;
- uma auditoria a um dia específico era "uma caça ao tesouro";
- tarefas de **hora certa** esquecidas, atrasando o fecho;
- controlos paralelos em Excel (processamentos, retornos de cobranças) fora do registo oficial.

### Restrição fundamental

O sistema corre **exclusivamente na rede interna isolada do banco**. Não há Internet nos servidores de
produção. Toda a infraestrutura (base de dados, autenticação, ficheiros, funções) é **self-hosted**, e
a aplicação não pode depender de nenhum serviço externo (nem fontes, nem CDN, nem email).

---

## 2. Objetivos

| # | Objetivo | Como se mede |
|---|---|---|
| O1 | Substituir a ficha em papel por uma ficha digital **fiel** à oficial, com PDF idêntico para a auditoria | A ficha de um dia recupera-se do histórico em segundos |
| O2 | Saber **quem** fez **o quê** e **quando**, de forma verificável | Assinatura por PIN com selo de integridade no PDF; registos nominais |
| O3 | Nenhum trabalho se perde a meio de um turno | Gravação automática local + servidor; a ficha é a **mesma** em qualquer computador |
| O4 | Retirar do Excel os controlos paralelos (retornos, processamentos, salários, cartões) | Cada um tem módulo próprio com prazos e histórico |
| O5 | Reduzir erros manuais em tarefas repetitivas (ficheiros PS2/OIC, lotes de cartões) | Geradores com validação; verificação do turno seguinte |
| O6 | Funcionar sem Internet e sem depender de uma pessoa | Sem serviços externos; gestão de utilizadores pela própria app |

### Fora de âmbito (decisões explícitas)

- **CRC / Inconsistências**: removido (exigia um serviço Python local nos PCs dos operadores).
- **DIS** e **Calendário**: removidos por decisão do cliente.
- **Notificações por Telegram / email**: a rede não permite; nem recuperação de senha por email.
- Aplicação móvel nativa; acesso a partir do exterior da rede do banco; qualquer integração cloud.

---

## 3. Utilizadores e papéis

| Papel | Quem | Pode |
|---|---|---|
| **Operador** | Equipa dos turnos (hoje 5 pessoas) | Preencher e assinar fichas, usar geradores e módulos, verificar ficheiros, deixar notas de passagem, definir o seu PIN |
| **Administrador** | Operador com `papel = administrador` | Tudo o que o operador faz **+** criar/eliminar utilizadores, gerar links, repor senhas, tornar outros administradores |

- A identidade é a conta **utilizador** (ex.: `nalves`), que é também o **código de operador** que
  fica nos dados (`nalves`, `etavares`, `edelgado`, `elvisb`, `lspencer`).
- **Toda a equipa vê tudo** (a ficha é "de todos"): o que o turno anterior preencheu, o histórico, os
  retornos. A restrição é por **ação** (assinar exige PIN próprio; gerir utilizadores exige ser
  administrador), não por visibilidade.
- **Futuro:** autenticação pelo Active Directory do banco (ver §9).

---

## 4. Requisitos funcionais

### RF-01 — Autenticação e contas

| ID | Requisito |
|---|---|
| RF-01.1 | Acesso só autenticado; sem áreas públicas. Rotas protegidas redirecionam para o login. |
| RF-01.2 | Login com **utilizador** (sem `@`) e senha; o domínio completa-se sozinho. |
| RF-01.3 | Contas criadas **só pelo administrador**; não há auto-registo. |
| RF-01.4 | Conta nova nasce com senha que a pessoa não conhece: recebe um **link** (vale 24 h, uso único) e escolhe a sua. |
| RF-01.5 | Conta criada com senha provisória obriga a **trocar a senha** antes de usar a app. |
| RF-01.6 | Senha esquecida — três caminhos: (1) **link novo** do administrador; (2) **repor senha** pelo administrador (senha temporária); (3) **"Esqueceu a senha?"** com utilizador + PIN de assinatura. |
| RF-01.7 | A reposição pelo PIN tem limite de **5 tentativas por conta em 24 h**, respostas que não revelam se o utilizador existe, e fica **registada e visível** aos administradores. |
| RF-01.8 | Mínimo de 8 caracteres para a senha escolhida. |

### RF-01A — Registo de alterações

| ID | Requisito |
|---|---|
| RF-01A.1 | Fica registado **quem criou, alterou ou apagou** fichas exportadas, lotes PS2 e a sua verificação, operadores e papéis, PINs (só o facto), retornos de cobrança, passagem de turno, renovação de cartões e contas de utilizador. |
| RF-01A.2 | O registo é **imutável** e só os **administradores** o consultam, com filtros por assunto, operador e datas. |
| RF-01A.3 | Não guarda o conteúdo das fichas nem valores secretos: só os campos que mudaram (de → para) e o selo da ficha. |

### RF-01B — Ficha de Comunicação/Ocorrências

| ID | Requisito |
|---|---|
| RF-01B.1 | Registar cada ocorrência do dia com os campos da ficha em papel: **N.º Avaria, Descrição, Hora Início, Hora Término e Encaminhamento**; fica o autor. Categoria, sistema e turno são opcionais. |
| RF-01B.2 | Sem hora de término a ocorrência está **em curso** e pode terminar noutro turno (qualquer operador a termina; reabre-se). Qualquer operador pode **editar** (incluindo corrigir a **data** e o **turno**, se alguém se enganou); cada alteração fica no registo de alterações (quem e de → para). Nada se apaga. |
| RF-01B.3 | **Outras Intervenções/Observações** por dia, como na ficha em papel. |
| RF-01B.4 | **PDF** igual à ficha em papel (12 linhas, página horizontal), descarregável por dia e **anexado ao PDF da ficha de procedimentos** desse dia. |
| RF-01B.5 | Aviso das ocorrências em curso (de qualquer dia) no painel inicial e no menu; histórico com pesquisa e o que se repete (sistemas com 2 ou mais ocorrências em 90 dias). Tudo fica no registo de alterações. |

### RF-01C — Relatório SOC (quarentena de e-mail)

| ID | Requisito |
|---|---|
| RF-01C.1 | Abrir o Excel semanal do SOC (folha «cisco - esa») e analisá-lo **no browser**: o ficheiro e os endereços não saem do computador. |
| RF-01C.2 | Analisar só o **domínio do remetente**; o domínio de destino (o do banco) nunca conta como «bloqueado». |
| RF-01C.3 | Classificar cada domínio (Cabo Verde, Portugal, webmail, suspeito, outro) e recomendar: **pedir whitelist** (CV/PT só apanhado pelo anti-spam), **verificar com o remetente** (DMARC falhou), **não libertar** (vírus ou domínio parecido com o do banco), **verificar caso a caso** (webmail) ou **manter bloqueado**. |
| RF-01C.4 | Marcar os domínios a pedir, e gerar o **e-mail para o Victor**, a lista de domínios (1 por linha) para o ESA e um CSV de todos os domínios. |

### RF-02 — Ficha de Procedimentos (módulo central)

| ID | Requisito |
|---|---|
| RF-02.1 | Duas variantes: **dia útil** (3 turnos) e **dia não útil** (só Turno 3). A variante sugere-se pela data. |
| RF-02.2 | A folha **Verificação de Tapes** aparece na ficha de dia não útil e no **último dia do mês**. |
| RF-02.3 | Cada turno tem a sua lista de tarefas, por secções, na ordem da ficha oficial. **Nenhuma tarefa é obrigatória.** |
| RF-02.4 | Tarefas com **hora de execução** e/ou **valor associado** (ex.: saldo, positivo/negativo). |
| RF-02.5 | Cada turno exige **operador, hora de entrada e hora de saída**. Há campo livre de **observações**. |
| RF-02.6 | **Tabela de processamentos**: hora, tarefa, nome AS400, nº de operação (9 dígitos), executado por, tipo. |
| RF-02.7 | **Deteção de duplicados** do nº de operação (na própria ficha e contra fichas já exportadas). |
| RF-02.8 | Progresso por turno (contador e barra) e atalho "próxima por marcar". |
| RF-02.9 | **Assinatura eletrónica com PIN** pessoal (4 dígitos), com selo de integridade (SHA-256) no PDF. |
| RF-02.10 | **"Exportar e guardar"** num só passo: valida, regista os processamentos, gera o PDF, arquiva no histórico e avança a data. |
| RF-02.11 | A ficha com a verificação de tapes só se descarrega depois de o **display de tapes** (PDF/TXT) estar anexado. |
| RF-02.12 | "Limpar" apaga o rascunho (ecrã e servidor) com confirmação; bloqueado enquanto a ficha está assinada. |

### RF-03 — Gravação automática, continuidade e data

| ID | Requisito |
|---|---|
| RF-03.1 | O preenchimento grava-se **sozinho**, no browser e no servidor, com indicador de estado. |
| RF-03.2 | **Uma só ficha por tipo e por data, para toda a equipa.** Abrir noutro computador, a meio da noite ou por outra pessoa mostra exatamente a mesma ficha. |
| RF-03.3 | A data **só avança** depois de a ficha ser exportada com assinatura (o Turno 3 pertence ao dia em que começou). |
| RF-03.4 | Depois de exportada, o rascunho desaparece (fica só o histórico). |

### RF-04 — Histórico de Fichas

| ID | Requisito |
|---|---|
| RF-04.1 | Todas as fichas exportadas ficam arquivadas, de **toda a equipa**. |
| RF-04.2 | Filtros por tipo, operador, estado do display de tapes e data. |
| RF-04.3 | Pré-visualizar/descarregar o PDF (com o display de tapes no fim) e **anexar/substituir** o display depois. |
| RF-04.4 | Pendência de display com 3 ou mais dias fica marcada **"em atraso"**. |

### RF-05 — Retornos de Cobranças

| ID | Requisito |
|---|---|
| RF-05.1 | O retorno é registado ao processar o ficheiro de cobrança, com data esperada. |
| RF-05.2 | **SLA em dias úteis**: retorno esperado no dia útil seguinte; mais de 2 dias úteis de atraso = **urgente** (feriados de Cabo Verde considerados). |
| RF-05.3 | Marcar um ou vários como enviados de uma vez, com observações; corrigir o prazo à mão (com registo). |
| RF-05.4 | Contador de pendentes visível na barra lateral. |

### RF-06 — Passagem de Turno

| ID | Requisito |
|---|---|
| RF-06.1 | Notas por **data e turno**; cada nota é uma entrada nova (nada se reescreve). |
| RF-06.2 | Cada pessoa **confirma a leitura** de cada nota: fica registado quem leu e a que horas. |
| RF-06.3 | Arquivar notas (uma a uma ou todas); histórico com filtros por data, turno e texto, paginado. |

### RF-07 — Geradores de ficheiros bancários

| ID | Requisito |
|---|---|
| RF-07.1 | **Gerador PS2** (contas BCA): cola do Excel ou carrega `.xlsx`; colunas **detetadas sozinhas**; contas convertidas para NIB; linhas com problema ficam em alerta; ficheiro com nome editável (extensão `.txt` fixa) e "Guardar como" nativo. |
| RF-07.2 | PS2: opção "dividir o valor por 10", escolha da folha (folhas por mês), formato das contas recebidas, exclusão de linhas. |
| RF-07.3 | **Gerador OIC** (outros bancos): só conta o **NIB**; NIBs do BCA ficam fora sem bloquear; várias folhas juntam-se numa lista; montantes arredondados a escudos inteiros (com marca ≈); linhas de 135 caracteres em ANSI. |
| RF-07.4 | Em ambos, **cada linha da pré-visualização pode ser corrigida** (nome, NIB/conta, valor), marcada como "editada" e reversível; a correção vale só para o ficheiro gerado. |
| RF-07.5 | Em campos de colagem, a tecla **Tab escreve um separador** (Esc + Tab sai do campo). |

### RF-08 — Verificar Débitos/Créditos

| ID | Requisito |
|---|---|
| RF-08.1 | Cada ficheiro PS2 **guardado** no gerador fica registado: ficheiro (que já traz a empresa), conta, valor, nº de registos, tipo, sentido. |
| RF-08.2 | O sentido esperado vem do tipo de operação (salários/pagamentos **debitam** a empresa; "Diversos (Crédito Empresa)" **credita**-a) e é corrigível antes de verificar. |
| RF-08.3 | O turno seguinte copia a conta e o valor, confere no core (um movimento; dois é duplicado) e marca **"Verificado"**. Fica registado quem e quando, e se foi a mesma pessoa que gerou. |
| RF-08.4 | Ficheiros guardados duas vezes com o mesmo conteúdo são **avisados** no gerador e marcados "repetido". |

### RF-09 — Renovação de Cartões

| ID | Requisito |
|---|---|
| RF-09.1 | Importar o export do banco (balcão + nº de cartão) e dividir em **lotes de até 490 cartões**, por balcões escolhidos. |
| RF-09.2 | **Nenhum cartão se duplica nem se perde**: a atribuição a um lote é atómica no servidor; linhas inválidas ficam assinaladas, nunca descartadas em silêncio. |
| RF-09.3 | Cada lote descarrega-se como `.prn` (nº de cartão a 7 dígitos por linha) e pode voltar a descarregar-se. |
| RF-09.4 | A sessão é partilhada: recarregar ou mudar de computador retoma exatamente onde ficou. |

### RF-10 — Estatísticas, alertas e início

| ID | Requisito |
|---|---|
| RF-10.1 | **Estatísticas** dos processamentos: evolução mensal por tipo, tabela detalhada, exportação XLSX/PDF. |
| RF-10.2 | **Alertas de hora certa** (enviar ETR, processar TEF/telecompensação, ENV/IMA…): aviso no ecrã em qualquer página, até "Já feito" ou "Adiar 10 min". Só em dias úteis. |
| RF-10.3 | **Início** ("Hoje em resumo"): ficha de hoje (variante certa e se já foi exportada), próximo alerta com contagem decrescente, acessos rápidos. |

### RF-11 — Administração de utilizadores

| ID | Requisito |
|---|---|
| RF-11.1 | Só administradores: criar utilizador (nome, email, **utilizador** = código de operador), ligado ao operador. |
| RF-11.2 | Gerar **novo link**, **repor senha** (temporária, mostrada uma vez), **eliminar** conta (o operador e o histórico ficam), tornar/retirar **administrador**. |
| RF-11.3 | Salvaguardas: não se elimina a própria conta nem a de um administrador; **nunca fica o sistema sem administrador**. |
| RF-11.4 | A lista mostra estado (à espera de senha / último acesso) e a última reposição de senha (com o método). |

### RF-12 — Navegação

| ID | Requisito |
|---|---|
| RF-12.1 | Menu lateral plano com rótulos de grupo (SCI · Ferramentas · Sistema), recolhível para ícones com dica. |
| RF-12.2 | **Paleta de comandos** (Ctrl+K) para saltar para qualquer página; breadcrumbs. |
| RF-12.3 | Página de **Documentação** dentro da app, por área. |

---

## 5. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | **Sem Internet em produção**: fontes, ícones e bibliotecas servidos localmente; nenhuma chamada externa. |
| RNF-02 | **Resiliência**: o *shell* da app fica em cache (PWA) e abre com o servidor em baixo, com aviso e recuperação automática. |
| RNF-03 | **Segurança de dados**: RLS ativa em todas as tabelas; escritas sensíveis só por funções do servidor; PIN guardado só como hash; chave de serviço nunca no browser. |
| RNF-04 | **Integridade**: fichas assinadas não se reescrevem (o selo cobre o conteúdo, incluindo o código do operador). |
| RNF-05 | **Idioma**: português de Portugal, tratamento por "tu". |
| RNF-06 | **Acessibilidade**: contraste WCAG AA nos três temas (claro, escuro, alto contraste); labels associados; foco visível; primitivos Radix. |
| RNF-07 | **Usabilidade noturna**: leitura confortável, contraste elevado, sem depender de *hover*. |
| RNF-08 | **Manutenibilidade**: TypeScript estrito; lógica em serviços e bibliotecas; esquema por migrações versionadas e idempotentes. |
| RNF-09 | **Operação**: deploy num comando, com backup automático antes de qualquer alteração à base de dados. |
| RNF-10 | **Compatibilidade**: browsers modernos dos postos (Chrome/Edge recomendados pelo "Guardar como" nativo; os outros usam o download normal). |

---

## 6. Critérios de aceitação

1. Um operador entra com o utilizador, preenche a ficha do turno e exporta o PDF no formato oficial, com assinatura por PIN.
2. A ficha sobrevive ao fecho do browser e aparece igual noutro computador.
3. A data só avança depois da exportação assinada; a ficha exportada recupera-se do histórico.
4. Retornos pendentes visíveis, com urgência calculada em dias úteis.
5. Um ficheiro PS2/OIC gera-se a partir da folha, com linhas inválidas assinaladas e corrigíveis, e o turno seguinte verifica-o sem abrir emails.
6. Nenhum cartão aparece em dois lotes nem fica por atribuir.
7. Um administrador cria um utilizador, entrega-lhe um link, e a pessoa entra com a senha que escolheu — sem que ninguém a conheça.
8. Tudo funciona sem acesso à Internet.
9. O projeto compila sem erros de TypeScript.

---

## 7. Dependências e premissas

- Servidor Linux na rede interna com **Docker** (Supabase self-hosted) e **nginx** (HTTPS, certificado interno).
- Um PC que alcance o servidor (cabo) para fazer deploys; outro acesso (WiFi) para o GitHub.
- Cada operador define o seu **PIN** em Configurações antes de assinar.
- Postos com browser recente e acesso ao servidor.

---

## 8. Riscos conhecidos

| Risco | Impacto | Mitigação / estado |
|---|---|---|
| Único administrador esquece a senha | Ninguém gere utilizadores | Ter **dois administradores**; script no servidor gera link; reposição pelo PIN |
| PIN de 4 dígitos (reposição de senha) | Tomada de conta por quem o conheça | Limite 5/24 h, registo visível, desligável (`REPOR_SENHA_POR_PIN=false`) |
| Depender de uma só pessoa para o deploy | Atualizações bloqueadas | Deploy num comando, documentado |
| Sem testes automatizados | Regressões em alterações futuras | Ver [Plano de Implementação](06-Plano-de-Implementacao.md), §6 |
| Autenticação separada do AD | Palavras-passe a gerir na app | Integração AD planeada (§9) |

---

## 9. Evolução prevista

1. **Autenticação por Active Directory (LDAPS)**: login com a conta do Windows, grupos AD para o papel,
   uma conta local de emergência. Aguarda respostas do administrador do domínio (domínio, DC, certificado,
   grupos, formato do utilizador). A app já usa `utilizador@bca.cv`, compatível com este modelo.
2. **Reset dos dados de teste** antes da entrada em produção real (com backup; sem tocar em configurações).
3. **Avaliação de SQL Server** como base de dados: viável, mas exige API própria (o Supabase assenta em
   PostgreSQL). Alternativa de baixo custo: manter PostgreSQL e exportar para SQL Server (relatórios).
4. **Testes automatizados** para os fluxos críticos (assinatura, lotes de cartões, reposição de senha).
5. Mensagem de início/fim do fecho para o grupo (Teams/WhatsApp): depende de saída para Internet ou de
   um canal interno; não implementado.
