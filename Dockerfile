FROM node:8.9.0

WORKDIR /fusion-orchestrate

COPY package.json yarn.lock /fusion-orchestrate/

RUN yarn
