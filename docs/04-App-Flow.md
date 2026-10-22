# App Flow — Fluxos da aplicação

**Produto:** SCI — Sistema de Controlo Interno · **Versão:** 2.0 · **Data:** 2026-10-15

Os diagramas usam Mermaid (renderizam no GitHub e em editores com suporte). Complementa o
[PRD](01-PRD.md) e o [UI/UX](03-UI-UX-Design.md).

---

## 1. Mapa de rotas

| Rota | Ecrã | Acesso |
|---|---|---|
| `/` | Redireciona para `/dashboard` | — |
| `/auth/login` | Login (+ "Esqueceu a senha?") | Público |
| `/reset-password` | Definir senha pelo link | Link de recuperação |
| `/auth/definir-senha` | Troca obrigatória da senha | Sessão com `must_change_password` |
| `/dashboard` | Início — "Hoje em resumo" | Autenticado |
| `/sci` → `/sci/procedimentos` | Entrada para as fichas | Autenticado |
| `/sci/taskboard` | Ficha — dia útil | Autenticado |
| `/sci/taskboard-dia-nao-util` | Ficha — dia não útil | Autenticado |
| `/sci/taskboard-final-mes-util` · `…-nao-util` | Redirecionam para as duas fichas (a folha de tapes vive dentro delas) | — |
| `/sci/historico-fichas` | Histórico de fichas | Autenticado |
| `/sci/retornos-cobrancas` | Retornos de cobranças | Autenticado |
| `/sci/passagem-turno` | Passagem de turno | Autenticado |
| `/sci/verificacao-ficheiros` | Verificar Débitos/Créditos | Autenticado |
| `/sci/ocorrencias` | Ficha de Comunicação/Ocorrências (avarias do dia, observações, PDF; histórico e pesquisa) | Autenticado |
| `/sci/soc` | Relatório SOC (análise do relatório de quarentena do Cisco ESA) | Autenticado |
| `/sci/geradores` | Geradores PS2 / OIC (`/sci/gerador-ps2` → separador PS2) | Autenticado |
| `/sci/renovacao-cartoes` | Renovação de cartões | Autenticado |
| `/easyvista` → `/easyvista/estatisticas` | Estatísticas de processamentos | Autenticado |
| `/settings` | Configurações (conta, PIN, utilizadores) | Autenticado (utilizadores: administrador) |
| `/registo-alteracoes` | Registo de alterações (quem alterou o quê e quando) | Administrador |
| `/docs` | Documentação | Autenticado |
| `*` | 404 | — |

---

## 2. Autenticação

```mermaid
flowchart TD
  A([Abrir a app]) --> B{Sessão válida?}
  B -- não --> L[Login: utilizador + senha]
  B -- sim --> C{must_change_password?}
  L -->|credenciais certas| C
  L -->|errado| L
  L -->|Esqueceu a senha?| R[Ecrã de reposição por PIN]
  C -- sim --> D[/auth/definir-senha<br/>escolhe senha nova/]
  D --> E([Dashboard])
  C -- não --> E
  R -->|utilizador + PIN + senha nova| OK{PIN certo e conta não bloqueada?}
  OK -- sim --> L2[Senha reposta → volta ao login]
  OK -- não --> R
```

- A sessão persiste entre recargas (supabase-js).
- Todas as rotas internas passam por `PrivateRoute`: sem sessão → login; com `must_change_password` → definir senha.

---

## 3. Fluxo diário do operador

```mermaid
flowchart TD
  I([Entra no turno]) --> D[Início: vê a ficha de hoje e o próximo alerta]
  D --> P[Passagem de Turno: lê e confirma as notas do turno anterior]
  P --> F[Ficha de hoje<br/>a mesma de toda a equipa]
  F --> W[Preenche tarefas, horas, valores, processamentos]
  W -->|grava sozinho| W
  W --> G{Gera ficheiros?}
  G -- sim --> GER[Geradores PS2 / OIC] --> SAVE[Guarda o ficheiro] --> V[(Fica na lista Verificar Débitos/Créditos)]
  G -- não --> S
  W --> S[Assina com PIN]
  S --> X[Exportar e guardar]
  X --> H[(Histórico + PDF)]
  X --> N[Deixa nota na Passagem de Turno]
  N --> O([Sai do turno])
```

- Alertas de hora certa interrompem em qualquer ponto (§10).
- A ficha **não se perde** se o computador reiniciar: abre-se noutro posto e está igual.

---

## 4. Ciclo de vida da ficha

```mermaid
stateDiagram-v2
  [*] --> Rascunho: abrir a ficha do dia
  Rascunho --> Rascunho: preencher (grava local + servidor)
  Rascunho --> Assinada: PIN verificado (token de uso único)
  Assinada --> Rascunho: "Remover assinatura"
  Assinada --> Exportada: "Exportar e guardar"
  Rascunho --> [*]: "Limpar" com confirmação, bloqueado se assinada
  Exportada --> [*]: rascunho apagado, data avança
  note right of Exportada
    exported_taskboards (PDF + selo SHA-256)
    file_processes (estatística)
    retorno de cobrança (se aplicável)
  end note
```

**"Exportar e guardar" valida, por esta ordem:** assinatura · operador/entrada/saída por turno · duplicados
de nº de operação · (com tapes) display anexado. Só depois: regista processamentos → gera PDF → arquiva →
apaga o rascunho → avança a data.

### 4.1 Verificação de tapes

```mermaid
flowchart LR
  A[Ficha de dia não útil<br/>ou último dia do mês] --> B[Preenche a folha de tapes]
  B --> C[Exporta: estado do display = pendente]
  C --> D[Histórico: anexar PDF/TXT do display]
  D --> E[estado = anexada e PDF final com o display no fim]
  C -->|3+ dias sem anexar| F[marcada «em atraso»]
```

---

## 5. Retornos de cobranças

```mermaid
flowchart TD
  A[Ficha: processamento de ficheiro de cobrança] --> B[Retorno registado<br/>esperado no dia útil seguinte]
  B --> C{Hoje vs. esperado}
  C -->|dentro do prazo| D[Pendente]
  C -->|1–2 dias úteis de atraso| E[Atrasado]
  C -->|> 2 dias úteis de atraso| F[URGENTE]
  D & E & F --> G[Marcar enviados — um ou vários + observações]
  D & E & F --> H[Ajustar prazo à mão — fica registado]
  G --> I[(retorno_enviado + data)]
```

Contador de pendentes na barra lateral; feriados de Cabo Verde contam como não úteis.

---

## 6. Geradores PS2 / OIC

```mermaid
flowchart TD
  A[Folha de salários / pagamentos] --> B{Entrada}
  B -->|Colar do Excel| C[Colunas detetadas sozinhas<br/>Tab escreve separador]
  B -->|Carregar .xlsx| D[Escolhe a folha<br/>folhas ocultas ignoradas]
  C & D --> E[Pré-visualização]
  E --> F{Problemas?}
  F -->|linha em alerta / erro| G[Editar na linha · excluir · corrigir no Excel]
  G --> E
  F -->|não| H[Gerar ficheiro]
  H --> I[Nome editável, extensão .txt fixa]
  I --> J[Guardar como nativo]
  J --> K[PS2: regista o lote para verificação]
```

- **PS2** (contas BCA): conversão de contas para NIB e natureza; outros bancos ficam de fora.
- **OIC** (outros bancos): só NIB; NIBs do BCA ficam fora (vão pelo PS2); várias folhas juntas.
- Em ambos, a correção na linha só vale para o ficheiro gerado — o Excel de origem não muda.

### 6.1 Verificar Débitos/Créditos

```mermaid
sequenceDiagram
  participant A as Turno A (gera)
  participant S as SCI
  participant B as Turno B (verifica)
  participant C as Core bancário
  A->>S: guarda o PS2 (ficheiro SAEMPRSETA…)
  S-->>S: regista conta, valor, nº de registos, hash, sentido
  Note over S: ficheiro repetido (mesmo hash) = aviso
  B->>S: abre "Verificar Débitos/Créditos"
  B->>B: copia conta e valor
  B->>C: confere: um débito/crédito do valor (dois = duplicado)
  B->>S: marca "Verificado"
  S-->>S: guarda quem, quando, e se foi a mesma pessoa
```

---

## 7. Renovação de cartões

```mermaid
flowchart TD
  A[Export do banco: balcão + nº de cartão] --> B[Importar]
  B --> C{Linhas inválidas?}
  C -- sim --> D[Assinaladas, nunca descartadas]
  C -- não --> E
  D --> E[Sessão partilhada na base de dados]
  E --> F[Escolher balcões]
  F --> G[Gerar lote até 490 cartões<br/>RPC atómica no servidor]
  G --> H[Descarregar .prn: nº a 7 dígitos por linha]
  H --> I{Há pendentes?}
  I -- sim --> F
  I -- não --> J[Terminar sessão]
```

Garantia: um cartão não entra em dois lotes nem fica sem lote; duas pessoas a gerar em simultâneo não se
sobrepõem (bloqueio na sessão).

---

## 8. Passagem de turno

```mermaid
flowchart LR
  A[Turno que sai deixa nota<br/>por data e turno] --> B[(entrada nova — nada se reescreve)]
  B --> C[Turno que entra vê «por ler»]
  C --> D[Cada pessoa confirma a leitura<br/>fica quem e quando]
  D --> E[Arquivar uma ou todas]
  E --> F[Histórico: filtros por data, turno e texto]
```

---

## 9. Administração de utilizadores

### 9.1 Criar um utilizador

```mermaid
sequenceDiagram
  participant Adm as Administrador
  participant App as SCI (Configurações → Utilizadores)
  participant F as Função admin-utilizadores
  participant P as Pessoa
  Adm->>App: nome, email, utilizador (= código de operador)
  App->>F: criar (JWT do administrador)
  F->>F: confirma que é administrador
  F-->>App: conta criada, ligada ao operador, + link (24 h, uso único)
  Adm->>P: envia o link (mensagem pronta para copiar)
  P->>App: abre o link, escolhe a senha
  Note over P,App: ninguém conhece a senha
```

### 9.2 Senha esquecida — três caminhos

```mermaid
flowchart TD
  X([Esqueceu a senha]) --> Q{Há administrador à mão?}
  Q -- sim --> A1["Novo link<br/>(ninguém vê a senha)"]
  Q -- sim --> A2["Repor senha<br/>(senha temporária, trocada ao entrar)"]
  Q -- não --> B["Esqueceu a senha? no login<br/>utilizador + PIN + senha nova"]
  B --> L{5 falhas em 24 h?}
  L -- sim --> BL[Bloqueado 24 h → pedir ao administrador]
  L -- não --> OK[Senha reposta + registo visível ao administrador]
  A1 & A2 & OK --> E([Entra])
  Z[Único administrador esquece a senha] --> Y[Outro administrador, ou criar-utilizador.sh no servidor]
```

### 9.3 Tornar administrador / eliminar

- **Admin** (caixa): precisa de operador ligado; nunca deixa o sistema sem administrador.
- **Eliminar**: confirmação; a conta e o PIN desaparecem; o **operador, as fichas e o histórico ficam**.
  Pode criar-se de novo o mesmo utilizador (liga-se ao mesmo operador).

---

## 10. Alertas de hora certa

```mermaid
flowchart TD
  A[(daily_alerts: hora, nome, dias)] --> B[Relógio do browser]
  B -->|chega a hora, dia útil| C[Aviso no ecrã em qualquer página]
  C --> D[Já feito → guarda neste posto, por dia]
  C --> E[Adiar 10 min → volta a avisar]
  B --> F[Início: próximo alerta + contagem decrescente]
```

---

## 11. Estatísticas

`file_processes` (preenchida a partir da tabela de processamentos da ficha) → filtro de datas → barras por
mês e por tipo (salário, cobranças, compensação) → tabela detalhada → exportar XLSX / PDF.

---

## 12. Atualização do sistema (deploy)

```mermaid
flowchart LR
  W[PC com WiFi] -->|git pull| R[(repositório local)]
  R --> C[PC com cabo]
  C -->|deploy-producao.cmd| S[(Servidor)]
  S --> B[backup] --> M[migrações em falta] --> U[funções + nginx + auth] --> P[publicar] --> K[confirmar]
```

Detalhes técnicos em [TRD §9](02-TRD.md).
