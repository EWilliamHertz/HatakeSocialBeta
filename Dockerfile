# syntax=docker/dockerfile:1

# Stage 1: Build Phase Rust Server
FROM rust:slim-bookworm AS phase-builder
RUN apt-get update && apt-get install -y --no-install-recommends build-essential libssl-dev pkg-config
WORKDIR /app
COPY phase-engine/ phase-engine/
WORKDIR /app/phase-engine
RUN apt-get install -y curl jq
RUN ./scripts/gen-card-data.sh
RUN cargo build --profile server-release --bin phase-server

# Stage 2: Build Hatake Next.js & Phase Vite Frontend
FROM node:24-slim AS node-builder
RUN apt-get update && apt-get install -y openssl
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

COPY . .

# Build Hatake Next.js
RUN npm install
RUN npx prisma generate

# Inject Environment Variables for Next.js Build
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ARG JWT_SECRET
ENV JWT_SECRET=$JWT_SECRET
ARG NEXT_PUBLIC_IMGBB_API_KEY
ENV NEXT_PUBLIC_IMGBB_API_KEY=$NEXT_PUBLIC_IMGBB_API_KEY
ARG RESEND_API_KEY
ENV RESEND_API_KEY=$RESEND_API_KEY

RUN npm run build

# Build Phase Frontend
WORKDIR /app/phase-engine/client
RUN pnpm install
# Set WebSocket URL so Phase connects back to Hatake's proxy
ENV VITE_WS_URL=wss://hatakesocialbeta.onrender.com/phase-ws
RUN pnpm run build
# Move Phase Frontend to Hatake Public Folder so Next.js serves it
RUN mv dist /app/public/phase

# Stage 3: Unified Runner
FROM node:24-slim
RUN apt-get update && apt-get install -y openssl supervisor && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy built Node app and Next.js static files
COPY --from=node-builder /app /app
# Copy built Rust Phase Server binary and card data
COPY --from=phase-builder /app/phase-engine/target/server-release/phase-server /usr/local/bin/phase-server
RUN mkdir -p /var/lib/phase-server
COPY --from=phase-builder /app/phase-engine/data/card-data.json /var/lib/phase-server/card-data.json
# Setup supervisor to run both Node and Rust
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

ENV PHASE_DATA_DIR=/var/lib/phase-server
ENV PORT=3000
EXPOSE 3000
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
