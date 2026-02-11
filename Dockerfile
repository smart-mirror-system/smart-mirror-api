# ╔═══════════════════════════╗
# ║          Bulder           ║
# ╚═══════════════════════════╝
FROM node:22-alpine AS dependencies

WORKDIR /app 

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# ╔═══════════════════════════╗
# ║          Runtime          ║
# ╚═══════════════════════════╝
FROM gcr.io/distroless/nodejs22-debian12

ENV NODE_ENV=production
WORKDIR /app

COPY --from=dependencies --chown=nonroot:nonroot /app/node_modules /app/node_modules
COPY --chown=nonroot:nonroot package.json server.js ./
COPY --chown=nonroot:nonroot src ./src

USER nonroot:nonroot

EXPOSE 3000

ENTRYPOINT ["/nodejs/bin/node", "server.js"]