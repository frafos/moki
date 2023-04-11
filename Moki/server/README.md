# Moki Server

Moki Server is an API written in NodeJS using the Express framework. The API
provides a Swagger documentation available at `/api/docs`.

## Getting Started

### Installation

1. Install all the required packages by running `npm install`.
1. Create a `.env` file in the root directory with the following skeleton:

```bash
NODE_ENV=dev 
PORT=5000 
ES=http://elasticsearch-url:port
LOGSTASH=http://logstash-url:port
```

Replace the `ELASTICSEARCH_URL` and `LOGSTASH_URL` placeholders with your
Elasticsearch and Logstash URLs, respectively.

### Development

To run the server in development mode, run `npm run dev`. The server will reload
automatically when you make changes to any file.

You can access the API at `http://127.0.0.1:PORT/api`.

### Docker

You can also run the Moki Server in Docker by following these steps:

1. Run `make build` to build the Docker image.
1. Run `npm install` to install the `node_modules` folder (which is not included
   in the Docker image).
1. Run `make run` to start the Docker container.

## Production

The Dockerfile contains two stages, `dev` and `prod`. To build the
production-ready Docker image, provide the `--target`argument to`docker build`.

1. Run `make build -e TARGET=prod` to build the container image.
1. Run `make run` to start the container.

## Targets

| **target** | **description**                          |      **where** |
| :--------- | :--------------------------------------- | -------------: |
| `lint`     | run eslint                               | `package.json` |
| `lintfix`  | run eslint + fixer                       | `package.json` |
| `pretty`   | run prettier                             | `package.json` |
| `start`    | start the API server                     | `package.json` |
| `test`     | run the test via mocha                   | `package.json` |
| `swagger`  | generate a swagger.json file             | `package.json` |
| `coverage` | generate code coverage                   | `package.json` |
| `codecov`  | generate and publish coverage to codecov | `package.json` |
