FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package.json ./
COPY . .

EXPOSE 8080

CMD ["node", "encore-ai-server.mjs"]
