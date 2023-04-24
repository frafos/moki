ARG img=node:18
ARG img_nginx=nginx:alpine
FROM ${img} as dev

WORKDIR /app

# install app dependencies
COPY package.json ./
RUN npm install

ENV PATH=$PATH:/app/node_modules/.bin

# Copy source
COPY . ./

CMD npm start

FROM ${img} as build

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

# multistage build...
# this runs a lil nginx instance to serve the app
FROM ${img_nginx} as prod

EXPOSE 3000
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
