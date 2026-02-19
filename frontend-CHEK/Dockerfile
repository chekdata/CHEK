FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
WORKDIR /app
COPY . .
RUN mkdir -p public
ARG CHEK_API_BASE_URL=https://api.chekkk.com
ARG CHEK_SITE_URL=https://chaoshan.chekkk.com
ARG CHEK_BASE_PATH=/
ENV CHEK_API_BASE_URL=$CHEK_API_BASE_URL
ENV CHEK_SITE_URL=$CHEK_SITE_URL
ENV CHEK_BASE_PATH=$CHEK_BASE_PATH
ENV NEXT_PUBLIC_CHEK_BASE_PATH=$CHEK_BASE_PATH
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node","server.js"]
