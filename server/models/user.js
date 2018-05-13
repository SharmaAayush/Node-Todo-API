const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const { ObjectID } = require('mongodb');
const { Schema } = mongoose;

const { mySendMail } = require('../mailer_service/mailer_service');

let UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 5
  },
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{value} is not a valid email'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  emailVarified: {
    type: Boolean,
    default: false
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }],
  emailVerificationLink: {
    type: Schema.Types.ObjectId,
    default: null
  }
});

UserSchema.methods.toJSON = function () {
  let user = this;
  let userObject = user.toObject();
  return _.pick(userObject, ['_id', 'username', 'email', 'emailVarified']);
};

UserSchema.methods.generateAuthToken = function () {
  let user = this;
  let access = 'auth';
  let token = jwt.sign({
    _id: user._id.toHexString(),
    access
  }, process.env.JWT_SECRET).toString();

  user.tokens = user.tokens.concat([{ access, token }]);

  return user.save().then(() => {
    return token;
  });
};

UserSchema.methods.removeToken = function (token) {
  let user = this;

  return user.update({
    $pull: {
      tokens: { token }
    }
  });
};

UserSchema.methods.getEmailVerificationLink = function () {
  let user = this;
  let emailVerificationLink = new ObjectID();
  user.emailVerificationLink = emailVerificationLink;
  return user.save().then(() => {
    let mailVerificationLink = `${process.env.URL}users/verify?email=${user.email}&vk=${emailVerificationLink}`;
    mySendMail(user.email, mailVerificationLink);
  });
};

UserSchema.statics.findByEmail = function (email) {
  let User = this;

  return User.findOne({
    email: email
  }).then((doc) => {
    if (!doc) {
      return Promise.reject();
    }
    return doc;
  });
};

UserSchema.methods.verifyEmail = function () {
  let user = this;
  user.emailVarified = true;
  return user.save().then(() => {
    return user;
  });
}

UserSchema.statics.findByToken = function (token) {
  let User = this;
  let decoded = undefined;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return Promise.reject('Invalid Token was used');
  }

  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  })
};

UserSchema.statics.findByCredentials = function (email, password) {
  let User = this;

  return User.findOne({ email }).then((user) => {
    if (!user) {
      return Promise.reject();
    }

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user);
        } else {
          reject();
        }
      });
    });
  });
};

UserSchema.pre('save', function (next) {
  let user = this;
  if (user.isModified('password')) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

let User = mongoose.model('User', UserSchema);

module.exports = { User }