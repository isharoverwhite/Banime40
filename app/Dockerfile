# ── Stage 1: Build ──────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install deps (layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source & build
COPY . .
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────────────
FROM nginx:1.27-alpine

# SPA routing: all paths → index.html
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
\n\
  # Gzip compression\n\
  gzip on;\n\
  gzip_types text/css application/javascript text/html image/svg+xml;\n\
  gzip_min_length 256;\n\
\n\
  # Cache static assets (hashed filenames)\n\
  location /assets/ {\n\
    expires 1y;\n\
    add_header Cache-Control "public, immutable";\n\
  }\n\
\n\
  # SPA fallback\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}' > /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
