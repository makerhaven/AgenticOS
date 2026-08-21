# Graphify — the memory-graph engine (internal service, never public)
FROM node:20-alpine
WORKDIR /srv
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server.js ./
ENV VAULT_PATH=/vault
ENV PORT=4747
EXPOSE 4747
CMD ["node", "server.js"]
