FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy ONLY the built 'dist' folder from the builder stage into Nginx's public web folder
COPY --from=builder /app/dist /usr/share/nginx/html/

# 4. Standard web port for HTTP
EXPOSE 80

# 5. Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]