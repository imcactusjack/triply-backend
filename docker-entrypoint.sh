#!/bin/sh
set -e

echo "Waiting for database to be ready..."
sleep 5

echo "Running pending migrations..."
echo "Data source path: dist/src/data-source.js"
echo "Migrations path: dist/src/migrations (compiled JS)"
echo "Current directory: $(pwd)"
echo "Listing migrations:"
ls -la dist/src/migrations/ 2>/dev/null || echo "No migrations directory found"

# Temporarily disable set -e to allow error handling
set +e
NODE_ENV=prod node ./node_modules/typeorm/cli.js \
  migration:run \
  -d dist/src/data-source.js
MIGRATION_EXIT_CODE=$?
set -e

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
  echo "Migrations completed successfully"
else
  echo "Migration failed with exit code: $MIGRATION_EXIT_CODE"
  exit $MIGRATION_EXIT_CODE
fi

echo "Starting application..."
exec node dist/main
