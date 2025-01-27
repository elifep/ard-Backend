#Development stage
FROM node:22-alpine as dev

#Define working directory in container
WORKDIR /user/src/app

#Copy package.json to container
COPY package*.json ./
RUN npm install

#Copy all files to container
COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]