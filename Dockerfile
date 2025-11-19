FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files only
COPY package.json ./

# Expose ports
EXPOSE 3000 24678

# Start dev server. --bun and --no-fork should be removed in production,
# both here and in the docker-compose.yml file
CMD ["bun", "--bun", "run", "dev", "--no-fork"]