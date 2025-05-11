
# BCA - SCI Sistema de Controle Interno

## Sobre o Projeto

Este é um sistema administrativo para controle interno que permite gerenciar:

- Procedimentos e tarefas internas
- Processamento de dados e relatórios
- Estatísticas e análises de desempenho
- Tratamento de ficheiros e registros
- Gerador PS2 para ficheiros bancários

## Executando o Projeto

O projeto foi construído utilizando as seguintes tecnologias:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

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

## Dependências Principais

- React Router para navegação
- Tailwind CSS para estilos
- shadcn/ui para componentes de UI
- Tanstack Query para gerenciamento de estado e requisições
- Supabase para backend e autenticação
- JsPDF para geração de documentos PDF
