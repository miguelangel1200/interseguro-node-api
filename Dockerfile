# ---- Etapa de dependencias ----
FROM node:24-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- Etapa de build (compila TypeScript a dist/) ----
FROM node:24-alpine AS build

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Etapa de runtime ----
FROM node:24-alpine

WORKDIR /app

# La imagen node:24-alpine ya incluye el usuario no privilegiado "node" (UID 1000).
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]
