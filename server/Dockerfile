FROM node:22.17.0-alpine

WORKDIR /app

COPY package*.json ./

# Install all dependencies including dev for TypeScript compilation
RUN npm install --include=dev

COPY . .

# Build TypeScript to JavaScript
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]