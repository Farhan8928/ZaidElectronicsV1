# Zaid Electronics Job Management Portal

## Overview

This is a modern web-based job management system designed for Zaid Electronics, an electronics repair business. The application enables tracking and management of repair jobs, customer information, financial analytics, and business reporting. Built as a full-stack solution with a React frontend and Express.js backend, the system integrates with Google Sheets as the primary data storage backend, providing real-time synchronization and easy data access.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Context API with useReducer for job state management, TanStack React Query for server state and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Form Handling**: React Hook Form with Zod validation for type-safe form processing
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **Data Validation**: Drizzle-Zod schemas for consistent data validation between frontend and backend
- **Development**: Hot module replacement and runtime error overlay for improved developer experience

### Data Storage Strategy
- **Primary Storage**: Google Sheets integration via REST API for real-time data synchronization
- **Schema Definition**: Drizzle ORM with PostgreSQL dialect for type-safe database operations (prepared for future database migration)
- **Backup Storage**: In-memory storage implementation available for development and testing scenarios
- **Data Models**: Job records with customer information, device details, financial tracking (price, parts cost, profit calculation)

### UI/UX Design System
- **Design Tokens**: CSS custom properties for consistent theming across light and dark modes
- **Component Library**: Comprehensive set of reusable UI components (buttons, forms, tables, modals, charts)
- **Responsive Design**: Mobile-first approach with adaptive layouts for different screen sizes
- **Accessibility**: WCAG-compliant components with proper ARIA labels and keyboard navigation

### Business Logic Components
- **Job Management**: Complete CRUD operations for repair job tracking
- **Financial Analytics**: Automated profit calculation, revenue tracking, and business reporting
- **Search and Filtering**: Advanced job search with date range filtering and text-based queries
- **Data Export**: CSV export functionality for external reporting and backup
- **Receipt Generation**: Automated receipt creation for completed jobs

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form for form management
- **State Management**: TanStack React Query for server state, React Context for client state
- **Routing**: Wouter for lightweight client-side navigation
- **Validation**: Zod for runtime type validation, Drizzle-Zod for schema integration

### UI and Styling
- **Component Library**: Radix UI primitives for accessible base components
- **Styling**: Tailwind CSS for utility-first styling, Class Variance Authority for component variants
- **Icons**: Lucide React for consistent iconography
- **Charts**: Recharts for data visualization and business analytics

### Backend Infrastructure
- **Database**: Drizzle ORM with @neondatabase/serverless for PostgreSQL connectivity
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Development Tools**: TSX for TypeScript execution, ESBuild for production compilation

### Development and Build Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Development Experience**: Replit-specific plugins for enhanced development workflow
- **Code Quality**: TypeScript strict mode, PostCSS with Autoprefixer for CSS processing

### Third-Party Integrations
- **Google Sheets API**: Custom integration for real-time data synchronization and storage
- **Font Loading**: Google Fonts integration for typography (Inter, DM Sans, Fira Code, Geist Mono)
- **Environment Configuration**: Environment-based configuration for API endpoints and feature flags