# syntax=docker/dockerfile:1

FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

WORKDIR /app

FROM base AS deps

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY app/package.json ./app/package.json
COPY packages/elements-react/package.json ./packages/elements-react/package.json
COPY packages/nextjs/package.json ./packages/nextjs/package.json
COPY packages/ory-sdk/package.json ./packages/ory-sdk/package.json

RUN pnpm install --frozen-lockfile

FROM base AS builder

ARG AUTH_FLOW_SECRET
ARG NEXT_PUBLIC_ORY_SDK_URL
ARG NEXT_PUBLIC_SITE_URL
ARG ORY_HYDRA_ADMIN_URL
ARG ORY_HYDRA_PUBLIC_URL
ARG ORY_PROJECT_API_TOKEN
ARG ORY_SDK_URL

ENV AUTH_FLOW_SECRET=$AUTH_FLOW_SECRET
ENV NEXT_PUBLIC_ORY_SDK_URL=$NEXT_PUBLIC_ORY_SDK_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV ORY_HYDRA_ADMIN_URL=$ORY_HYDRA_ADMIN_URL
ENV ORY_HYDRA_PUBLIC_URL=$ORY_HYDRA_PUBLIC_URL
ENV ORY_PROJECT_API_TOKEN=$ORY_PROJECT_API_TOKEN
ENV ORY_SDK_URL=$ORY_SDK_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/app/node_modules ./app/node_modules
COPY --from=deps /app/packages/elements-react/node_modules ./packages/elements-react/node_modules
COPY --from=deps /app/packages/nextjs/node_modules ./packages/nextjs/node_modules
COPY --from=deps /app/packages/ory-sdk/node_modules ./packages/ory-sdk/node_modules
COPY . .

RUN pnpm build

FROM node:24-slim AS runner

WORKDIR /app

ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/app/public ./app/public
COPY --from=builder --chown=nextjs:nodejs /app/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/app/.next/static ./app/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "app/server.js"]
