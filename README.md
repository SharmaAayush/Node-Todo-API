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

## API Routes

### USER Routes

#### POST /users

This is a **User Signup** route.
Send the user data as a *JSON object* in the body of the request.

The user data object requires three fields namely `username`, `email`, and `password`.
An example user data object would be like this:
```
{
  "username": "exampleUserName",
	"email" : "example@example.com",
	"password" : "password!"
}
```
- The `username` field is required and must be atleast 5 characters long.

  **Note** - Any leading and trailing spaces from the email field will be trimmed before saving them in the database.
- The `email` field is required and must be a valid email.
  
  **Note** - Only one user can be registerd with an email address.
  **Note** - Any leading and trailing spaces from the email field will be trimmed before saving them in the database.
- The `password` field is required and must be at least 6 characters long.
  
  **Note** - Passwords are salted and hashed before saving in the database using the `bcryptjs` library.

The response contains the partial user info namely the `_id` property which is the id of the user, `email` property which is the email id of the user, `username` property which contains the username of the user, and `emailVerified` property which contains the boolean value of whether the user's email is verified or not.

A jwt authentication token is also generated and sent as `x-auth` in the header of the response. This `x-auth` token can be used to access `Private routes` as long as the user does not logout.

#### POST /users/login

This is a **User Login** route.
Send the user data as a *Json object* in the body of the request.

The user data object requires two fields namely `email`, and `password`.
An example user data object would be like this:
```
{
	"email" : "example@example.com",
	"password" : "password!"
}
```

The `email` and `password` properties are same as those in `POST /users` route.

The response is same as that of the `POST /users` route.

**Note** - The password sent should be the one used during signup and not the one saved in the database after salting and hashing.

#### GET /users/me

This is a `Private route` i.e., a valid `x-auth` header is required to access this route.

The response is same as that of the `POST /users` route or `POST /users/login` route. The partial user object returned is the one to which the `x-auth` header belongs to.

#### GET /users/emailverification

This is a `Private route` i.e., a valid `x-auth` header is required to access this route.

Accessing this route will generate an email verification link and send it to the user's specified email address.

#### DELETE /users/me/token

This is a `Private route` i.e., a valid `x-auth` header is required to access this route.

This is a **User Logout** route. Send a valid `x-auth` token in the header of the request and that token will be removed from the database.

To generate a new token simply use the **User Login** route again with valid user credentials.

### TODO Routes

Todo routes are all private routes and need a valid `x-auth` header to access. In addition to a valid `x-auth` token, the email id of the user must be verified to allow access to these routes. If any these authentication fails, a 401 unauthorized access error will be returned.

#### POST /todos

This route is used to save the `todo` in the database. Simply pass the `todo` in the body as a *JSON object* with appropriate headers.

The todo object should be something like this:
```
{
	"title": "Some todo",
  "description": "description of the given Todo"
}
```

The required properties of a `todo` object are:

- `title` field: It is a required field and must be present. It must be atleast 4 characters long.
- `description` field: It is also a required field and must be present. It must be atleast 8 characters long.

Other allowed properties of a `todo` object are:

- `completed` field: It can be either `true` or `false` to represent whether the `todo` has been completed or not. Any value other then `true` will default to `false`.
- `reminder` field: It is the timestamp of the time when a reminder mail should be sent for this `todo`.

The response contains the `todo` object as saved in the database.

#### PATCH /todos/:id

This route is used to update a todo in the database.

Replace the `:id` part of the url with the `_id` property of the todo you want to update and send the updates in the body of the request as a *JSON object*.
An example url would be like `/todos/5a6747c92c47ed5c13d4b189`.

The `todo` object sent in the request is the same as that in `POST /todos`.

The response contains the `todo` object as updated in the database.

#### DELETE /todos/:id

This route is used to remove a todo from the database.

Simply replace the `:id` part of the url with the `_id` property of the todo you want to remove.

The `todo` must belong to the user requesting to delete the `todo` otherwise the server will respond with a 404 error.

The response body will contain the deleted `todo`.

#### GET /todos

This route is used to get all the `todos` related to the user whose `x-auth` token was passed in the header.

The response contains `todos` array which contains all the `todo` created by the user whose `x-auth` token was passed in the header.

#### GET /todos/:id

This route is used to get a single todo by its `_id` property.

Simply replace the `:id` part of the url with the `_id` property of the todo which you want to get.

An example url would be like `/todos/5a6747b12c47ed5c13d4b188`.

The response body will contain the requested `todo`.