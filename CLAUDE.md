# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run lint     # Run ESLint

# Database
npx prisma migrate dev --name <name>  # Create and apply migration
npx prisma generate                    # Regenerate Prisma client
npx prisma studio                      # Open database GUI
```

## Architecture

This is a work management and task tracking application built with Next.js 16 (App Router).

### Tech Stack
- **Framework**: Next.js 16 with App Router
- **Database**: SQLite via Prisma 7 with libsql adapter
- **UI**: shadcn/ui components + Tailwind CSS
- **Date handling**: date-fns

### Data Models (Prisma)
- **Attendance**: Daily clock in/out records with break time
- **Task**: Tasks with status (TODO/IN_PROGRESS/DONE/ARCHIVED) and priority
- **TimeEntry**: Time tracking entries linked to tasks

### Key Directories
- `src/app/api/` - Next.js Route Handlers (REST API endpoints)
- `src/components/` - React components organized by feature (attendance, tasks, timer, calendar, reports)
- `src/hooks/` - Custom React hooks (e.g., useStopwatch for timer functionality)
- `src/lib/db.ts` - Prisma client singleton with libsql adapter
- `prisma/` - Database schema and migrations

### Database Setup
The app uses SQLite stored at `dev.db` in the project root. Prisma client is generated to `src/generated/prisma/` (gitignored). Import types from `@/generated/prisma/client`.

### API Structure
All APIs are REST endpoints under `/api/`:
- `/api/attendance` - Attendance CRUD and clock in/out
- `/api/tasks` - Task CRUD
- `/api/time-entries` - Time tracking entries
- `/api/reports` - Summary data and CSV export
