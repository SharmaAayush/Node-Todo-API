const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');
let jwt = require('jsonwebtoken');

const { app } = require('../server');
const { User } = require('../models/user');
const { Todo } = require('../models/todo');
const { users, todos, populateUsers, populateTodos } = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('User Route Tests', () => {

  describe('POST /users', () => {

    it('should create a new user', (done) => {
      let username = 'testUser';
      let email = 'testUser@example.com';
      let password = 'testPassword';

      request(app)
        .post('/users')
        .send({username, email, password})
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          User.findById(res.body._id).then((user) => {
            expect(user).toBeTruthy();
            expect(user.password).not.toBe(password);
            expect(user.username).toBe(username);
            done();
          }).catch(err => done(err));
        });
    });

    it('should return validation error if request is invalid', (done) => {
      let username = 'testUser';
      let email = 'testUser';
      let password = 'testPassword';

      request(app)
        .post('/users')
        .send({username, email, password})
        .expect(400)
        .end(done);
    });

    it('should return an error for requests with incomplete data', (done) => {
      let email = "testUser@example.com";
      let password = "testPassword";

      request(app)
        .post('/users')
        .send({email, password})
        .expect(400)
        .end(done);
    })

    it('should not create a user if the email is already in use', (done) => {
      let username = 'testUser';
      let email = users[0].email;
      let password = 'testPassword';

      request(app)
        .post('/users')
        .send({username, email, password})
        .expect(400)
        .end(done)
    });

  });

  describe('GET /users/me', () => {

    it('should return user if authenticated', (done) => {
      request(app)
        .get('/users/me')
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(users[0]._id.toHexString());
          expect(res.body.email).toBe(users[0].email);
          expect(res.body.emailVarified).toBe(users[0].emailVarified);
          expect(res.body.username).toBe(users[0].username);
        })
        .end(done);
    });

    it('should return an authentication error if unauthenticated user sends request', (done) => {
      request(app)
        .get('/users/me')
        .expect(401)
        .expect((res) => {
          expect(res.body).toEqual({});
        })
        .end(done);
    });

    it('should return an authentication error if authentication token was not generated by the backend', (done) => {
      let token = jwt.sign({
        _id: users[0]._id.toHexString(),
        access: 'auth'
      }, 'some secret used by user to generate custom token').toString();

      request(app)
        .get('/users/me')
        .set('x-auth', token)
        .expect(401)
        .end(done);
    });

  });

  describe('POST /users/login', () => {

    it('should login a valid user and return auth token', (done) => {
      request(app)
        .post('/users/login')
        .send({
          email: users[1].email,
          password: users[1].password
        })
        .expect(200)
        .expect((res) => {
          expect(res.headers['x-auth']).toBeTruthy();
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          User.findById(users[1]._id).then((user) => {
            expect(user.toObject().tokens[1]).toMatchObject({
              access: 'auth',
              token: res.headers['x-auth']
            });
            done();
          }).catch(e => done(e));
        });
    });

    it('should reject invalid login', (done) => {
      request(app)
        .post('/users/login')
        .send({
          email: users[1].email,
          password: users[1].password + 1
        })
        .expect(400)
        .expect(res => {
          expect(res.headers['x-auth']).toBeFalsy();
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          User.findById(users[1]._id).then((user) => {
            expect(user.tokens.length).toBe(1);
            done();
          }).catch(e => done(e));
        });
    });

  });

  describe('DELETE /users/me/token', () => {

    it('should remove auth token on logout', (done) => {
      request(app)
        .delete('/users/me/token')
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          User.findById(users[0]._id).then(user => {
            expect(user.tokens.length).toBe(0);
            done();
          }).catch(e => done(e));
        });
    });

    it('should return a 401 error for unauthenticated access', (done) => {
      request(app)
        .delete('/users/me/token')
        .expect(401)
        .end(err => {
          if (err) {
            return done(err);
          }

          done();
        });
    });

    it('should return a 401 error if authentication token used was not generated by the backend', (done) => {
      let token = jwt.sign({
        _id: users[0]._id.toHexString(),
        access: 'auth'
      }, 'some secret used by user to generate custom token').toString();

      request(app)
        .delete('/users/me/token')
        .set('x-auth', token)
        .expect(401)
        .end(done);
    });

  });

  describe('GET /users/emailVerification', () => {

    it('should generate a email verification link for authenticated users', (done) => {
      request(app)
        .get('/users/emailVerification')
        .set('x-auth', users[2].tokens[0].token)
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          User.findById(users[2]._id).then(user => {
            expect(user.emailVerificationLink).toBeTruthy();
            done();
          }).catch(e => done(e));
        });
    });

    it('should reject unauthenticated acces with a 401 error code', (done) => {
      request(app)
        .get('/users/emailVerification')
        .expect(401)
        .end(err => {
          if (err) {
            done(err);
          }

          done();
        });
    });

    it('should return a 401 error if authentication token being used was not generated by the backend', (done) => {
      let token = jwt.sign({
        _id: users[0]._id.toHexString(),
        access: 'auth'
      }, 'some secret used by user to generate custom token').toString();
      
      request(app)
        .get('/users/emailVerification')
        .set('x-auth', token)
        .expect(401)
        .end(done);
    });

  });

  describe('GET /users/verify', () => {

    it("should verify the user's email when requested with proper query parameters", (done) => {
      request(app)
        .get('/users/verify')
        .query({
          email: users[2].email,
          vk: users[2].emailVerificationLink.toHexString()
        })
        .expect(200)
        .expect(res => {
          expect(res.body.user.email).toBe(users[2].email);
          expect(res.body.user.emailVarified).toBeTruthy();
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          User.findById(users[2]._id).then(user => {
            expect(user.emailVarified).toBeTruthy();
            expect(user.email).toBe(res.body.user.email);
            done();
          }).catch(e => done(e));
        });
    });

    it("should return a 400 error for request without query parameters", (done) => {
      request(app)
        .get('/users/verify')
        .expect(400)
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          done();
        });
    });

    it("should return a 400 error with a message if a user with provided email does not exist", (done) => {
      request(app)
        .get('/users/verify')
        .query({
          email: 'invalidUser@example.com',
          vk: new ObjectID().toHexString()
        })
        .expect(400)
        .expect(res => {
          expect(res.body.error).toBeTruthy();
          expect(typeof res.body.error).toBe("string");
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it("should return a 400 if verification query param was not generated by the backend", (done) => {
      request(app)
        .get('/users/verify')
        .query({
          email: users[2].email,
          vk: new ObjectID().toHexString()
        })
        .expect(400)
        .expect(res => {
          expect(res.body.error).toBeTruthy();
          expect(typeof res.body.error).toBe("string");
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          done();
        });
    });

  });

});

describe('Todo Route Tests', () => {

  describe('POST /todos', () => {

    it('should return 401 error for unauthenticated access to this route', (done) => {
      let todo = {
        title: 'testTodoTitle',
        description: 'testDescription'
      };

      request(app)
        .post('/todos')
        .send(todo)
        .expect(401)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should return an authentication error if authentication token was not generated by the backend', (done) => {
      let token = jwt.sign({
        _id: users[0]._id.toHexString(),
        access: 'auth'
      }, 'some secret used by user to generate custom token').toString();
      let todo = {
        title: 'testTodoTitle',
        description: 'testDescription'
      };

      request(app)
        .post('/todos')
        .set('x-auth', token)
        .send(todo)
        .expect(401)
        .end(err => {
          if (err) {
            return done(err);
          }

          done();
        });
    });

    it('should return 401 error for user accessing this route without verifying their email', (done) => {
      let todo = {
        title: 'testTodoTitle',
        description: 'testDescription'
      };

      request(app)
        .post('/todos')
        .set('x-auth', users[2].tokens[0].token)
        .send(todo)
        .expect(401)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should not create a new todo if incomplete todo is provided', (done) => {
      let todo = {
        title: 'testTodoTitle'
      };

      request(app)
        .post('/todos')
        .set('x-auth', users[0].tokens[0].token)
        .send(todo)
        .expect(400)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should create a new todo if an authenticated user requests with with valid todo', (done) => {
      let todo = {
        title: 'testTodoTitle',
        description: 'testDescription'
      };

      request(app)
        .post('/todos')
        .set('x-auth', users[0].tokens[0].token)
        .send(todo)
        .expect(200)
        .expect(res => {
          expect(res.body.title).toBe(todo.title);
          expect(res.body.description).toBe(todo.description);
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          Todo.findById(res.body._id).then(todo => {
            expect(todo.title).toBe(res.body.title);
            expect(todo._creator.toHexString()).toBe(users[0]._id.toHexString());
            done();
          }).catch(e => done(e));
        });
    });

    it('should create a new todo without reminder if invalid reminder date was provided', (done) => {
      let todo = {
        title: 'testTodoTitle',
        description: 'testDescription',
        reminder: 'invalid date format'
      };

      request(app)
        .post('/todos')
        .set('x-auth', users[0].tokens[0].token)
        .send(todo)
        .expect(200)
        .expect(res => {
          expect(res.body.reminder).toBeFalsy();
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          Todo.findById(res.body._id).then(todo => {
            expect(todo._creator.toHexString()).toBe(users[0]._id.toHexString());
            expect(todo.reminder).toBeFalsy();
            done();
          }).catch(e => done(e));
        });
    });

    it('should not take the completedAt attribute value from the user', (done) => {
      let todo = {
        title: 'testTodoTitle',
        description: 'testDescription',
        completed: true,
        completedAt: 24514
      };

      request(app)
        .post('/todos')
        .set('x-auth', users[0].tokens[0].token)
        .send(todo)
        .expect(200)
        .expect(res => {
          expect(res.body.title).toBe(todo.title);
          expect(res.body.description).toBe(todo.description);
          expect(res.body.completed).toBe(todo.completed);
          expect(new Date(res.body.completedAt).getTime()).not.toBe(new Date(todo.completedAt).getTime());
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          Todo.findById(res.body._id).then(data => {
            expect(data._creator.toHexString()).toBe(users[0]._id.toHexString());
            expect(data.completed).toBe(true);
            expect(new Date(data.completedAt).getTime()).not.toBe(new Date(todo.completedAt).getTime());
            expect(new Date(data.completedAt).getTime()).toBe(new Date(res.body.completedAt).getTime());
            done();
          }).catch(e => done(e));
        });
    });

  });

  describe('GET /todos', () => {

    it('should return a 401 error for unauthenticated access to this route', (done) => {
      request(app)
        .get('/todos')
        .expect(401)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should return an authentication error if authentication token was not generated by the backend', (done) => {
      let token = jwt.sign({
        _id: users[0]._id.toHexString(),
        access: 'auth'
      }, 'some secret used by user to generate custom token').toString();

      request(app)
        .get('/todos')
        .set('x-auth', token)
        .expect(401)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should return a 401 error for user accessing this route without verifying their email first', (done) => {
      request(app)
        .get('/todos')
        .set('x-auth', users[2].tokens[0].token)
        .expect(401)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should return all todos of an authenticated user', (done) => {
      request(app)
        .get('/todos')
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect(res => {
          expect(res.body.todos.length).toBe(1);
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          Todo.find({_creator: users[0]._id}).then(todos => {
            expect(todos.length).toBe(res.body.todos.length);
            done();
          }).catch(e => done(e));
        });
    });

  });

  describe('GET /todos/:id', () => {

    it('should return 401 for unauthenticated access tto this route', (done) => {
      request(app)
        .get(`/todos/${todos[0]._id}`)
        .expect(401)
        .end(err => {
          if (err) {
            done(err);
          }
          done();
        });
    });

    it('should return an authentication error if authentication token was not generated by the backend', (done) => {
      let token = jwt.sign({
        _id: users[0]._id.toHexString(),
        access: 'auth'
      }, 'some secret used by user to generate custom token').toString();

      request(app)
        .get(`/todos/${todos[0]._id}`)
        .set('x-auth', token)
        .expect(401)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should return 401 error for user accessing this route without verifying their email first', (done) => {
      request(app)
        .get(`/todos/${todos[0]._id}`)
        .set('x-auth', users[2].tokens[0].token)
        .expect(401)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should return 404 error if invalid todo id is used', (done) => {
      request(app)
        .get('/todos/24514221')
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it("should return 404 if the token's id doesn't belong to the user requesting for the todo", (done) => {
      request(app)
        .get(`/todos/${todos[1]._id}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should return the todo if an authenticated user requests for a todo belonging to him', (done) => {
      request(app)
        .get(`/todos/${todos[0]._id}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect(res => {
          expect(res.body.todo._id).toBe(todos[0]._id.toHexString());
          expect(res.body.todo.title).toBe(todos[0].title);
          expect(res.body.todo.description).toBe(todos[0].description);
          expect(res.body.todo._creator).toBe(todos[0]._creator.toHexString());
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          Todo.findOne({_id: res.body.todo._id, _creator: res.body.todo._creator}).then(todo => {
            expect(todo._id.toHexString()).toBe(todos[0]._id.toHexString());
            expect(todo._creator.toHexString()).toBe(todos[0]._creator.toHexString());
            expect(todo.title).toBe(todos[0].title);
            expect(todo.description).toBe(todos[0].description);
            done();
          }).catch(e => done(e));
        });
    });

  });

  describe('DELETE /todos/:id', () => {

    it('should return 401 for unauthenticated access tto this route', (done) => {
      request(app)
        .delete(`/todos/${todos[0]._id}`)
        .expect(401)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should return an authentication error if authentication token was not generated by the backend', (done) => {
      let token = jwt.sign({
        _id: users[0]._id.toHexString(),
        access: 'auth'
      }, 'some secret used by user to generate custom token').toString();

      request(app)
        .delete(`/todos/${todos[0]._id}`)
        .set('x-auth', token)
        .expect(401)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should return 401 error for user accessing this route without verifying their email first', (done) => {
      request(app)
        .delete(`/todos/${todos[0]._id}`)
        .set('x-auth', users[2].tokens[0].token)
        .expect(401)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should return 404 error if invalid todo id is used', (done) => {
      request(app)
        .delete('/todos/24514221')
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it("should not delete the todo if it doesn't belong to the requesting user", (done) => {
      request(app)
        .delete(`/todos/${todos[0]._id}`)
        .set('x-auth', users[1].tokens[0].token)
        .expect(404)
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          Todo.find({_creator: users[0]._id}).then(todos => {
            expect(todos.length).toBe(1);
            expect(todos[0]._id.toHexString()).toBe(todos[0]._id.toHexString());
            done();
          }).catch(e => done(e));
        });
    });

    it('should delete the todo if it belongs to the requesting user', (done) => {
      request(app)
        .delete(`/todos/${todos[0]._id}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect(res => {
          expect(res.body.todo._id).toBe(todos[0]._id.toHexString());
          expect(res.body.todo.title).toBe(todos[0].title);
          expect(res.body.todo.description).toBe(todos[0].description);
          expect(res.body.todo._creator).toBe(todos[0]._creator.toHexString());
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          
          Todo.find({_creator: users[0]._id}).then(todos => {
            expect(todos.length).toBe(0);
            done();
          }).catch(e => done(e));
        });
    });

  });

  describe('PATCH /todos/:id', () => {

    it('should return 401 for unauthenticated access to this route', (done) => {
      let todo = {
        title: "updatedTestTodo",
        completed: true
      };

      request(app)
        .patch(`/todos/${todos[0]._id}`)
        .send(todo)
        .expect(401)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should return an authentication error if authentication token was not generated by the backend', (done) => {
      let todo = {
        title: "updatedTestTodo",
        completed: true
      };
      let token = jwt.sign({
        _id: users[0]._id.toHexString(),
        access: 'auth'
      }, 'some secret used by user to generate custom token').toString();

      request(app)
        .patch(`/todos/${todos[0]._id}`)
        .set('x-auth', token)
        .send(todo)
        .expect(401)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should return 401 error for user accessing this route without verifying their email first', (done) => {
      let todo = {
        title: "updatedTestTodo",
        completed: true
      };

      request(app)
        .patch(`/todos/${todos[0]._id}`)
        .set('x-auth', users[2].tokens[0].token)
        .send(todo)
        .expect(401)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should return 404 error if invalid todo id is used', (done) => {
      let todo = {
        title: "updatedTestTodo",
        completed: true
      };

      request(app)
        .patch(`/todos/24514221`)
        .set('x-auth', users[0].tokens[0].token)
        .send(todo)
        .expect(404)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it("should not update todo if it doesn't belong to the requesting user", (done) => {
      let todo = {
        title: "updatedTestTodo",
        completed: true
      };

      request(app)
        .patch(`/todos/${todos[0]._id}`)
        .set('x-auth', users[1].tokens[0].token)
        .send(todo)
        .expect(404)
        .end(err => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it("should update the todo if it belongs to the requesting user", (done) => {
      let todo = {
        title: "updatedTestTodo",
        completed: true
      };

      request(app)
        .patch(`/todos/${todos[0]._id}`)
        .set('x-auth', users[0].tokens[0].token)
        .send(todo)
        .expect(200)
        .expect(res => {
          expect(res.body.todo._id).toBe(todos[0]._id.toHexString());
          expect(res.body.todo.title).toBe(todo.title);
          expect(res.body.todo.completed).toBe(todo.completed);
          expect(res.body.todo.completedAt).toBeTruthy();
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          Todo.findById(todos[0]._id).then(data => {
            expect(data._id.toHexString()).toBe(res.body.todo._id);
            done();
          }).catch(e => done(e));
        });
    });

  });

});