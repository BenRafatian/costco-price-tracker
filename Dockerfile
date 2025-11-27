FROM node:18-bookworm

# Install dependencies for Playwright browsers
RUN npx playwright install-deps chromium firefox webkit

WORKDIR /app

COPY package*.json ./

# Install app dependencies
RUN npm install

# Install all Playwright browsers to support switching via env var
RUN npx playwright install chromium firefox webkit

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Start the bot
CMD ["npm", "start"]
