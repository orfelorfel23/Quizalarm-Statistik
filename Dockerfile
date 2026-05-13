# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json bun.lockb* package-lock.json* ./
RUN if [ -f bun.lockb ]; then \
      npm i -g bun && bun install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install; \
    fi
COPY . .
RUN npm run build

# --- runtime stage ---
FROM nginx:alpine
RUN apk add --no-cache gettext
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf.template /etc/nginx/templates-src/nginx.conf.template
COPY deploy/docker-entrypoint.sh /docker-entrypoint-quizstat.sh
RUN chmod +x /docker-entrypoint-quizstat.sh
EXPOSE 7850
ENTRYPOINT ["/docker-entrypoint-quizstat.sh"]
CMD ["nginx", "-g", "daemon off;"]
