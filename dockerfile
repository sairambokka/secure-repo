FROM node:18-alpine

LABEL maintainer="OEE IntelliSuite"
LABEL description="Secure Node.js application."

WORKDIR /usr/src/app

COPY package.json . 
