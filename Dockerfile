# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install all deps
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build app
RUN npm run build

# Compile data-source.ts and migrations for migrations (CommonJS format)
RUN npx tsc src/data-source.ts \
  --outDir dist/src \
  --module commonjs \
  --target ES2021 \
  --esModuleInterop \
  --skipLibCheck \
  --resolveJsonModule \
  --moduleResolution node

# Compile migrations to dist/src/migrations
RUN if [ -d src/migrations ] && [ "$(ls -A src/migrations/*.ts 2>/dev/null)" ]; then \
  mkdir -p dist/src/migrations && \
  for file in src/migrations/*.ts; do \
  npx tsc "$file" \
  --outDir dist/src/migrations \
  --module commonjs \
  --target ES2021 \
  --esModuleInterop \
  --skipLibCheck \
  --resolveJsonModule \
  --moduleResolution node; \
  done; \
  fi

# Stage 2: Run
FROM node:20-alpine AS runner

WORKDIR /app

# Install prod deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built dist (includes compiled data-source.js and migrations)
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
