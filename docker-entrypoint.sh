#!/bin/sh
set -e

echo "Waiting for database to be ready..."
sleep 5

echo "Running pending migrations..."
NODE_ENV=prod node ./node_modules/typeorm/cli.js \
  migration:run \
  -d dist/src/data-source.js || {
  echo "Migration failed or no migrations to run"
}

echo "Starting application..."
exec node dist/main
