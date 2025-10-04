FROM node:22.19.0-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Execute build during runtime
CMD ["sh", "-c", "npm run build && npm run dev"]

EXPOSE 5173
