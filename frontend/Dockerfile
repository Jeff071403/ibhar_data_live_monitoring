# syntax=docker/dockerfile:1

# ---- Build stage ------------------------------------------------------
FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite bakes VITE_* variables into the JS bundle at build time, so it must
# be passed as a build arg (not a runtime env var) and rebuilt whenever the
# backend URL changes. Point it at your backend Cloud Run service URL, e.g.
#   --build-arg VITE_API_BASE_URL=https://ibhar-backend-xxxxx.a.run.app/api
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npx vite build

# ---- Runtime stage ------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Template so the listen port can be set from Cloud Run's $PORT at startup
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

ENV PORT=8080
EXPOSE 8080

# The official nginx image already runs docker-entrypoint.d scripts that
# envsubst any *.template file in /etc/nginx/templates into /etc/nginx/conf.d
CMD ["nginx", "-g", "daemon off;"]
