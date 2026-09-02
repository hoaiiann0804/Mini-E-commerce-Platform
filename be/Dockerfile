FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 8888
CMD ["sh", "-c", "npx sequelize-cli db:migrate && node src/server.js"]
