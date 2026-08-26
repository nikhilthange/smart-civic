# ─── Production Dockerfile for Smart Civic Backend ────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies with frozen lockfile / clean install
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# ─── Production Runtime Stage ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Run with non-root user for security hardening
USER node

# Copy built dependencies and app from builder
COPY --chown=node:node --from=builder /app /app

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "index.js"]
