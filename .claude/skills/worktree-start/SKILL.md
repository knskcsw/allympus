---
name: worktree-start
description: Safely start work on a new feature/issue using git worktrees with automatic safety checks for directory location, branch context, port conflicts, and dev server management. Use this when the user wants to start work on a new issue or feature in a separate worktree.
---

# worktree-start

Safely prepare a development environment for new features/issues using git worktrees.

## Instructions

You are a worktree setup assistant. Your job is to safely prepare a development environment.

### Step 1: Safety Checks

IMMEDIATELY run these commands in parallel:

```bash
pwd
git branch --show-current
ps aux | grep "next dev" | grep -v grep
git worktree list
```

Analyze the output:

1. **Current directory check:**
   - ✅ If in `/Users/kansukechisuwa/project/manage-task-app` → Good, can proceed
   - ❌ If in a worktree (`~/.claude-worktrees/*`) → WARN user they're already in a worktree

2. **Branch check:**
   - ✅ If on `main` → Good, can create worktree from here
   - ⚠️ If on feature branch → WARN user, recommend switching to main first
   - ❌ If in worktree AND on feature branch → Ask user if they want to switch context

3. **Running servers check:**
   - Parse `ps aux` output to identify which ports are in use
   - Extract port numbers from output like `next dev -p 3002`
   - List all occupied ports (e.g., "Ports in use: 3000, 3002, 3003")
   - Suggest next available port (start from 3003, skip occupied ones)

### Step 2: Create Worktree and Branch

Based on the input:

- If input is a number (e.g., `3`): Format as `issue-<number>` for both worktree and branch
- If input is a descriptive name (e.g., `fix-overflow`): Use as-is

**Worktree naming:**
- Worktree directory: `~/.claude-worktrees/manage-task-app/<name>`
- Branch: `issue-<number>-<description>` or `feature/<description>` or `fix/<description>`

**Commands to run:**

```bash
# Navigate to main repo first (if not already there)
cd /Users/kansukechisuwa/project/manage-task-app

# Ensure we're on main
git checkout main

# Create worktree and branch from main
git worktree add ~/.claude-worktrees/manage-task-app/<worktree-name> -b <branch-name> main

# Navigate to worktree
cd ~/.claude-worktrees/manage-task-app/<worktree-name>

# Confirm location
pwd && git branch --show-current
```

### Step 3: Start Development Server

**Find available port:**
- If 3003 is free → use 3003
- If 3003 is occupied → use 3004
- Continue incrementing until you find a free port

**Start server in background:**

```bash
npm run dev -- -p <available-port>
```

Run this in background using the Bash tool with `run_in_background: true`.

### Step 4: Report to User

Provide a clear summary:

```
✅ Worktree setup complete!

📁 Location: ~/.claude-worktrees/manage-task-app/<worktree-name>
🌿 Branch: <branch-name>
🚀 Dev server: http://localhost:<port>

You can now start working on this issue. When you're done testing, let me know and I'll merge to main and clean up.
```

## Examples

**Example 1:**
```
User: /worktree-start 3
Assistant:
[Runs safety checks]
Current: /Users/kansukechisuwa/project/manage-task-app (main)
Running servers: Port 3002 (main repo)

Creating worktree for issue-3...
[Creates worktree at ~/.claude-worktrees/manage-task-app/issue-3]
[Creates branch issue-3-fix-time-entry-overflow]
[Starts dev server on port 3003]

✅ Worktree setup complete!
📁 Location: ~/.claude-worktrees/manage-task-app/issue-3
🌿 Branch: issue-3-fix-time-entry-overflow
🚀 Dev server: http://localhost:3003
```

**Example 2:**
```
User: /worktree-start fix-overflow-bug
Assistant:
[Runs safety checks]
⚠️ Warning: You're currently in a worktree!
Current: ~/.claude-worktrees/manage-task-app/issue-5 (feature/issue-5)

Do you want to:
1. Switch to main repo and create a new worktree
2. Continue working in current worktree
3. Cancel
```

## Error Handling

- **Port conflicts:** Always check running processes before starting server
- **Worktree exists:** If worktree directory already exists, ask user if they want to remove and recreate
- **Branch exists:** If branch already exists, ask if they want to reuse it or create new one
- **Not in git repo:** Error and exit
- **Can't access main:** Suggest stashing changes first

## After Work is Done

When user says work is complete, remind them of cleanup steps or offer to run `/worktree-finish`.
