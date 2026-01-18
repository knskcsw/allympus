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

## Worktree Development Workflow

This project uses git worktrees for parallel development on multiple features/issues.

### CRITICAL RULES - READ BEFORE STARTING ANY WORK

**⚠️ BEFORE ANY IMPLEMENTATION (including after Plan Mode approval):**
```bash
# ALWAYS check current branch FIRST before writing any code
git branch --show-current
```
- If on `main` → **STOP!** Create worktree first or use `/worktree-start`
- If on feature branch in worktree → OK to proceed

**NEVER:**
- Edit files on `main` branch directly (even after Plan Mode approval!)
- Start dev server without checking current directory and branch
- Use port 3000 or 3002 without checking for conflicts
- Merge to main without user confirmation
- Delete worktrees/branches before user confirmation

**ALWAYS:**
1. Verify current location: `pwd && git branch --show-current`
2. Check running dev servers: `ps aux | grep "next dev" | grep -v grep`
3. Create worktree from `main` branch
4. Use available port (avoid conflicts)
5. Wait for user to test before merging
6. Clean up after merge (stop server, delete worktree/branch)

**Available Skills:**
- `/worktree-start` - Start work on a new feature/issue (creates worktree automatically)
- `/worktree-finish` - Merge, cleanup worktree, and close issue

### Standard Workflow

When user requests work on an issue/feature:

1. **Setup worktree and branch:**
   ```bash
   # Check current status
   pwd && git branch --show-current

   # Create worktree from main (if requested)
   git worktree add ~/.claude-worktrees/manage-task-app/<worktree-name> -b <branch-name> main
   cd ~/.claude-worktrees/manage-task-app/<worktree-name>
   ```

2. **Check for available port:**
   ```bash
   # List running dev servers
   ps aux | grep "next dev" | grep -v grep

   # Common port assignments:
   # - Main repo: 3000 or 3002
   # - Worktrees: 3003, 3004, 3005, etc.
   ```

3. **Do the work:**
   - If requirements are unclear, use Plan Mode to clarify
   - Make commits with descriptive messages
   - Follow existing code patterns

4. **Start dev server for testing:**
   ```bash
   npm run dev -- -p <available-port>
   ```
   Run in background and inform user of the URL

5. **After user confirms it works:**
   ```bash
   # Switch to main and merge
   cd /Users/kansukechisuwa/project/manage-task-app
   git checkout main
   git merge <branch-name> --no-edit

   # Stop dev server (find PID first)
   ps aux | grep "next dev.*<port>" | grep -v grep
   kill <PID>

   # Delete worktree and branch
   git worktree remove ~/.claude-worktrees/manage-task-app/<worktree-name>
   git branch -d <branch-name>
   ```

### Example User Request Pattern

User often provides instructions like:
> "ワークツリーとブランチを切って作業してね。mainから切ってね。終わったら確認するから、他の起動中のやつと被らないポート番号でnpm run devしてな。だから起動中のプロセスをまずは確認してから起動してな。わしの確認が終わったら、マージしてワークツリーとブランチは消して、起動してたサーバも止めてね。要件が固まっていないところがあったらプランモードで要件を詰めてね"

This means:
1. Create worktree and branch from main
2. Check running processes before starting dev server
3. Use non-conflicting port
4. Wait for user testing
5. After confirmation: merge to main, delete worktree/branch, stop server
6. Use Plan Mode if requirements are unclear

### Port Management

**Current typical setup:**
- Main repo (`/Users/kansukechisuwa/project/manage-task-app`): Port 3000 or 3002
- Worktrees in `~/.claude-worktrees/manage-task-app/*`: Port 3003+

Always check before starting:
```bash
ps aux | grep "next dev" | grep -v grep
# Look at the output to see which ports are in use
```

### Worktree Locations

- **Main repo**: `/Users/kansukechisuwa/project/manage-task-app`
- **Worktrees**: `~/.claude-worktrees/manage-task-app/<worktree-name>`

When working in a worktree, always verify you're in the correct directory before making changes or starting servers.

## Self-Improvement

作業完了時（特に`/worktree-finish`実行後）、以下を振り返る：

**今回の作業で問題・非効率があった場合：**
- CLAUDE.mdのルールに不足があれば追記・修正
- `.claude/skills/`のスキル定義に改善点があれば修正
- 同じミスを繰り返さないための仕組みを追加

**例：**
- 「mainで直接作業してしまった」→ ブランチ確認ルールを強調追加
- 「手順を忘れた」→ チェックリストを追加
- 「スキルの説明が不足していた」→ スキルのInstructionsを改善

この自己改善サイクルにより、CLAUDE.mdとskillsは継続的に進化する。
