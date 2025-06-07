# AI Flashcards

> 🧠 AI-powered web application for generating and learning programming flashcards with spaced repetition

## Table of Contents

- [Description](#description)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Description

AI Flashcards is a modern web application that revolutionizes the way developers learn programming concepts. By leveraging AI technology, it instantly generates high-quality flashcards from pasted text content, eliminating the tedious manual creation process.

### Key Features

- 🤖 **AI-Powered Generation**: Create up to 10 flashcards from text content (up to 2,000 characters) using advanced AI models
- 📚 **Spaced Repetition**: Built-in Leitner 3-box system (1d, 3d, 7d intervals) for optimal learning retention
- ✋ **Manual Control**: Full CRUD operations for flashcards with accept/reject functionality for AI suggestions
- 👤 **User Management**: Secure authentication with email verification and account management
- 📊 **Progress Tracking**: Daily review limits (50 cards/day + 20 catch-up) with detailed statistics
- 📱 **Accessibility**: WCAG AA compliant design with desktop-first responsive UI

### Problem Solved

Manual flashcard creation is time-consuming and discouraging, leading to lower knowledge retention and reduced engagement in learning new technologies. AI Flashcards minimizes creation time, allowing users to focus on consistent study habits.

## Tech Stack

### Frontend

- **Astro 5** - Static rendering with interactive islands
- **React 19** - UI components with modern hooks and Server/Client patterns
- **TypeScript 5** - Strict typing and enhanced developer experience
- **Tailwind CSS 4** - Utility-first styling framework with WCAG AA compliance
- **shadcn/ui** - Accessible React components built on Radix UI

### Backend

- **Supabase**
  - PostgreSQL database with Row Level Security (RLS)
  - Supabase Auth (email + OAuth, password policy ≥12 chars)
  - Edge Functions for AI logic, SRS algorithms, and cron jobs
  - Storage for future file uploads

### AI Integration

- **Openrouter.ai**
  - Default model: GPT-4o-Mini (~$0.003/1k tokens)
  - Financial limits: $10/month with 80% usage alerts
  - Model swapping capability without code changes

### CI/CD & Infrastructure

- **GitHub Actions** - Automated pipeline: lint → unit tests → e2e tests → Docker build → deployment
- **DigitalOcean App Platform** - Container runtime hosting
- **Docker** - Containerized deployment
- **DigitalOcean Container Registry** - Private image storage

### Monitoring & Analytics

- **Sentry** - Error tracking and performance monitoring
- **Grafana/Metabase** - KPI tracking and cost monitoring

## Getting Started

### Prerequisites

- **Node.js**: v22.14.0 (use `.nvmrc` for version management)
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/10devscards.git
   cd 10devscards
   ```

2. **Install Node.js version**

   ```bash
   nvm use  # Uses version from .nvmrc
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Configure your Supabase and Openrouter API keys
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**

   ```
   http://localhost:4321
   ```

### Development Setup

The project uses several development tools for code quality:

- **ESLint** - Code linting with TypeScript and React support
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit checks
- **lint-staged** - Run linters on staged files

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run astro` | Run Astro CLI commands |
| `npm run lint` | Run ESLint on the codebase |
| `npm run lint:fix` | Run ESLint and automatically fix issues |
| `npm run format` | Format code with Prettier |

## Project Scope

### Core Functionality

1. **AI Flashcard Generation**
   - Process text input up to 2,000 characters
   - Generate maximum 10 flashcards per request
   - ~100 tokens per flashcard with 5-second generation time

2. **Learning System**
   - Leitner 3-box spaced repetition algorithm
   - Daily review limit of 50 cards + 20 catch-up
   - Automatic scheduling based on user performance

3. **User Management**
   - Email/password authentication with Supabase Auth
   - Age verification (≥16 years) for GDPR compliance
   - Account export and deletion capabilities

4. **Content Management**
   - Full CRUD operations for flashcards
   - Accept/reject workflow for AI-generated content
   - Manual flashcard creation and editing

5. **Administration**
   - Budget monitoring with 80% usage alerts
   - Automatic AI generation blocking at 100% budget
   - KPI tracking and cost optimization

### MVP Limitations

- **No mobile applications** - Web-only experience
- **No file imports** - Text input only (no PDF/DOCX support)
- **No sharing features** - Individual user accounts only
- **Basic SRS algorithm** - Simple Leitner system vs. advanced algorithms
- **Limited integrations** - No external educational platform connections

### Success Metrics

- **AI Acceptance Rate**: ≥75% of generated flashcards accepted
- **AI Usage**: ≥75% of new flashcards created by AI
- **User Retention**: ≥50% Monthly Active Users with ≥3 sessions/week
- **Cost Efficiency**: ≤$10/month LLM costs
- **Reliability**: ≥99% backend uptime

## Project Status

![Development Status](https://img.shields.io/badge/status-in%20development-yellow)
![Version](https://img.shields.io/badge/version-0.0.1-blue)
![Node Version](https://img.shields.io/badge/node-22.14.0-green)

### Current Phase: MVP Development

**Completed:**

- ✅ Project structure and development environment
- ✅ Core tech stack configuration (Astro + React + TypeScript)
- ✅ UI component library setup (shadcn/ui + Tailwind)
- ✅ Development tooling (ESLint, Prettier, Husky)

**In Progress:**

- 🔄 Supabase integration and database schema
- 🔄 Authentication system implementation
- 🔄 AI integration with Openrouter.ai
- 🔄 Core flashcard CRUD functionality

**Upcoming:**

- 📋 Spaced repetition algorithm implementation
- 📋 User dashboard and statistics
- 📋 Admin panel and monitoring
- 📋 CI/CD pipeline setup
- 📋 Production deployment

### Roadmap

**Phase 1: Core MVP** (Current)

- Basic flashcard generation and learning system
- User authentication and data management
- Essential accessibility features

**Phase 2: Enhanced Features**

- Advanced analytics and progress tracking
- Improved AI model integration
- Performance optimizations

**Phase 3: Scale & Polish**

- WCAG AAA compliance
- High contrast mode
- API rate limiting and optimization
- Advanced monitoring and alerting

## License

This project is currently under development. License information will be updated before the first public release.

---

**Contributing:** This project is in active development. Contribution guidelines will be available soon.

**Support:** For questions or issues, please check the project documentation or create an issue in the repository.
