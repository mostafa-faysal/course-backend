# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency configs and Prisma schema
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm ci && npx prisma generate

# Copy TypeScript source code
COPY src ./src

# Compile TypeScript to dist directory
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy package.json and install production-only dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy generated Prisma bindings and compiled Javascript code from build stage
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 5000

# Ensure non-root user execution for security in production
USER node

# Start production server
CMD ["node", "dist/server.js"]
