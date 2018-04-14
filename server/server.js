const express = require('express');
const bodyParser = require('body-parser');

const {mongoose} = require('./db/mongoose');
const {Todo} = require('./models/todo');
const {User} = require('./models/user');

const app = express();

const PORT = 3000;

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
  var todo = new Todo({
    description: req.body.description,
    title: req.body.title
  });

  todo.save().then((doc) => {
    console.log('\x1b[34m%s\x1b[0m', `Added a new Todo ${todo}`);
    res.status(200).send(doc);
  }, (e) => {
    console.log(`\x1b[31m%s\x1b[0m`, `An error occured on GET /todos: ${e}`);
    res.status(400).send(e);
  })
});

app.listen(PORT, () => {
  console.log('\x1b[32m%s\x1b[0m', `Server running on port ${PORT}`);
});