# Overview

DocuMind AI is a code documentation generator that analyzes GitHub repositories and automatically creates comprehensive documentation using AI. The application features a full-stack architecture with React frontend and Express.js backend, designed to parse code repositories, extract structural information, and generate README files, API documentation, and inline code comments through OpenAI integration.

<img width="1657" height="976" alt="Screenshot 2025-08-22 at 1 21 43 AM" src="https://github.com/user-attachments/assets/515b0a85-b34b-43ad-a410-296f11ab5cec" />

<img width="1658" height="979" alt="Screenshot 2025-08-22 at 1 22 24 AM" src="https://github.com/user-attachments/assets/8c3f7845-2d0b-420f-973d-e5641b653e61" />


# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with custom GitHub-inspired color scheme and design tokens
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation through @hookform/resolvers

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Defined in shared directory for type consistency between frontend and backend
- **API Pattern**: RESTful endpoints with structured error handling and request logging middleware
- **Development**: Hot module replacement through Vite integration for seamless development experience

## Data Storage Solutions
- **Database**: PostgreSQL configured through Neon Database (serverless PostgreSQL)
- **ORM**: Drizzle with migrations stored in `/migrations` directory
- **Schema Design**: Three main entities:
  - `repositories`: Store GitHub repo metadata and analysis status
  - `documentations`: Generated documentation content (README, API docs, comments)
  - `analysisJobs`: Track background processing status and progress
- **Fallback Storage**: In-memory storage implementation for development/testing scenarios

## External Dependencies

### Third-Party Services
- **GitHub API**: Repository data fetching, file tree traversal, and content retrieval
- **OpenAI API**: AI-powered content generation for documentation, comments, and code quality analysis
- **Neon Database**: Serverless PostgreSQL hosting for production data persistence

### Key Libraries
- **AST Parsing**: Babel parser ecosystem (@babel/parser, @babel/traverse, @babel/types) for JavaScript/TypeScript code analysis
- **UI Framework**: Complete Radix UI component suite for accessible, unstyled primitives
- **Development Tools**: ESBuild for production bundling, TypeScript for type safety, Tailwind for utility-first styling
- **Authentication**: Prepared for session management with connect-pg-simple (PostgreSQL session store)

### GitHub Integration
- **Repository Analysis**: URL parsing, metadata extraction, and file structure mapping
- **Content Processing**: Recursive file tree traversal with type-aware parsing for different programming languages
- **Rate Limiting**: Built-in handling for GitHub API rate limits with appropriate error messaging

### AI Processing Pipeline
- **Code Parsing**: Multi-language AST analysis supporting JavaScript, TypeScript, and Python
- **Documentation Generation**: Context-aware README creation, API documentation extraction, and intelligent comment suggestions
- **Quality Analysis**: Automated code quality assessment with scoring metrics and improvement recommendations
