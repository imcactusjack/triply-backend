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

# Install prod deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built dist
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
