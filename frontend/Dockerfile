ARG NODE_IMAGE=node:20-alpine
FROM ${NODE_IMAGE} AS deps
USER root
WORKDIR /app
COPY package.json package-lock.json* ./
COPY .npmrc ./
RUN npm ci --include=dev || npm install --include=dev

FROM ${NODE_IMAGE} AS builder
USER root
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM ${NODE_IMAGE} AS runner
USER root
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN (grep -q '^app:' /etc/group || addgroup -S app) && (id -u nextjs >/dev/null 2>&1 || adduser -S nextjs -G app)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:app /app/.next/standalone ./
COPY --from=builder --chown=nextjs:app /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
