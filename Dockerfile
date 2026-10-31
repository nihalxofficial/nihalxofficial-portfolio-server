# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# Portfolio API (Express 5 + Mongoose + Gemini + Firebase Admin)
#
#   docker build -t nihalxofficial/portfolio-api:release-2 .
#
# Secrets stay out of the image: the server reads them from the environment at
# runtime (compose injects portfolio-server/.env).
# ─────────────────────────────────────────────────────────────────────────────

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=5000

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

USER nodejs
EXPOSE 5000

CMD ["node", "dist/index.js"]
