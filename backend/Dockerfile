FROM node:20-alpine

RUN apk add --no-cache postgresql-client bash

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN mkdir -p uploads

COPY wait-for-db.sh /wait-for-db.sh
RUN chmod +x /wait-for-db.sh

EXPOSE 3000

CMD ["/wait-for-db.sh", "postgres", "node", "dist/main.js"]
