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

# Stage 2: Run
FROM node:20-alpine AS runner

WORKDIR /app

# Install prod deps + ts-node for migrations
COPY package*.json ./
RUN npm ci --omit=dev && npm install -g ts-node typescript

# Copy built dist
COPY --from=builder /app/dist ./dist

# Copy migrations and data-source for migration execution
COPY --from=builder /app/src/migrations ./src/migrations
COPY --from=builder /app/src/data-source.ts ./src/data-source.ts
COPY --from=builder /app/tsconfig.json ./

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
