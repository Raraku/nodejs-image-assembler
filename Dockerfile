FROM node:17-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add  --no-cache ffmpeg

RUN npm install

COPY . .

ENV NODE_ENV=production

EXPOSE $PORT

CMD [ "node", "server.js" ]