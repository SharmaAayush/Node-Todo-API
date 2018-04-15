const sendmail = require('sendmail')({silent: true});

let mySendMail = (reciver, verificationLink) => {
  sendmail({
    from: 'shandilya.aayush@gmail.com',
    to: reciver,
    subject: 'Email verification link for TodoApp',
    html: `
    <h1 style="text-align: center;">Email verification for ${reciver}</h1>
    <span style="text-align: center;">To verify your email address please visit <a href="${verificationLink}" target="_blank">${verificationLink}</a></span><br>
    <p>If you didn't requested for an Email Verification link then you can safely ignore this link and no further action will bbe taken.</p><br>
    <p>This is a automatically generated mail. Please do not reply to this email</p>
    `
  }, function(err, reply) {
    if (err) {
      console.log('\x1b[31m%s\x1b[0m', err && err.stack);
    }
  })
}

module.exports = { mySendMail }