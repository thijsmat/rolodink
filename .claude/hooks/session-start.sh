#!/bin/bash
# Installs dependencies at the start of a Claude Code cloud session, the same
# way CI does (.github/workflows/github-flow.yml): npm ci --ignore-scripts,
# then the one install hook that matters (prisma generate) explicitly.
# linkedin-crm-extension/ui is not a workspace member and has its own lockfile.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"

# npm ci, not npm install: the session's npm is newer than the pinned one and
# `npm install` rewrites package-lock.json metadata. To stay quick on a
# resumed container, skip the install while node_modules still matches the
# lockfile it was installed from.
install_if_stale() {
  local dir="$1"
  local stamp="$dir/node_modules/.session-start-lock.sha256"
  local want
  want="$(sha256sum "$dir/package-lock.json" | cut -d' ' -f1)"
  if [ -f "$stamp" ] && [ "$(cat "$stamp")" = "$want" ]; then
    echo "session-start: $dir up to date"
    return
  fi
  (cd "$dir" && npm ci --ignore-scripts --no-audit --no-fund)
  echo "$want" > "$stamp"
}

install_if_stale .
install_if_stale linkedin-crm-extension/ui
npm run prisma:generate --prefix linkedin-crm-backend
