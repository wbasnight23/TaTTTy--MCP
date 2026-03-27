FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build: TypeScript compile + Vite bundle the UI
RUN npm run build

# Expose port (Railway/Render will set PORT env var)
EXPOSE 3001

# Start the MCP HTTP server
CMD ["node", "dist/main.js"]
