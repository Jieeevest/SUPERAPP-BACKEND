# Use Node.js as the base image
FROM node:21-slim

# Set maintainer label
LABEL maintainer="Noxus"

# Create and set working directory
RUN mkdir -p /app
WORKDIR /app

# Copy the package files and install dependencies
COPY ./package.json ./

# Install application dependencies (including Fastify and Prisma)
RUN npm install --force

# Copy the rest of the application files
COPY . .

# Install Prisma CLI globally for database management
RUN npm install -g prisma

# Expose the port the application will run on
EXPOSE 5002

RUN npx prisma generate
CMD ["npm", "run", "dev"]
