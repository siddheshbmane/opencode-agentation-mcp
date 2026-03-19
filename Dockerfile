FROM node:20-alpine

WORKDIR /app

# Install Agentation MCP globally
RUN npm install -g agentation-mcp

# Expose port
EXPOSE 4747

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4747/health || exit 1

# Start server
CMD ["npx", "agentation-mcp", "server", "--port", "4747"]
