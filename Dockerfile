# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy rest of the app
COPY . .

# ✅ This renames .env.production to .env inside container
COPY .production.env .env

# Build the project
RUN npm run build

# Expose the port (default NestJS runs on 3000)
EXPOSE 3000

# Run the built app
CMD ["npm", "run", "start:prod"]
