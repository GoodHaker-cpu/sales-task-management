#!/usr/bin/env bash
# Push .env variables to Vercel. Run once after: npx vercel login
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env in project root"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

VERCEL_URL="${VERCEL_URL:-https://sales-task-management-1jwn.vercel.app}"
PROD_NEXTAUTH_URL="${PROD_NEXTAUTH_URL:-$VERCEL_URL}"
PROD_SOCKET_URL="${PROD_SOCKET_URL:-$VERCEL_URL}"

if [[ -z "${DATABASE_URL:-}" || -z "${NEXTAUTH_SECRET:-}" || -z "${JWT_SECRET:-}" ]]; then
  echo "DATABASE_URL, NEXTAUTH_SECRET, and JWT_SECRET must be set in .env"
  exit 1
fi

vercel_cmd=(npx vercel@latest)

echo "Linking project (skip if already linked)..."
"${vercel_cmd[@]}" link --yes 2>/dev/null || "${vercel_cmd[@]}" link

add_env() {
  local name="$1"
  local value="$2"
  local env="$3"
  echo "Setting $name ($env)..."
  printf '%s' "$value" | "${vercel_cmd[@]}" env add "$name" "$env" --force --yes 2>/dev/null \
    || printf '%s' "$value" | "${vercel_cmd[@]}" env add "$name" "$env" --force
}

for env in production preview development; do
  add_env "DATABASE_URL" "$DATABASE_URL" "$env"
  add_env "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET" "$env"
  add_env "JWT_SECRET" "$JWT_SECRET" "$env"
  add_env "NEXTAUTH_URL" "$PROD_NEXTAUTH_URL" "$env"
  add_env "NEXT_PUBLIC_SOCKET_URL" "$PROD_SOCKET_URL" "$env"
done

echo ""
echo "Done. Redeploy with:"
echo "  npx vercel --prod"
