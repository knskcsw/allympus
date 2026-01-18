---
name: worktree-finish
description: Safely merge work to main, clean up worktree, delete branch, and stop dev server after user confirms the work is complete. Use this when the user confirms their feature/issue work is done and ready to merge.
---

# worktree-finish

Safely merge work to main and clean up after user confirms the work is complete.

## Instructions

You are a worktree cleanup assistant. Your job is to safely merge work to main and clean up.

### Step 1: Safety Checks and Confirmation

IMMEDIATELY run these commands:

```bash
pwd
git branch --show-current
git status
ps aux | grep "next dev" | grep -v grep
```

Analyze the output:

1. **Location check:**
   - ✅ If in worktree (`~/.claude-worktrees/manage-task-app/*`) → Good, can proceed
   - ⚠️ If in main repo → Ask user which worktree they want to finish
   - ❌ If on main branch in main repo → Error: no worktree to finish

2. **Git status check:**
   - ✅ If clean (no uncommitted changes) → Good, proceed to Step 2
   - ⚠️ If uncommitted changes exist → Go to Step 1.5 (Handle Uncommitted Changes)

3. **Running server check:**
   - Identify if a dev server is running for this worktree (check port)
   - Extract PID for later cleanup

### Step 1.5: Handle Uncommitted Changes (If Needed)

If uncommitted changes are detected, **automatically commit them** (don't ask - committing before merge is obvious):

```bash
# Show what's changed
git status --short

# Get recent commits to understand commit message style
git log --oneline -5

# Show full diff
git diff

# Add all changes
git add .

# Create commit with descriptive message
# Follow the repository's commit message style from git log
git commit -m "$(cat <<'EOF'
<descriptive commit message based on changes>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# Verify commit
git status
```

IMPORTANT for commit message:
- Analyze the changes using `git diff`
- Look at recent commit messages from `git log` to match the style
- Write a clear, concise message that describes what was changed and why
- Follow the existing commit message conventions in the repo

After committing, proceed to Step 2.

### Step 2: Confirm with User

**CRITICAL:** Before doing ANYTHING destructive, show user what will happen:

```
📋 Ready to finish work on: <branch-name>

This will:
1. Stop dev server on port <port> (PID: <pid>)
2. Switch to main repo and main branch
3. Merge <branch-name> into main
4. Close GitHub issue #<number> (if branch name contains issue number)
5. Remove worktree at: <worktree-path>
6. Delete branch: <branch-name>

⚠️ Are you sure you want to proceed?
```

**Note:** Only include step 4 (Close GitHub issue) if the branch name contains an issue number (e.g., `issue-3-fix-overflow`).

**DO NOT PROCEED** without explicit user confirmation ("yes", "OK", "proceed", etc.)

### Step 3: Execute Cleanup (Only After Confirmation)

Run these commands **in order**:

```bash
# 1. Stop dev server (if running)
kill <PID>

# 2. Navigate to main repo
cd /Users/kansukechisuwa/project/manage-task-app

# 3. Switch to main branch
git checkout main

# 4. Merge the branch
git merge <branch-name> --no-edit

# 5. Close GitHub issue (if branch name contains issue number)
# Extract issue number from branch name (e.g., issue-3-fix-overflow → 3)
# Use gh CLI to close the issue
gh issue close <issue-number> -c "Closed via /worktree-finish after merging <branch-name>"

# 6. Remove worktree
git worktree remove <worktree-path>

# 7. Delete branch
git branch -d <branch-name>

# 8. Verify cleanup
git worktree list
git branch | grep <branch-name>
```

**Important for Step 5 (Close GitHub issue):**
- Only run if branch name matches pattern `issue-<number>-*` or `fix/issue-<number>-*` or `feature/issue-<number>-*`
- Extract the issue number using pattern matching
- If issue number is found, close it with `gh issue close <number>`
- If `gh` command fails (not installed, no auth, issue already closed), just note it and continue
- DO NOT fail the entire cleanup if issue close fails

### Step 4: Report Results

Provide a clear summary:

```
✅ Cleanup complete!

✓ Dev server stopped (port <port>)
✓ Merged <branch-name> → main
✓ Issue #<number> closed (if applicable)
✓ Worktree removed: <worktree-path>
✓ Branch deleted: <branch-name>

📁 Current location: /Users/kansukechisuwa/project/manage-task-app (main)
🌿 Active worktrees remaining: <count>
```

**Include in the report:**
- If issue was closed: "✓ Issue #X closed"
- If no issue found in branch name: Omit this line
- If issue close failed: "⚠️ Could not close issue #X (may already be closed or gh not configured)"

If there are still other worktrees, list them.

## Examples

**Example 1: Happy Path**
```
User: /worktree-finish
Assistant:
[Runs checks]
Current: ~/.claude-worktrees/manage-task-app/issue-3 (issue-3-fix-overflow)
Status: Clean, no uncommitted changes
Server: Running on port 3003 (PID: 12345)

📋 Ready to finish work on: issue-3-fix-overflow

This will:
1. Stop dev server on port 3003 (PID: 12345)
2. Switch to main repo and main branch
3. Merge issue-3-fix-overflow into main
4. Close GitHub issue #3
5. Remove worktree at: ~/.claude-worktrees/manage-task-app/issue-3
6. Delete branch: issue-3-fix-overflow

Proceed? (yes/no)

User: yes

[Executes cleanup]

✅ Cleanup complete!
✓ Dev server stopped (port 3003)
✓ Merged issue-3-fix-overflow → main
✓ Issue #3 closed
✓ Worktree removed
✓ Branch deleted

📁 Current location: /Users/kansukechisuwa/project/manage-task-app (main)
```

**Example 2: Uncommitted Changes**
```
User: /worktree-finish
Assistant:
[Runs checks and detects uncommitted changes]

未コミットの変更があるよ！コミットするね！

Modified files:
  M src/components/TaskList.tsx
  M src/app/api/tasks/route.ts

[Checks recent commits for style]
[Shows diff of changes]
[Creates commit automatically]

git add .
git commit -m "Fix task list filtering and API endpoint validation"

✓ Changes committed!

📋 Ready to finish work on: issue-7-fix-task-filter

This will:
1. Stop dev server on port 3007 (PID: 45678)
2. Switch to main repo and main branch
3. Merge issue-7-fix-task-filter into main
4. Close GitHub issue #7
5. Remove worktree at: ~/.claude-worktrees/manage-task-app/issue-7
6. Delete branch: issue-7-fix-task-filter

Proceed? (yes/no)

User: yes

[Executes cleanup]

✅ Cleanup complete!
✓ Changes committed
✓ Dev server stopped (port 3007)
✓ Merged issue-7-fix-task-filter → main
✓ Issue #7 closed
✓ Worktree removed
✓ Branch deleted

📁 Current location: /Users/kansukechisuwa/project/manage-task-app (main)
```

**Example 3: Called from Main Repo**
```
User: /worktree-finish
Assistant:
Current location: /Users/kansukechisuwa/project/manage-task-app (main)

You're in the main repo. Which worktree do you want to finish?

Active worktrees:
1. issue-3 (issue-3-fix-overflow) - Port 3003
2. issue-5 (feature/issue-5) - Port 3005

User: 1

[Proceeds with cleanup for issue-3]
```

## Error Handling

- **Merge conflicts:** If merge fails, STOP immediately and inform user
- **Worktree has uncommitted changes:** Automatically commit them (handled in Step 1.5)
- **Branch not fully merged:** Git will prevent deletion, inform user
- **Can't find dev server PID:** Continue cleanup, just note server might still be running
- **Permission errors:** Report to user and suggest manual cleanup
- **Commit creation fails:** Show error and inform user

## Safety Features

1. **Always confirm before destructive actions**
2. **Never force-delete branches** (use `-d` not `-D`)
3. **Check git status** before merging
4. **Verify worktree removal succeeded** before deleting branch
5. **Report any errors clearly** with suggested fixes
6. **Create proper commits** with Co-Authored-By attribution

## Notes

- This skill pairs with `/worktree-start`
- Can be called from anywhere (worktree or main repo)
- Always errs on the side of caution
- User confirmation is REQUIRED before any destructive action
- Automatically commits uncommitted changes (no need to ask - committing before merge is obvious)
