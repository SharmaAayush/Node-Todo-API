const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

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
        .end((err) => {
          if (err) {
            return done(err);
          }

          User.findOne({email}).then((user) => {
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
    })

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

  });

});