var env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
  console.log('\x1b[33m%s\x1b[0m', `${env} environment`);
  var config = require('./config.json');
  var envConfig = config[env];
  
  Object.keys(envConfig).forEach((key) => {
    process.env[key] = envConfig[key];
  });
}