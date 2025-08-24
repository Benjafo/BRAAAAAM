FROM node:22.17.0-alpine

WORKDIR /app

COPY package*.json ./

# dev dependencies for nodemon
RUN npm install --include=dev

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]