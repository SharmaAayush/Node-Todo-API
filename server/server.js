require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');
const path = require('path');

const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');
const { authenticate, authenticateEmail } = require('./middleware/authenticate');
const { sendReminders } = require('./scheduler/scheduler');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/todos', [authenticate, authenticateEmail], (req, res) => {
  var todo = new Todo({
    description: req.body.description,
    title: req.body.title,
    _creator: req.user._id
  });

  if (!(new Date(req.body.reminder) == 'Invalid Date')) {
    todo.reminder = new Date(req.body.reminder).getTime();
  } else {
    todo.reminder = null;
  }

  todo.save().then((doc) => {
    console.log('\x1b[34m%s\x1b[0m', `Added a new Todo ${todo}`);
    res.status(200).send(doc);
  }, (e) => {
    console.log(`\x1b[31m%s\x1b[0m`, `An error occured on POST /todos: ${e}`);
    res.status(400).send(e);
  })
});

app.get('/todos', [authenticate, authenticateEmail], (req, res) => {
  Todo.find({
    _creator: req.user._id
  }).then((todos) => {
    res.status(200).send({
      todos
    });
  }, (e) => {
    console.log('\x1b[31m%s\x1b[0m', `An error occured on GET /todos: ${e}`);
    res.status(400).send(e);
  });
});

app.get('/todos/:id', [authenticate, authenticateEmail], (req, res) => {
  let id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findOne({
    _id: id,
    _creator: req.user._id
  }).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }

    res.status(200).send({ todo });
  }, (e) => {
    console.log('\x1b[31m%s\x1b[0m', `An error occured on GET /todos/${req.params.id} : ${e}`);
    res.status(400).send();
  });

});

app.delete('/todos/:id', [authenticate, authenticateEmail], (req, res) => {
  let id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findOneAndRemove({
    _id: id,
    _creator: req.user._id
  }).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }

    res.status(200).send({ todo });
  }, (e) => {
    console.log('\x1b[31m%s\x1b[0m', `An error occured on DELETE /todos/${id} : ${e}`);
    res.status(400).send();
  });

});

app.patch('/todos/:id', [authenticate, authenticateEmail], (req, res) => {
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

  if (!(new Date(body.reminder) == 'Invalid Date')) {
    body.reminder = new Date(body.reminder).getTime();
  } else {
    body.reminder = null;
  }

  Todo.findOneAndUpdate({
    _id: id,
    _creator: req.user._id
  }, {
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

  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    res.header('x-auth', token).status(200).send(user);
  }).catch((e) => {
    res.status(400).send(e);
  });
});

app.get('/users/me', authenticate, (req, res) => {
  res.status(200).send(req.user);
});

app.post('/users/login', (req, res) => {
  let body = _.pick(req.body, ['email', 'password']);

  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).status(200).send(user);
    });
  }).catch((e) => {
    res.status(400).send();
  })
});

app.get('/users/emailverification', authenticate, (req, res) => {
  let user = req.user;
  user.getEmailVerificationLink().then(() => {
    res.status(200).send();
  }).catch((e) => {
    res.status(400).send();
  });
});

app.get('/users/verify', (req, res) => {
  let email = req.query.email;
  let verificationID = req.query.vk;
  if (!ObjectID.isValid(verificationID)) {
    return res.status(400).send();
  }
  verificationID = new ObjectID(verificationID);
  let timeDiff = new Date().getTime() - verificationID.getTimestamp().getTime();
  let isLinkExpired = timeDiff / (60000) > 30;
  if (isLinkExpired) {
    return res.status(400).send({
      error: `Email Verification failed. Your email verification link has expired. Please request for another verifiaction link.`
    });
  }
  User.findByEmail(email).then((user) => {
    let isVerified = verificationID.toString() == user.emailVerificationLink.toString();
    if (!isVerified) {
      return Promise.reject();
    } else {
      user.verifyEmail().then((user) => {
        res.status(200).send({ user });
      });
    }
  }).catch((e) => {
    res.status(400).send({
      error: `Email Verification failed. Please request for another verification link.`
    });
  });
});

app.delete('/users/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send();
  }, (e) => {
    res.status(400).send();
  })
});

app.use(express.static(path.join(__dirname + './../mochawesome-report')));

app.get('/test-report', (req, res) => {
  res.sendFile(path.join(__dirname + './../mochawesome-report/mochawesome.html'));
});

sendReminders();

setInterval(sendReminders, 299950);

app.listen(PORT, () => {
  console.log('\x1b[32m%s\x1b[0m', `Server running on port ${PORT}`);
});

module.exports.app = app;