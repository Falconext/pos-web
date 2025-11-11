# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
ENV CI=true
# Install pnpm and deps
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || npm ci
COPY . .
# Build Vite app
RUN pnpm run build || npm run build

# Run stage (Nginx)
FROM nginx:stable-alpine AS runner
WORKDIR /usr/share/nginx/html
# Remove default static assets
RUN rm -rf ./*
# Copy build output
COPY --from=builder /app/dist .
# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
