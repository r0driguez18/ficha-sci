
# BCA - SCI Sistema de Controle Interno

## Project Documentation

Este é um sistema administrativo para controle interno que permite gerenciar:

- Procedimentos e tarefas internas
- Processamento de dados e relatórios
- Estatísticas e análises de desempenho
- Tratamento de ficheiros e registros

## Project Structure
```
  ├── src/
  │   ├── assets/
  │   │   └── styles/
  │   │       └── main.css
  │   ├── components/
  │   │   ├── auth/
  │   │   ├── charts/
  │   │   ├── layout/
  │   │   ├── taskboard/
  │   │   ├── tasks/
  │   │   └── ui/
  │   ├── hooks/
  │   ├── integrations/
  │   │   └── supabase/
  │   ├── lib/
  │   ├── pages/
  │   │   ├── auth/
  │   │   ├── crc/
  │   │   ├── dis/
  │   │   ├── easyvista/
  │   │   └── sci/
  │   ├── services/
  │   ├── types/
  │   └── utils/
  ├── public/
  └── README.md
```

## CSS Location
The main CSS styling in this project is handled by Tailwind CSS. The global styles are located in:
- `src/index.css`

## Project Setup
1. Clone the repository
   ```sh
   git clone <URL_DO_REPOSITÓRIO>
   ```

2. Navigate to the project directory
   ```sh
   cd <NOME_DO_PROJETO>
   ```

3. Install dependencies
   ```sh
   npm install
   ```

4. Start development server
   ```sh
   npm run dev
   ```

## File Organization
- **components/** - Reusable UI components organized by feature
  - **auth/** - Authentication related components
  - **charts/** - Data visualization components
  - **layout/** - Page layouts and structural components
  - **taskboard/** - Task management components
  - **tasks/** - Task-specific components for different shifts
  - **ui/** - Shadcn UI components
- **hooks/** - Custom React hooks
- **integrations/** - Third-party service integrations
  - **supabase/** - Supabase database client and types
- **lib/** - Utility libraries and functions
- **pages/** - Page components organized by module
  - **auth/** - Authentication pages
  - **crc/** - Ficheiros treatment module
  - **dis/** - Data insertion module
  - **easyvista/** - Statistics and dashboards
  - **sci/** - Internal control system core pages
- **services/** - Service layer for API interactions
- **types/** - TypeScript type definitions
- **utils/** - Utility functions

## Módulos do Sistema

O sistema está dividido nos seguintes módulos:

- **SCI**: Sistema de Controle Interno para gerenciamento de procedimentos
- **CRC**: Tratamento de Ficheiros 
- **DIS**: Módulo para Dados e Inserção
- **Processamentos**: Estatísticas e Relatórios de processamentos

## Tecnologias Utilizadas

- Vite
- TypeScript
- React
- React Router DOM
- Tailwind CSS
- Shadcn UI
- Supabase
- React Query
- Recharts
- jsPDF
- Lucide React
- Sonner (para notificações)
- Zod (validação de esquemas)

## Funcionalidades Principais

- Autenticação e controle de acesso
- Gestão de tarefas por turnos
- Processamento de dados e relatórios
- Exportação de dados para PDF
- Dashboard e visualizações estatísticas
- Integração com banco de dados Supabase
