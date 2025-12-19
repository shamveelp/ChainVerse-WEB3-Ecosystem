# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install deps (including dev)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy everything
COPY . .

# Expose Next.js dev server port
EXPOSE 3000

# Run in development mode
CMD ["npm", "run", "dev"]