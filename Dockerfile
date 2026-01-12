FROM node:20-alpine

# Install dumb-init for proper signal handling (fixes SIGTERM issues)
RUN apk add --no-cache dumb-init

WORKDIR /app

COPY package*.json ./

# Skip puppeteer chromium download since we don't actually use it
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN npm install --production

COPY . .

# Use dumb-init to properly handle signals
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]