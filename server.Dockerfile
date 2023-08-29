FROM node:18-alpine

COPY ./server /app/server
COPY ./types /app/types

WORKDIR /app/server

RUN npm ci

CMD ["npm", "start"]
