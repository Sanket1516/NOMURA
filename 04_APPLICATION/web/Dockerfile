# syntax=docker/dockerfile:1
FROM node:22.14.0-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=ca,required=false if [ -f /run/secrets/ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/ca npm_config_cafile=/run/secrets/ca; fi; npm ci --no-audit --no-fund
COPY . .
RUN npx next build

FROM node:22.14.0-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node /app/.next/standalone ./
COPY --from=build --chown=node /app/.next/static ./.next/static
COPY --from=build --chown=node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
