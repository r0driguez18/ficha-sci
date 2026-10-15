# UI/UX Design

**Produto:** SCI — Sistema de Controlo Interno · **Versão:** 2.0 · **Data:** 2026-10-15

Complementa o [PRD](01-PRD.md) e o [App Flow](04-App-Flow.md). Contraste medido em
[contraste.md](contraste.md).

---

## 1. Princípios

| Princípio | Em prática |
|---|---|
| **Fiel ao papel** | A ficha digital mantém a ordem e as secções da ficha oficial. Quem conhece o papel reconhece o ecrã. |
| **Pensado para o turno da noite** | Leitura confortável, contraste elevado, três temas (claro, escuro, alto contraste). |
| **Nunca perder trabalho** | Gravação automática visível ("Guardado às HH:MM"); nada exige carregar em "Guardar". |
| **A ação certa à vista** | Um botão principal por contexto ("Exportar e guardar"); ações perigosas pedem confirmação, com o foco em "Cancelar". |
| **Sem *hover* obrigatório** | Nada essencial só aparece ao passar o rato; tudo é visível ou acessível por clique/teclado. |
| **Honesto sobre os erros** | Linhas inválidas ficam assinaladas e corrigíveis, nunca descartadas em silêncio; mensagens dizem o que fazer a seguir. |
| **Pouco ruído** | Estados vazios com ícone, título e ajuda; sem decoração que não informe. |
| **Português de Portugal, por "tu"** | "Escolhe", "Abre", "Pede ao administrador" — voz única em toda a app. |

---

## 2. Identidade visual e *design tokens*

Todas as cores são **tokens semânticos** (variáveis CSS em `src/index.css`); nenhum componente usa cor fixa.

### 2.1 Cor

| Token | Tema claro | Papel |
|---|---|---|
| `--primary` | `216 100% 28%` (azul institucional ≈ `#00398F`) | Ação principal, links, foco, item ativo |
| `--background` / `--foreground` | `210 33% 98%` / `222 47% 11%` | Fundo e texto |
| `--muted-foreground` | `215 20% 42%` | Texto secundário |
| `--success` | `142 72% 29%` | Sucesso, "ok", verificado |
| `--warning` | `38 92% 50%` | Avisos (nunca como texto pequeno) |
| `--destructive` | `354 74% 44%` | Erros, ações destrutivas |
| `--info` | `204 94% 94%` | Informação de fundo |
| `--border` / `--input` | `214 26% 85%` / mais escuro | Bordas e campos |
| `--sidebar-*` | Azul escuro (`216 100% 18%`), item ativo e destaque | Barra lateral |
| `--radius` | `0.75rem` | Arredondamento base |

> O requisito original pedia o azul `#0066B3`; o token efetivo é mais escuro para cumprir **WCAG AA**
> em texto e componentes (ver [contraste.md](contraste.md)).

### 2.2 Temas

| Tema | Como se aplica | Notas |
|---|---|---|
| **Claro** (predefinido) | — | Fundo cinza muito claro, texto quase preto |
| **Escuro** | classe `.dark` na raiz | Para o turno da noite |
| **Alto contraste** | classes `.dark` + `.hc` | Bordas 5–6:1, foco amarelo |

- Escolha em `ThemeToggle` (cabeçalho); guardada no browser (`sci-theme`).
- Os gráficos (Recharts) lêem o tema (`isDarkMode`) e usam as cores adequadas.

### 2.3 Tipografia

- **Inter** (self-hosted, `@fontsource/inter`, subconjunto latino), com *fallback* `system-ui, Segoe UI…`.
- Monoespaçada (`ui-monospace, Consolas…`) para NIBs, contas, nomes de ficheiros e hashes.
- Títulos de página `text-2xl`; secção `text-base/lg`; apoio `text-sm` / `text-xs` em `muted-foreground`.
- Números tabulares (`tabular-nums`) em valores monetários e contadores.

### 2.4 Espaçamento e largura

`PageContainer` fixa a largura de leitura por página, para a navegação não "saltar":

| Tamanho | Largura máx. | Usado em |
|---|---|---|
| `narrow` | 3xl | Formulários de coluna única |
| `default` | 5xl | Geradores, Passagem de Turno, Configurações, Documentação |
| `wide` | 7xl | Tabelas largas: Histórico, Estatísticas, Verificação |

---

## 3. Estrutura da aplicação (*shell*)

```
┌──────────────┬────────────────────────────────────────────────────────┐
│  BCA – SCI   │  ☰  Início / Ficha de Procedimentos     [alerta] …  [tema] [nome · turno] [Sair] │
│              ├────────────────────────────────────────────────────────┤
│ Início       │  ⚠ banner "sem ligação ao servidor" (só quando aplicável)                       │
│ ── SCI ──    │                                                        │
│ Ficha …      │   Título da página              [ações]                │
│ Histórico    │   subtítulo                                            │
│ Retornos (n) │   ┌────────────────────────────────────────────┐       │
│ Passagem     │   │ conteúdo (cartões / tabelas / formulários) │       │
│ Verificar (n)│   └────────────────────────────────────────────┘       │
│ ─ Ferramentas│                                                        │
│ Geradores    │                                                        │
│ Cartões      │                                                        │
│ Estatísticas │                                                        │
│ ── Sistema ──│                                                        │
│ Config.      │                                                        │
│ Documentação │                                                        │
└──────────────┴────────────────────────────────────────────────────────┘
```

| Elemento | Comportamento |
|---|---|
| **Barra lateral** | À esquerda; menu **plano** (1 nível) com rótulos de grupo; recolhe para ícones (tooltip); **um só** botão de recolher (no cabeçalho). Contadores à direita (retornos, ficheiros por verificar). |
| **Cabeçalho** | Breadcrumbs, data e turno atual, tema, nome do operador, Sair. Fixo ao scroll. |
| **Paleta de comandos** | `Ctrl+K`: pesquisar e saltar para qualquer página; `↑/↓`, `Enter`. |
| **Banner do servidor** | Aparece quando o servidor não responde; some sozinho ao recuperar. |
| **Alertas de hora certa** | Aviso no ecrã em qualquer página, com "Já feito" / "Adiar 10 min". |

---

## 4. Componentes e padrões

### 4.1 Biblioteca

shadcn/ui sobre Radix: `Button`, `Card`, `Input`, `Textarea`, `Select`, `Checkbox`, `Tabs`, `Table`, `Dialog`,
`Tooltip`, `Popover`, `Badge`, `Alert`, `Skeleton`, `Sheet`, `Sidebar`. Próprios: `PageContainer`, `PageHeader`,
`ConfirmDialog`, `EmptyState`, `LoadingState`, `CommandPalette`, `PinDialog`.

### 4.2 Padrões recorrentes

| Padrão | Descrição | Onde |
|---|---|---|
| **Estado de gravação** | Distintivo "Guardado às HH:MM / a guardar / erro" | Ficha |
| **Progresso** | Contador no separador do turno + barra; "Próxima por marcar" | Ficha |
| **Confirmação destrutiva** | `ConfirmDialog`, foco no "Cancelar", botão vermelho com verbo claro | Limpar ficha, eliminar conta, repor senha |
| **Assinatura por PIN** | Diálogo de 4 dígitos, mensagem de erro sem revelar detalhes | Ficha; Configurações |
| **Edição na linha** | Lápis → campos na própria linha; Enter guarda, Esc cancela; marca "editada" e permite repor | Geradores PS2/OIC |
| **Copiar com um clique** | Conta e valor copiáveis a partir da tabela | Verificar Débitos/Créditos |
| **Contador no menu** | Número em vermelho à direita; o texto reserva espaço para não ficar por baixo | Retornos, Verificação |
| **Estado vazio** | Ícone + título + o que fazer | Todas as listas |
| **Mostrar uma vez** | Dados sensíveis (link, senha temporária) aparecem num diálogo, com "Copiar" | Administração |
| **Tab nos campos de colagem** | Tab escreve separador; Esc + Tab sai do campo | Geradores |

### 4.3 Estados e feedback

- **Toasts** (sonner) para resultado de ações; **alertas inline** para erros de formulário.
- Carregamento com `LoadingState` / *skeletons*; falhas de rede com mensagem que diz o que fazer.
- Botões desativados durante a ação (evita duplo clique).

---

## 5. Inventário de ecrãs

| Ecrã | Rota | Propósito | Elementos-chave |
|---|---|---|---|
| **Login** | `/auth/login` | Entrar | Utilizador, senha, "Esqueceu a senha?" |
| **Esqueceu a senha** | (no login) | Repor com PIN | Utilizador, PIN, senha nova ×2 |
| **Definir senha** | `/auth/definir-senha` | Troca obrigatória | Senha nova ×2, Sair |
| **Link de senha** | `/reset-password` | Definir senha pelo link | Senha nova ×2 |
| **Início** | `/dashboard` | "Hoje em resumo" | Ficha de hoje, próximo alerta, acessos, alertas do dia |
| **Procedimentos** | `/sci/procedimentos` | Entrada para as fichas | Escolha da variante |
| **Ficha (dia útil / não útil)** | `/sci/taskboard`, `/sci/taskboard-dia-nao-util` | Preencher e assinar | Separadores por turno, secções, tabela de processamentos, assinatura, "Exportar e guardar", tapes |
| **Histórico de Fichas** | `/sci/historico-fichas` | Consultar arquivo | Filtros, PDF, anexar display |
| **Retornos de Cobranças** | `/sci/retornos-cobrancas` | Prazos | Lista com SLA, marcar enviados, ajustar prazo |
| **Passagem de Turno** | `/sci/passagem-turno` | Notas entre turnos | Atual / Histórico, confirmar leitura, arquivar |
| **Verificar Débitos/Créditos** | `/sci/verificacao-ficheiros` | Conferir ficheiros PS2 | Tabela, conta/valor copiáveis, caixa "Verificado" |
| **Geradores PS2 / OIC** | `/sci/geradores` | Gerar ficheiros bancários | Separadores PS2 / OIC, colar ou carregar, pré-visualização editável |
| **Renovação de Cartões** | `/sci/renovacao-cartoes` | Lotes `.prn` | Importar, balcões, lotes gerados, terminar |
| **Estatísticas** | `/easyvista/estatisticas` | Evolução dos processamentos | Filtro de datas, gráfico, tabela, exportar |
| **Configurações** | `/settings` | Conta | Operador, PIN, **Utilizadores** (administradores) |
| **Documentação** | `/docs` | Ajuda | Uma secção por área |
| **404** | `*` | Rota inexistente | Voltar ao início |

---

## 6. A ficha de procedimentos (ecrã central)

```
┌ Ficha de Procedimentos                       [Guardado às 02:14] ┐
│ [ Turno 1  3/22 ] [ Turno 2  0/18 ] [ Turno 3  7/30 ]           │
│ ─ Turno 3 ──────────────────────────────────────────────────── │
│ Operador [▼]   Entrada [  ]   Saída [  ]                         │
│ ▸ Operações do Fecho do Dia                                      │
│   ☐ Início do fecho            [hora]                            │
│   ☐ …                                                            │
│ ▸ Bloco Mensal / Impressões   (colapsáveis, só no Turno 3)       │
│ Observações [ ................................................ ] │
│ Processamentos: Hora | Tarefa | AS400 | Nº operação | Por | Tipo │
│ ─ Verificação de Tapes (dia não útil e fim de mês) ───────────── │
│ ─ Assinatura ───────────────────────────────  [Assinar com PIN ] │
│ [ Limpar ]                              [ Exportar e guardar ]   │
└──────────────────────────────────────────────────────────────────┘
```

- Os turnos são **separadores** com progresso; o dia não útil só mostra o Turno 3.
- **Assinada** a ficha, "Limpar" fica bloqueado; para desistir: "Remover assinatura".
- O PDF mantém **"CENTRO INFORMÁTICA"** e **"DSI-CI/…"**, sem logótipo, com layout por turno.

---

## 7. Acessibilidade

| Critério | Estado |
|---|---|
| Contraste WCAG AA (texto e componentes) | Cumprido nos 3 temas (exceções documentadas: bordas subtis ~1.4:1; vermelho do escuro ~3.9:1) |
| Teclado | Navegação completa; foco visível; atalho `Ctrl+K`; Enter/Esc nas edições na linha |
| Etiquetas | Campos com `label` associado; botões só-ícone com `aria-label` |
| Primitivos | Radix UI (diálogos com *focus trap*, *roles* e estados corretos) |
| Movimento | Animações curtas; sem dependência de animação para perceber o estado |
| Rede lenta/offline | Shell em cache; avisos claros |

**A melhorar:** teste com leitor de ecrã e revisão das tabelas largas em ecrãs pequenos.

---

## 8. Responsividade

- Otimizado para **monitores de secretária** (uso em turno); a barra lateral recolhe e os cabeçalhos quebram.
- Tabelas largas têm *scroll* horizontal contido (nunca da página inteira).
- Não há app móvel nativa (fora de âmbito).

---

## 9. Conteúdo e tom

- **Tratamento por "tu"**, frases curtas, verbo no imperativo ("Escolhe a palavra-passe").
- **Erros**: dizem o que aconteceu e o que fazer ("Pede ao administrador um link novo").
- **Segurança**: mensagens neutras onde revelar detalhes seria um risco ("Utilizador ou PIN incorretos").
- **Números**: formato `pt-PT` (`1 250 000,00`); datas `AAAA-MM-DD` nos dados e `dd/mm/aa` na leitura.
- Nomes de ficheiros de salários seguem a convenção `SA` + empresa + mês + letra (ex.: `SAEMPRSETA`).
