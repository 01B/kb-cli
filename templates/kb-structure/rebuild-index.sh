#!/bin/bash
# Rebuild local KB index (.kb-index.local.json)
KB_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$KB_ROOT"

LOCAL_INDEX=".kb-index.local.json"
echo "[" > "$LOCAL_INDEX"
FIRST=true
for f in $(find . -name '*.md' \
  -not -path './.kb/*' -not -path './templates/*' \
  -not -path './99-personal/*' -not -path './00-inbox/*' \
  -not -path './.github/*' -not -name 'README.md'); do
  TAGS=$(grep -m1 'tags:' "$f" 2>/dev/null | sed 's/tags: *//')
  TLDR=$(grep -m1 'tldr:' "$f" 2>/dev/null | sed 's/tldr: *//')
  UPDATED=$(grep -m1 'updated:' "$f" 2>/dev/null | sed 's/updated: *//')
  if [ "$FIRST" = true ]; then FIRST=false; else echo "," >> "$LOCAL_INDEX"; fi
  printf '  {"path":"%s","tags":%s,"tldr":%s,"updated":"%s"}' \
    "$f" "${TAGS:-[]}" "${TLDR:-\"\"}" "${UPDATED:-unknown}" >> "$LOCAL_INDEX"
done
echo "" >> "$LOCAL_INDEX"
echo "]" >> "$LOCAL_INDEX"
echo ".kb-index.local.json 재생성 완료 ($(grep -c '"path"' "$LOCAL_INDEX")개 노트)"
