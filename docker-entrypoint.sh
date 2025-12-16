#!/bin/sh
set -e

echo "Waiting for database to be ready..."
sleep 5

echo "Running pending migrations..."
echo "Data source path: dist/src/data-source.js"
echo "Migrations path: src/migrations"
echo "Current directory: $(pwd)"
echo "Listing migrations:"
ls -la src/migrations/ 2>/dev/null || echo "No migrations directory found"

NODE_ENV=prod node ./node_modules/typeorm/cli.js \
  migration:run \
  -d dist/src/data-source.js

MIGRATION_EXIT_CODE=$?
if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
  echo "Migrations completed successfully"
else
  echo "Migration failed with exit code: $MIGRATION_EXIT_CODE"
  exit $MIGRATION_EXIT_CODE
fi

echo "Starting application..."
exec node dist/main
