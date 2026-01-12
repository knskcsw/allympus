#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/Users/kansukechisuwa/project/manage-task-app"
WORKTREES_DIR="/Users/kansukechisuwa/project/manage-task-app-worktrees"
SEED_SCRIPT="scripts/seed-dummy-2025-2026.ts"

if [[ $# -lt 1 ]]; then
  echo "Usage: $(basename "$0") <branch-name> [worktree-dir-name]"
  exit 1
fi

branch_name="$1"
dir_name="${2:-${branch_name//\//-}}"
worktree_path="${WORKTREES_DIR}/${dir_name}"

if [[ ! -d "${ROOT_DIR}/.git" ]]; then
  echo "Error: ROOT_DIR is not a git repo: ${ROOT_DIR}"
  exit 1
fi

if [[ -e "${worktree_path}" ]]; then
  echo "Error: worktree path already exists: ${worktree_path}"
  exit 1
fi

if git -C "${ROOT_DIR}" show-ref --verify --quiet "refs/heads/${branch_name}"; then
  git -C "${ROOT_DIR}" worktree add "${worktree_path}" "${branch_name}"
else
  git -C "${ROOT_DIR}" worktree add -b "${branch_name}" "${worktree_path}" main
fi

sqlite3 "${ROOT_DIR}/dev.db" .dump | sqlite3 "${worktree_path}/dev.db"

cat <<'EOF' > "${worktree_path}/.env"
DATABASE_URL="file:./dev.db"
EOF

if [[ ! -d "${worktree_path}/node_modules" ]]; then
  (cd "${worktree_path}" && npm install)
fi

(cd "${worktree_path}" && DATABASE_URL="file:./dev.db" npx prisma db push)

(cd "${worktree_path}" && npx tsx "${SEED_SCRIPT}")

echo "✅ Worktree ready: ${worktree_path}"
