FROM node:24-alpine AS dependencies
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS runtime-dependencies
RUN node -e 'const fs=require("fs");const p=require("./package.json");const keep=["@aws-sdk/client-s3","@prisma/adapter-pg","@prisma/client","better-auth","dotenv","nodemailer","pg","prisma","tsx","zod"];p.dependencies=Object.fromEntries(keep.map(k=>[k,p.dependencies[k]||p.devDependencies[k]]));delete p.devDependencies;fs.writeFileSync("package.json",JSON.stringify(p))' \
    && npm prune --omit=dev --ignore-scripts --offline --no-audit --no-fund

FROM dependencies AS builder
COPY . .
RUN BETTER_AUTH_SECRET="$(node -e 'process.stdout.write(require("crypto").randomBytes(32).toString("hex"))')" BETTER_AUTH_URL=http://localhost:3000 npm run build

FROM node:24-alpine AS runner
RUN apk add --no-cache openssl && addgroup -S -g 1001 nodejs && adduser -S -u 1001 nextjs
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=runtime-dependencies --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=runtime-dependencies --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/src/lib ./src/lib
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
RUN mkdir -p .next/cache && chown nextjs:nodejs .next/cache
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","scripts/start-production.mjs"]

FROM dependencies AS tools
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src/lib ./src/lib
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 nextjs
USER nextjs
CMD ["npm","run","worker"]
