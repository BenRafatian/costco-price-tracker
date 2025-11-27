FROM node:18-bookworm

# Install dependencies for Playwright browsers (WebKit and Firefox only to save space)
RUN npx playwright install-deps webkit firefox

WORKDIR /app

COPY package*.json ./

# Install app dependencies
RUN npm install

# Install Playwright browsers (WebKit and Firefox)
RUN npx playwright install webkit firefox

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Start the bot
CMD ["npm", "start"]
