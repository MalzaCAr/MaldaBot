FROM node:18
# Create app directory

ENV NODE_ENV production

USER node

COPY --chown=node:node . /usr/src/app

WORKDIR /usr/src/app
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm ci -- only=production
# If you are building your code for production
# RUN npm ci --omit=dev
# Bundle app source
COPY . .
EXPOSE 8080
CMD [ "node", "index.js" ]