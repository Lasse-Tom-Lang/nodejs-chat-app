FROM node:latest

WORKDIR /app

COPY /app/* ./

WORKDIR /server

COPY ./server/package*.json ./

RUN npm install

COPY ./server/* ./

EXPOSE 8080

RUN npx prisma generate