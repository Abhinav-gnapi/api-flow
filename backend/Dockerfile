# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app

# Install root dependencies so backend can resolve shared runtime deps (e.g. openai)
COPY package*.json ./
RUN npm ci --omit=dev

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=5000

COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/backend/node_modules ./node_modules
COPY backend ./

EXPOSE 5000
CMD ["npm", "start"]
