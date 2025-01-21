# Use the official Node.js image as the base image
FROM node:20

# Create and change to the app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Compile TypeScript files
RUN npx tsc

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["npx", "ts-node", "--require", "./instrumentation.ts", "app.ts"]