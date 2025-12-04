FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Install OpenSSL and build tools for native modules
RUN apk add --no-cache openssl python3 make g++

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Install production dependencies and rebuild native modules  
RUN npm ci --only=production

EXPOSE 3003

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
