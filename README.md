
# BCA - SCI — Sistema de Controlo Interno

## Sobre o projeto

Aplicação web de apoio ao turno do Centro Informática. Corre numa rede
isolada (sem Internet em produção), em português de Portugal, sobretudo
em turno noturno. Cobre:

- Ficha de procedimentos do turno (com assinatura eletrónica e exportação em PDF)
- Histórico de fichas e verificação de tapes / display
- Retornos de cobranças, com prazo (SLA) em dias úteis
- Passagem de turno (histórico de notas + confirmação de leitura por pessoa)
- Gerador de ficheiro PS2 a partir da folha de salários
- Estatísticas dos processamentos de ficheiros

Funciona como PWA: o *shell* fica em cache, por isso a aplicação abre
mesmo com o Supabase em baixo (mostra um aviso e recupera sozinha).

## Stack Tecnológica

### Frontend Core
- **React** 18.3.1 - Biblioteca JavaScript para construção de interfaces
- **TypeScript** 5.5.3 - Superset tipado do JavaScript
- **Vite** 5.4.1 - Build tool e dev server ultrarrápido
- **React Router DOM** 6.26.2 - Roteamento client-side

### Styling & UI Components
- **Tailwind CSS** 3.4.11 - Framework CSS utility-first
- **shadcn/ui** - Componentes de UI baseados em Radix UI
- **Radix UI** - Primitivos de UI acessíveis e não estilizados
- **Lucide React** 0.462.0 - Biblioteca de ícones
- **@fontsource/inter** 5.1.0 - Tipo de letra Inter alojado localmente (a rede isolada não tem Google Fonts)
- Temas (claro / escuro / alto contraste): gestão própria em `src/hooks/use-theme.tsx`

### Backend & Database
- **Supabase** (Self-hosted via Docker) - Plataforma backend completa
  - PostgreSQL - Base de dados relacional
  - PostgREST - API REST automática
  - GoTrue - Sistema de autenticação
  - Storage - Armazenamento de ficheiros
  - Edge Functions - Funções serverless
- **@supabase/supabase-js** 2.49.4 - Cliente JavaScript para Supabase

### State Management & Data Fetching
- **TanStack Query (React Query)** 5.56.2 - Gestão de estado assíncrono e cache
- **React Hook Form** 7.53.0 - Gestão de formulários
- **Zod** 3.23.8 - Validação de schemas TypeScript-first

### Data Visualization & Processing
- **Recharts** 2.12.7 - Biblioteca de gráficos para React
- **date-fns** 3.6.0 - Manipulação de datas
- **xlsx** 0.18.5 - Leitura e escrita de ficheiros Excel
- **jsPDF** 3.0.1 + **jspdf-autotable** 5.0.2 - Geração de PDFs
- **pdf-lib** 1.17.1 - Anexar o display de tapes ao PDF da ficha (import dinâmico)

### Utilities & UI Enhancement
- **class-variance-authority** 0.7.1 - Gestão de variantes de componentes
- **clsx** 2.1.1 + **tailwind-merge** 2.5.2 - Merge de classes Tailwind
- **sonner** 1.5.0 - Toast notifications elegantes
- **vite-plugin-pwa** 0.20.5 - Service worker / precache do *shell* (funcionamento offline)

## Executando o Projeto

Para iniciar o projeto localmente:

```sh
# Passo 1: Clone o repositório
git clone <URL_DO_REPOSITÓRIO>

# Passo 2: Navegue até a pasta do projeto
cd <NOME_DO_PROJETO>

# Passo 3: Instale as dependências
npm i

# Passo 4: Inicie o servidor de desenvolvimento
npm run dev
```

## Módulos do Sistema

O sistema está dividido nos seguintes módulos:

O menu é plano, agrupado por:

- **SCI**
  - Ficha de Procedimentos (por turno; assinatura por PIN; verificação de tapes nos dias não úteis e no fim do mês)
  - Histórico de Fichas (visão de equipa, filtros, anexar display de tapes)
  - Retornos de Cobranças (SLA em dias úteis; > 2 dias úteis de atraso = urgente)
  - Passagem de Turno (histórico de notas por turno; cada pessoa confirma a leitura de cada nota)
- **SCI** (continuação)
  - Verificar Débitos/Créditos (cada PS2 guardado no gerador fica registado; o turno seguinte confere o débito/crédito no core e marca "verificado")
- **Ferramentas**
  - Geradores PS2 / OIC (um separador por gerador: PS2 — folha de salários → NIB → `PS2_AAAAMMDD.txt`; OIC — pagamentos interbancários → `Interbancario_AAAAMMDD.txt`, 135 caracteres/linha, ANSI)
  - Estatísticas (evolução mensal dos processamentos; exportar XLSX/PDF)
- **Sistema**: Configurações, Documentação

Nota: os **Geradores PS2 / OIC** estão no grupo *Ferramentas* mas a rota é `/sci/geradores` (a antiga `/sci/gerador-ps2` redireciona para o separador PS2).

## Estrutura do Projeto

```
├── src/
│   ├── components/
│   │   ├── auth/                 # Componentes de autenticação
│   │   ├── charts/               # Gráficos e tabelas
│   │   ├── layout/               # Layout do dashboard e componentes UI
│   │   ├── taskboard/            # Componentes para o taskboard
│   │   ├── tasks/                # Componentes relacionados a tarefas
│   │   └── ui/                   # Componentes de UI reutilizáveis
│   ├── hooks/                    # Custom React hooks
│   ├── integrations/             # Integrações com serviços externos
│   │   └── supabase/             # Cliente e tipos para Supabase
│   ├── lib/                      # Utilidades e funções auxiliares
│   ├── pages/                    # Páginas principais da aplicação
│   │   ├── auth/                 # Páginas de autenticação
│   │   ├── easyvista/            # Páginas de processamentos e estatísticas
│   │   └── sci/                  # Páginas do Sistema de Controle Interno
│   ├── routes/                   # Configurações de rotas
│   ├── services/                 # Serviços para interação com APIs
│   ├── types/                    # Definições de tipos TypeScript
│   └── utils/                    # Funções utilitárias
│       └── pdf/                  # Utilitários para geração de PDFs
├── public/                       # Arquivos estáticos públicos
└── README.md                     # Documentação do projeto
```

## Configuração CSS

O projeto utiliza Tailwind CSS para estilização. A configuração principal encontra-se em:

- `tailwind.config.ts` - Configuração do Tailwind
- `src/index.css` - Importações e definições base de CSS

## Autenticação

O sistema utiliza o Supabase para autenticação de usuários. A configuração está em:
- `src/integrations/supabase/client.ts`

## Rotas

As rotas da aplicação estão organizadas por módulos:
- `src/routes/sciRoutes.tsx` - Rotas do módulo SCI
- Outras rotas são definidas diretamente no App.tsx

## Funcionalidades principais

### Ficha de procedimentos
Duas variantes, escolhidas pela data:
- Dia Útil
- Dia Não Útil (inclui o Procedimento Verificação de Tapes; também aparece no último dia do mês)

Grava automaticamente, exporta em PDF (`FD DD.MM.AA.pdf`) e só permite o
download depois de o display de tapes estar anexado, quando aplicável.

### Ferramentas de apoio
- `node scripts/contrast-audit.mjs` — auditoria de contraste WCAG dos temas (ver `docs/contraste.md`).


## Boas Práticas de Desenvolvimento

1. **Componentes Reutilizáveis**: Criar componentes modulares em `/components`
2. **Tipagem**: Utilizar TypeScript para garantir tipo-segurança
3. **Hooks Personalizados**: Extrair lógica complexa em hooks customizados
4. **Responsividade**: Design responsivo utilizando Tailwind CSS

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm run preview` - Visualiza a build de produção localmente

## Deploy para produção

O servidor de produção é Ubuntu + nginx + Supabase em Docker, numa rede sem Internet: o build faz-se numa máquina que alcança o servidor e envia-se por SSH. Um só comando faz tudo (a partir da pasta do projeto, em PowerShell):

```powershell
.\production\deploy\deploy-sci.ps1
```

Ou, com duplo-clique (a janela fica aberta no fim, mesmo se der erro): `deploy-producao.cmd`, na raiz do projeto. Um `.ps1` aberto com duplo-clique fecha a janela mal termina — por isso não se abre assim.

**Duas redes:** o GitHub só se alcança na rede com Internet (WiFi) e o servidor só na rede interna (cabo). O script aguenta as duas: antes de tudo confirma que o servidor está ao alcance (senão pede para ligar o cabo); tenta o `git pull` com 30 s de limite e, sem GitHub, usa a versão que já está na pasta (e diz qual); só corre `npm install` se as dependências mudaram. Fluxo normal: no WiFi vem a versão nova (`git pull`), depois liga-se o cabo e corre-se o deploy.

Faz `git pull` da `main`, build, confirma que o build aponta para o servidor (e não para `localhost:8000`), envia o `dist` e as migrações e corre no servidor o `aplicar-no-servidor.sh` (backup, migrações em falta, publicar, recarregar o nginx, confirmar). Pede confirmação antes de mexer no servidor. `-SoVerificar` só faz o build e as verificações.

**Migrações:** o servidor guarda quais já aplicou (tabela `deploy.migracoes_aplicadas`, num schema que a API não expõe) e aplica só as que faltam, cada uma numa transação com o seu registo. Não há lista para manter à mão. Na primeira vez neste servidor usa-se `-BaselineAte` (a última migração que já lá estava); já vem por omissão no script, não é preciso escrevê-lo.

Cada deploy deixa uma linha em `~/sci-versoes.log` no servidor (data, versão, build, resultado, backup).

**Sem pedir a palavra-passe a cada passo:** instalar uma chave SSH (uma vez, no PC que faz o deploy):

```powershell
ssh-keygen -t ed25519
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh dis@172.20.11.54 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

Requisitos: `.env.production.local` na pasta (não vai para o git) e utilizador de SSH `dis` no servidor (o `sudo` continua a pedir a palavra-passe). Os scripts antigos em `production/scripts/` são de outro setup e não se aplicam.

## Administração de utilizadores

Em **Configurações → Utilizadores** (só para administradores) cria-se a conta de um colega: nome, email e **utilizador** (o que escreve no login, sem `@`; é também o código de operador, ex.: `nalves`, `etavares`, `elvisb`). A conta fica ligada ao operador com esse código e a app devolve um **link de uso único** (cerca de 1 hora) que se envia à pessoa; é ela quem escolhe a palavra-passe, ninguém a vê. "Novo link" gera outro. O caixote do lixo elimina a conta (pede confirmação): a pessoa deixa de entrar e o PIN apaga-se, mas o operador e tudo o que registou ficam. Não se eliminam a própria conta nem as de administradores.

No login escreve-se só o utilizador: `nalves` é a conta `nalves@bca.cv` (o domínio completa-se sozinho; quem quiser pode escrever o email completo, e contas de outros domínios entram com o email completo).

**Senha esquecida.** Não há recuperação por email (a rede não tem servidor de email). Há três caminhos:

1. **Link novo** (o administrador, em "Novo link"): ninguém fica a saber a senha; a pessoa escolhe a dela.
2. **Repor senha** (o administrador): gera uma senha temporária, mostrada uma só vez; a pessoa é obrigada a trocá-la ao entrar. O administrador conhece essa senha até ela ser trocada.
3. **"Esqueceu a senha?" no login**, sem o administrador: utilizador + PIN de assinatura + senha nova (função `repor-senha`). Cada conta tem **5 tentativas por 24 h**; ao fim disso fica bloqueada durante 24 h. As respostas não dizem se o utilizador existe, e cada reposição fica registada e visível aos administradores. Quem não tem PIN definido não pode usar este caminho. Para o desligar: `REPOR_SENHA_POR_PIN=false` no contentor das funções.

Na lista de utilizadores, a caixa **Admin** torna alguém administrador (precisa de operador ligado) e nunca deixa o sistema sem administrador. Se o único administrador esquecer a senha e o PIN falhar, no servidor corre-se `criar-utilizador.sh <utilizador>`, que gera um link novo para a conta existente.

A chave de administração do Supabase não pode ir para o browser, por isso isto passa por uma **função no servidor** (`supabase/functions/admin-utilizadores`), que volta a verificar em cada pedido que quem chama é administrador.

**Quem é administrador:** o operador com `papel = 'administrador'` ligado à conta. O deploy trata disto sozinho: se ainda não houver nenhum administrador, promove o operador `nalves` (desde que já tenha a conta ligada). Se não tiver, corre-se uma vez `deploy-producao.cmd -AdminEmail o.teu@email`.

**A função no servidor** (`supabase/functions/admin-utilizadores`) também é instalada pelo deploy: descobre a pasta de funções do contentor `supabase-edge-functions` e copia-a para lá. No fim verifica se o nginx encaminha `/functions/v1/` para o Kong (sem isso a app recebe um 405) e, se não encaminhar, corrige-o sozinho com `nginx-funcoes.sh`: copia o destino que o vhost já usa para `/auth/v1/`, faz cópia de segurança do ficheiro, testa com `nginx -t` e só então recarrega (se o teste falhar, repõe o original).

O GoTrue só redireciona o link para `/reset-password` se o endereço da app estiver em `GOTRUE_URI_ALLOW_LIST` (ou for o `SITE_URL`). Se não estiver, a pessoa aterra na página inicial — a troca obrigatória de palavra-passe apanha-a na mesma.

## Configuração de Base de Dados

Para alterar a configuração da base de dados Supabase:

### Ficheiros a Modificar

1. **`src/integrations/supabase/client.ts`**
   - Altere as variáveis `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` com as novas credenciais
   - As credenciais encontram-se no painel do Supabase em Settings > API

2. **`supabase/config.toml`**
   - Atualize o campo `project_id` com o ID do novo projeto

### Migrações e Verificações

3. **Execute as migrações necessárias na nova base de dados**
   - Acesse o SQL Editor no painel do Supabase
   - Execute os scripts SQL da pasta `supabase/migrations/` na ordem cronológica

4. **Verifique se as tabelas e políticas RLS estão corretas**
   - Confirme se todas as tabelas foram criadas corretamente
   - Verifique se as políticas de Row Level Security (RLS) estão ativas e configuradas adequadamente

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (React)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  React 18   │  │   Vite 5     │  │  TypeScript 5.5  │   │
│  │  Router 6   │  │  Tailwind 3  │  │   shadcn/ui      │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │ Supabase Client (@supabase/supabase-js)
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              Supabase Self-hosted (Docker)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  PostgreSQL  │  │   PostgREST  │  │  GoTrue (Auth)   │  │
│  │  (Database)  │  │  (REST API)  │  │  (JWT Tokens)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │   Storage    │  │ Edge Funcs   │                         │
│  │  (Ficheiros) │  │ (Serverless) │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## Autenticação & Segurança

- **Supabase Auth (GoTrue)** - Sistema de autenticação baseado em JWT
- **Row Level Security (RLS)** - Políticas de segurança a nível de base de dados
- **JWT Tokens** - Autenticação stateless e segura
- **Context API** - Gestão de estado de autenticação no frontend
