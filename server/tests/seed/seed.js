const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const { Todo } = require('../../models/todo');
const { User } = require('../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();
const userThreeId = new ObjectID();

const users = [{
  _id: userOneId,
  username: "UserOne",
  email: "userOne@example.com",
  password: "userOnePass",
  emailVarified: true,
  tokens: [{
    access: "auth",
    token: jwt.sign({ _id: userOneId, access: "auth" }, process.env.JWT_SECRET).toString()
  }]
}, {
  _id: userTwoId,
  username: "UserTwo",
  email: "userTwo@example.com",
  password: "userTwoPass",
  emailVarified: true,
  tokens: [{
    access: "auth",
    token: jwt.sign({ _id: userTwoId, access: "auth" }, process.env.JWT_SECRET).toString()
  }]
}, {
  _id: userThreeId,
  username: "UserThree",
  email: "userThree@example.com",
  password: "userThreePass",
  emailVarified: false,
  tokens: [{
    access: "auth",
    token: jwt.sign({ _id: userThreeId, access: "auth" }, process.env.JWT_SECRET).toString()
  }],
  emailVerificationLink: new ObjectID()
}];

const todos = [{
  _id: new ObjectID(),
  title: "First Test Todo",
  description: "Description of First Test Todo",
  completed: false,
  _creator: userOneId
}, {
  _id: new ObjectID(),
  title: "Second Test Todo",
  description: "Description of Second Test Todo",
  completed: true,
  completedAt: 333,
  _creator: userTwoId
}];

const populateUsers = function (done) {
  this.timeout(0);
  User.remove({}).then(() => {
    let userOne = new User(users[0]).save();
    let userTwo = new User(users[1]).save();
    let userThree = new User(users[2]).save();

    return Promise.all([userOne, userTwo, userThree]);
  }, e => console.log(e)).then(() => done());
};

const populateTodos = function (done) {
  this.timeout(0);
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos);
  }, e => console.log(e)).then(() => done());
};

module.exports = { users, todos, populateTodos, populateUsers };