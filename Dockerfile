FROM oven/bun:1 AS dev

WORKDIR /usr/src/app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile 

CMD ["bun", "run", "dev"]

FROM oven/bun:1-alpine AS build

WORKDIR /usr/src/app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

ENV NODE_ENV='production'
COPY . .
RUN bun run build-only

FROM --platform=linux/amd64 nginx:alpine AS deploy
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]