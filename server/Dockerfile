# 1. Base Image: Use the official lightweight Node.js 22 runtime on Alpine Linux
FROM node:22-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy dependency definitions first (to take advantage of Docker layer caching)
COPY package*.json ./

# 4. Install only production dependencies cleanly (executes while building the image)
RUN npm ci --omit=dev

# 5. Copy the rest of the server source code into the container
COPY . .

# 6. Inform Docker that the container listens on port 5000
EXPOSE 5000

# 7. Start the backend server (executes while/for starting the container)
CMD ["node","server.js"]