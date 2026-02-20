FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production

CMD ["npm","start"]

