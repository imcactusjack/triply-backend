#!/bin/sh
set -e

echo "Waiting for database to be ready..."
sleep 5

echo "Checking migration status..."
NODE_ENV=prod ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:show -d src/data-source.ts || {
  echo "Failed to check migration status, but continuing..."
}

echo "Running pending migrations..."
NODE_ENV=prod ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d src/data-source.ts || {
  echo "No pending migrations or migration already executed"
}

echo "Starting application..."
exec node dist/main
