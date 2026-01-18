---
name: worktree-start
description: Safely start work on a new feature/issue using git worktrees with automatic safety checks for directory location, branch context, port conflicts, and dev server management. When given an issue number, fetches the GitHub issue, enters Plan Mode to design implementation, then creates the worktree. Use this when the user wants to start work on a new issue or feature in a separate worktree.
---

# worktree-start

Safely prepare a development environment for new features/issues using git worktrees. Supports GitHub issue integration and automatic Plan Mode for implementation planning.

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
   - List all occupied ports (e.g., "Ports in use: 3000, 3002, 3007")
   - Note: Port selection will be done in Step 5 using `lsof` for precise checking

### Step 2: Fetch GitHub Issue (if number provided)

If the input is a number (e.g., `7`), fetch the GitHub issue:

```bash
gh issue view <number> --json title,body,number
```

**Parse the issue:**
- Extract the title, body, and number from JSON output
- Display the issue information to the user:
  ```
  📋 GitHub Issue #<number>
  Title: <title>

  <body>
  ```

**Enter Plan Mode:**
- After displaying the issue, IMMEDIATELY use the `EnterPlanMode` tool
- Tell the user: "I'll create an implementation plan for this issue. Let me enter Plan Mode to design the approach."
- In Plan Mode, you should:
  1. Explore the codebase to understand relevant code
  2. Design an implementation approach based on the issue requirements
  3. Create a step-by-step plan
  4. Get user approval via `ExitPlanMode`

**After Plan Mode exits:**
- Continue to Step 3 to create the worktree and branch
- Use the issue number and a descriptive slug from the issue title for naming

**If input is NOT a number:**
- Skip GitHub issue fetch
- Proceed directly to Step 3
- Use the provided string as-is for naming

### Step 3: Create Worktree and Branch

Based on the input:

- If input is a number (e.g., `3`):
  - Worktree name: `issue-<number>`
  - Branch name: `issue-<number>-<slug-from-issue-title>` (create a short slug from the issue title)
- If input is a descriptive name (e.g., `fix-overflow`): Use as-is for both

**Worktree naming:**
- Worktree directory: `~/.claude-worktrees/manage-task-app/<name>`
- Branch: `issue-<number>-<description>` or `feature/<description>` or `fix/<description>`

### Step 4: Execute Worktree Creation

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

### Step 5: Start Development Server

**Determine base port:**
- **If issue number provided:** Use `30{issue_number}` format
  - Issue #7 → Port 3007
  - Issue #15 → Port 3015
  - Issue #123 → Port 30123
- **If no issue number:** Start from port 3003

**Check port availability:**

Run this command to check if the port is in use:
```bash
lsof -i :<port> || echo "Port <port> is available"
```

**Port selection logic:**
- First check the base port (e.g., 3007 for issue #7)
- If occupied, increment by 100: 3107, 3207, 3307, etc.
- For non-issue worktrees, increment by 1: 3003, 3004, 3005, etc.
- Continue until you find an available port

**Example for issue #7:**
```bash
# Check 3007
lsof -i :3007 || echo "Port 3007 is available"
# If occupied, check 3107
lsof -i :3107 || echo "Port 3107 is available"
# If occupied, check 3207
# ... and so on
```

**Start server in background:**

Once you find an available port:
```bash
npm run dev -- -p <available-port>
```

Run this in background using the Bash tool with `run_in_background: true`.

### Step 6: Report to User

Provide a clear summary:

```
✅ Worktree setup complete!

📁 Location: ~/.claude-worktrees/manage-task-app/<worktree-name>
🌿 Branch: <branch-name>
🚀 Dev server: http://localhost:<port>

You can now start working on this issue. When you're done testing, let me know and I'll merge to main and clean up.
```

## Examples

**Example 1: With GitHub Issue Number**
```
User: /worktree-start 7
Assistant:
[Runs safety checks]
Current: /Users/kansukechisuwa/project/manage-task-app (main)
Running servers: Port 3002 (main repo)

[Fetches GitHub issue #7]
📋 GitHub Issue #7
Title: Add WBS task breakdown feature

Description: Implement WBS (Work Breakdown Structure) functionality that allows...

I'll create an implementation plan for this issue. Let me enter Plan Mode to design the approach.

[Enters Plan Mode using EnterPlanMode tool]
[Explores codebase, designs implementation approach, creates plan]
[User approves plan via ExitPlanMode]

[After plan approval, creates worktree and branch]
Creating worktree for issue-7...
[Creates worktree at ~/.claude-worktrees/manage-task-app/issue-7]
[Creates branch issue-7-add-wbs-task-breakdown]

[Checks port availability]
Checking port 3007... available!
[Starts dev server on port 3007]

✅ Worktree setup complete!
📁 Location: ~/.claude-worktrees/manage-task-app/issue-7
🌿 Branch: issue-7-add-wbs-task-breakdown
🚀 Dev server: http://localhost:3007 (port based on issue #7)

Ready to implement the plan!
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

- **Port conflicts:** Use `lsof` to check port availability before starting server. If base port is occupied, automatically try next available port (increment by 100 for issue-based ports, by 1 for others)
- **Worktree exists:** If worktree directory already exists, ask user if they want to remove and recreate
- **Branch exists:** If branch already exists, ask if they want to reuse it or create new one
- **Not in git repo:** Error and exit
- **Can't access main:** Suggest stashing changes first
- **GitHub issue not found:** If `gh issue view` fails, inform user and ask if they want to proceed with manual naming

## After Work is Done

When user says work is complete, remind them of cleanup steps or offer to run `/worktree-finish`.
