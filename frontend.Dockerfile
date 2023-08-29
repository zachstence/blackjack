# Build image
FROM node:18-alpine

COPY ./frontend /app/frontend
COPY ./types /app/types

WORKDIR /app/frontend

RUN npm ci
RUN npm run build

# Run image
FROM node:18-alpine

WORKDIR /app
COPY --from=0 /app/frontend/package.json /app
COPY --from=0 /app/frontend/build /app/build

CMD ["node", "build"]
