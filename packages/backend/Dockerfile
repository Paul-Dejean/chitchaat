FROM node:22-alpine

RUN apk add --no-cache linux-headers
RUN apk add --no-cache python3 py3-pip
RUN apk add --no-cache build-base python3-dev

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "start:dev"]
