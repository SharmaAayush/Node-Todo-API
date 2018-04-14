const {User} = require('../models/user');

let authenticate = (req, res, next) => {
  let token = req.header('x-auth');

  User.findByToken(token).then((user) => {
    if (!user) {
      return Promise.reject();
    }

    req.user = user;
    req.token = token;
    next();
  }).catch((e) => {
    console.log('\x1b[31m%s\x1b[0m', `An error occured during authentication: ${e}`);
    res.status(401).send();
  })
}

module.exports = {authenticate};