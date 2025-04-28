# Use official Node.js image as the base
FROM node:14

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Copy the rest of the application
COPY . .

# Expose the port the app will run on
EXPOSE 4000

# Set environment variables
ENV NODE_ENV=development
ENV DATABASE_HOST=localhost
ENV DATABASE_USER=fazt
ENV DATABASE_PASSWORD=mypassword
ENV DATABASE_NAME=linksdb
ENV REDIS_HOST=redis


# Run the app
CMD ["sh", "-c", "rm -rf node_modules && npm install && node app.js"]

