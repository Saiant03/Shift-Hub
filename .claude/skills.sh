#!/usr/bin/env bash
# Checks the project skills: every name in skills.lock has .claude/skills/<name>/SKILL.md (run by the SessionStart hook).
# .claude/skills/ is the only copy; skills.lock records the upstream of each for manual updates.
set -euo pipefail
cd "$(dirname "$0")"
missing=""; n=0
for s in $(sed -n 's/^skills=//p' skills.lock); do
  n=$((n+1)); [ -f "skills/$s/SKILL.md" ] || missing="$missing $s"
done
if [ -n "$missing" ]; then echo "Skills: MISSING from .claude/skills/:$missing"; else echo "Skills: $n/$n present in .claude/skills/"; fi
