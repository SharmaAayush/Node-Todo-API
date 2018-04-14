const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');

const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

const app = express();

const PORT = 3000;

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
  var todo = new Todo({
    description: req.body.description,
    title: req.body.title,
    reminder: req.body.reminder
  });

  todo.save().then((doc) => {
    console.log('\x1b[34m%s\x1b[0m', `Added a new Todo ${todo}`);
    res.status(200).send(doc);
  }, (e) => {
    console.log(`\x1b[31m%s\x1b[0m`, `An error occured on POST /todos: ${e}`);
    res.status(400).send(e);
  })
});

app.get('/todos', (req, res) => {
  Todo.find().then((todos) => {
    res.status(200).send({
      todos
    });
  }, (e) => {
    console.log('\x1b[31m%s\x1b[0m', `An error occured on GET /todos: ${e}`);
    res.status(400).send(e);
  });
});

app.get('/todos/:id', (req, res) => {
  let id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findById(id).then((todo) => {
    if (todo) {
      return res.status(404).send();
    }

    res.status(200).send({ todo });
  }, (e) => {
    console.log('\x1b[31m%s\x1b[0m', `An error occured on GET /todos/${req.params.id} : ${e}`);
    res.status(400).send();
  });

});

app.delete('/todos/:id', (req, res) => {
  let id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findByIdAndRemove(id).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }

    res.status(200).send({ todo });
  }, (e) => {
    console.log('\x1b[31m%s\x1b[0m', `An error occured on DELETE /todos/${id} : ${e}`);
    res.status(400).send();
  });

});

app.patch('/todos/:id', (req, res) => {
  let id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  let body = _.pick(req.body, ['title', 'description', 'completed', 'reminder']);

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  if (_.isNumber(body.reminder)) {
    body.reminder = new Date(body.reminder).getTime();
  } else {
    body.reminder = null;
  }

  Todo.findByIdAndUpdate(id, {
    $set: body
  }, {
      new: true
    }).then((todo) => {
      if (!todo) {
        return res.status(404).send();
      }

      res.send({ todo })
    }, (e) => {
      console.log('\x1b[31m%s\x1b[0m', `An error occured on PATCH /todos/${id} : ${e}`);
      res.status(400).send();
    })
});

app.post('/users', (req, res) => {
  let body = _.pick(req.body, ['username', 'email', 'password']);
  let user = new User(body);

  user.save().then((user) => {
    res.status(200).send(user);
  }).catch((e) => {
    res.status(400).send(e);
  });
});

app.listen(PORT, () => {
  console.log('\x1b[32m%s\x1b[0m', `Server running on port ${PORT}`);
});