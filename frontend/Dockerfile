FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for Vite/TS builds)
RUN npm install

# Copy source files
COPY . .

EXPOSE 5173

# Start Vite dev server bound to all interfaces so Docker port mapping works
CMD ["npm", "run", "dev"]
