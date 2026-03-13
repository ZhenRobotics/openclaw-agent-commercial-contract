#!/bin/bash

# Agent Commercial Contract - CLI Entry Point

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed"
  exit 1
fi

# Run CLI via tsx
npx tsx src/cli/index.ts "$@"
