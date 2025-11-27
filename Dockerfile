FROM node:18-bookworm

# Install dependencies for Playwright
RUN npx playwright install-deps

WORKDIR /app

COPY package*.json ./

# Install app dependencies
RUN npm install

# Install Playwright browsers (WebKit only to save space/time)
RUN npx playwright install webkit

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Start the bot
CMD ["npm", "start"]
