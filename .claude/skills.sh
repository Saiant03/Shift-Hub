#!/usr/bin/env bash
# Vendored skill collection from github.com/Saiant03/Skills, pinned in .claude/skills.lock.
#   bash .claude/skills.sh            check: every locked skill has .claude/skills/<name>/SKILL.md
#   bash .claude/skills.sh install    (re)copy the pinned commit into .claude/skills/, symlinks resolved
#   bash .claude/skills.sh install <commit>   move the pin to <commit>, then install
# Only the skills listed in the lock are touched; other project skills are left alone.
set -euo pipefail
cd "$(dirname "$0")"
LOCK=skills.lock
REPO=$(sed -n 's/^repo=//p' "$LOCK")
COMMIT=$(sed -n 's/^commit=//p' "$LOCK")

if [ "${1:-check}" = install ]; then
  COMMIT=${2:-$COMMIT}
  tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
  git -C "$tmp" init -q && git -C "$tmp" fetch -q --depth 1 "$REPO" "$COMMIT" && git -C "$tmp" checkout -q FETCH_HEAD
  names=$(ls "$tmp/.claude/skills")
  mkdir -p skills
  for n in $names; do
    [ -f "$tmp/.claude/skills/$n/SKILL.md" ] || { echo "skip $n: no SKILL.md" >&2; continue; }
    rm -rf "skills/$n" && cp -RL "$tmp/.claude/skills/$n" "skills/$n"
  done
  { echo "repo=$REPO"; echo "commit=$(git -C "$tmp" rev-parse HEAD)"; echo "skills=$(echo $names)"; } > "$LOCK"
  echo "installed $(echo $names | wc -w) skills at $(git -C "$tmp" rev-parse --short HEAD)"
  exit
fi

missing=""; n=0
for s in $(sed -n 's/^skills=//p' "$LOCK"); do
  n=$((n+1)); [ -f "skills/$s/SKILL.md" ] || missing="$missing $s"
done
if [ -n "$missing" ]; then echo "Skills: MISSING from .claude/skills/:$missing"; else echo "Skills: $n/$n from Saiant03/Skills@${COMMIT:0:7} present in .claude/skills/"; fi
