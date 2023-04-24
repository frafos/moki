ARG img=node:18
ARG img_prod=node:18-alpine
FROM ${img} as dev

ENV NODE_ENV=dev
ENV PORT=5000
ENV DEBUG=moki-express,express

RUN mkdir /etc/abc-monitor ; \
  echo "{}" > /etc/abc-monitor/defaults.json && \
  echo "{}" > /etc/abc-monitor/monitor.json

RUN npm install -g nodemon

EXPOSE $PORT

WORKDIR /app
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
# COPY package*.json /app/
COPY . .

CMD npm install && nodemon

FROM ${img_prod} as prod

WORKDIR /custom/app

ENV NODE_ENV=production
ENV PORT=5000

COPY . .
RUN npm install --omit=dev

EXPOSE $PORT

CMD npm run start
