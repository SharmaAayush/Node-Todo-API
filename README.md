# Node-Todo

Node Todo is a REST API created using [Express.js](http://expressjs.com) and [Node.js](https://nodejs.org/). It supports user authentication routes and user specific Todo related routes.

## Requirements

This API uses MongoDB Database and Node development environment.
You can get MongoDB from [here](https://www.mongodb.com/download-center).
You can get Node from [here](https://nodejs.org/).

## Configuration

This API uses environment variables. There are three modes for this API namely `development`, `test`, and `production`. If the `NODE_ENV` environment variable is set to `test`, the API will run in testing mode. If the `NODE_ENV` environment variable is not set or is set to `development` then the API will run in development mode. If the `NODE_ENV` environment variable is set to anything other than `test` or `development` then the API will run in production mode.

To configure this API, make sure the following environment variables are present.
```
  EMAIL_ID: SMTP email ID to be used for sending emails.
  EMAIL_PASSWORD: password of the email ID to be used for sending emails.
  JWT_SECRET: Any random string that is to be used for creating JWT tokens.
  MONGODB_URI: URI of the MongoDB to be used.
  URL: base URL at which this API will run.
```
`EMAIL_ID` and `EMAIL_PASSWORD` are needed as they will be used for sending email verification links and reminder mails. `JWT_SECRET` should be a long and random string as it will be used to generate JWT authentication tokens. `MONGODB_URI` is the URI to the MongoDB to be used. If a local instance of MongoDB is used then it will be something like `mongodb://localhost:27017/TodoAppTest`. `URL` is the base URL at which the API will run. If running locally without setting the `PORT` environment variable then it should be something like `http://localhost:3000/`. `URL` environment variable should be the url at which the API will run after it is started. The API will use it to generate email erification links. API will not configure itself to run on the URL provided but rather assume that this is the address at which the API is running.

For `test` and `development` mode, the environment variables will be taken from `config.json` file from `server/config` directory. This `config.json` file should contain two properties namely `test` and `development` for their respective mode.
An example `config.json` file would be like this:
```
{
  "test": {
    "PORT": YOUR_PORT_NUMBER,
    "MONGODB_URI": "YOUR_TEST_MONGO_DATABASE_URI",
    "JWT_SECRET": "YOUR_JWT_SECRET_STRING",
    "EMAIL_PASSWORD": "YOUR EMAIL PASSWORD TO BE USED",
    "EMAIL_ID": "YOUR EMAIL ID TO BE USED",
    "URL": "URL AT WHICH API WILL RUN"
  },
  "development": {
    "PORT": YOUR_PORT_NUMBER,
    "MONGODB_URI": "YOUR_DEVELOPMENT_MONGO_DATABASE_URI",
    "JWT_SECRET": "YOUR_JWT_SECRET_STRING",
    "EMAIL_PASSWORD": "YOUR EMAIL PASSWORD TO BE USED",
    "EMAIL_ID": "YOUR EMAIL ID TO BE USED",
    "URL": "URL AT WHICH API WILL RUN"
  }
}
```

## Starting Server

It is assumed from here on that you have a MongoDB environment running at the specified `MONGODB_URI`. You can check how to install and run MongoDB on [Windows](https://docs.mongodb.com/tutorials/install-mongodb-on-windows/), [Linux](https://docs.mongodb.com/tutorials/install-mongodb-on-ubuntu/), or [macOS](https://docs.mongodb.com/tutorials/install-mongodb-on-os-x/) at the provided links.

To start the REST API server:

1. Make sure to download [Node.js](https://nodejs.org/en/).
2. Make sure to create a `config.js` file as mentioned in `Configuration` up above if running in `development` mode.
3. Run the command `npm install` and wait for it to install all the dependencies.
4. Run the command `npm start` to start the server.

## Testing

To run tests:

1. Make sure all the dependencies and devDependencies are installed by running `npm i` and then `npm i --only=dev`
2. Make sure to create a `config.js` file as mentioned in `Configuration` up above for `test` mode.
3. 1. To run tests once, run `npm run test`.
   2. To generate the test report, run `npm run test-report`. It will generate an HTML report in `mochawesome-report/mochawesome.html`.
   3. To run the test cases in live-reload mode to re-run the suite as you create new tests, run the command `npm run test-watch`.
