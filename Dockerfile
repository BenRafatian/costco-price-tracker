FROM node:18-bookworm

# Install dependencies for Playwright browsers
RUN npx playwright install-deps webkit

WORKDIR /app

COPY package*.json ./

# Install app dependencies
RUN npm install

# Install Playwright browsers
RUN npx playwright install webkit

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Start the bot
CMD ["npm", "start"]
