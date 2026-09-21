FROM apify/actor-node:20 AS builder

RUN npm install -g pnpm@9.15.9

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/actor/package.json ./apps/actor/

RUN pnpm install --frozen-lockfile --filter @scouvela/shared --filter @scouvela/actor

COPY packages/shared ./packages/shared
COPY apps/actor ./apps/actor

RUN pnpm --filter @scouvela/shared build
RUN pnpm --filter @scouvela/actor build

FROM apify/actor-node:20

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/pnpm-workspace.yaml ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/packages/shared ./packages/shared
COPY --from=builder /usr/src/app/apps/actor ./apps/actor

WORKDIR /usr/src/app/apps/actor

CMD ["node", "dist/main.js"]
