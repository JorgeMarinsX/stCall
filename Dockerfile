FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files only
COPY package.json ./

# Expose ports
EXPOSE 3000 24678

# Start dev server
CMD ["bun", "run", "dev"]