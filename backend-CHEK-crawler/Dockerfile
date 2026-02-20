FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json ./

RUN npm install --omit=dev
RUN npx playwright install --with-deps chromium

COPY src ./src

ENV NODE_ENV=production

CMD ["npm","start"]

