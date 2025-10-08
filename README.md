
# BCA - SCI Sistema de Controle Interno

## Sobre o Projeto

Este é um sistema administrativo para controle interno que permite gerenciar:

- Procedimentos e tarefas internas
- Processamento de dados e relatórios
- Estatísticas e análises de desempenho
- Tratamento de ficheiros e registros
- Gerador PS2 para ficheiros bancários

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
- **next-themes** 0.3.0 - Gestão de temas (dark/light mode)

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

### Utilities & UI Enhancement
- **class-variance-authority** 0.7.1 - Gestão de variantes de componentes
- **clsx** 2.1.1 + **tailwind-merge** 2.5.2 - Merge de classes Tailwind
- **cmdk** 1.0.0 - Command menu
- **sonner** 1.5.0 - Toast notifications elegantes

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

- **SCI**: Sistema de Controle Interno para gerenciamento de procedimentos
  - Ficha de Procedimentos
  - Taskboard de tarefas
  - Calendário
  - Gerador PS2
- **CRC**: Tratamento de Ficheiros 
- **DIS**: Módulo para Dados e Inserção
- **Processamentos**: Estatísticas e Relatórios de processamentos

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
│   │   ├── crc/                  # Páginas do módulo CRC
│   │   ├── dis/                  # Páginas do módulo DIS
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

## Funcionalidades Principais

### Taskboard
Permite o gerenciamento de tarefas diárias com diferentes visualizações:
- Dia Útil
- Dia Não Útil
- Final do Mês Dia Útil
- Final do Mês Dia Não Útil

### Calendário
Visualização de eventos e tarefas em formato de calendário.

### Gerador PS2
Ferramenta para geração de ficheiros bancários no formato PS2, com:
- Validação de NIB
- Formatação de valores
- Geração de cabeçalho e rodapé segundo as especificações oficiais

## Boas Práticas de Desenvolvimento

1. **Componentes Reutilizáveis**: Criar componentes modulares em `/components`
2. **Tipagem**: Utilizar TypeScript para garantir tipo-segurança
3. **Hooks Personalizados**: Extrair lógica complexa em hooks customizados
4. **Responsividade**: Design responsivo utilizando Tailwind CSS

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm run preview` - Visualiza a build de produção localmente

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
