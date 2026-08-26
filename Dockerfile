# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ---- serve ----
FROM node:22-alpine
WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist ./dist
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENV PORT=5173
EXPOSE 5173

# VITE_API_BASE_URL을 빌드가 아니라 컨테이너 런타임에 주입한다(env-config.js 생성 후 serve 실행).
CMD ["/app/docker-entrypoint.sh"]
