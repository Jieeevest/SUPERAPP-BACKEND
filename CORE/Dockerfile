# Use the official Node 20 base image with a slim variant for small size and efficiency
FROM --platform=linux/amd64 node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json files into the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Update Browserslist database
RUN npx update-browserslist-db@latest

# Rebuild native Node.js modules
RUN npm rebuild

# Copy all project files into the container
COPY . .

# Generate Prisma client (if there is a Prisma schema)
RUN npx prisma generate

# Build the Next.js application
#RUN npm run build

# Specify the port used by Next.js
EXPOSE 5001

# Run the application
#CMD ["npm", "run", "start"]
CMD ["npm", "run", "dev"]