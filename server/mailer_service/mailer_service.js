const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'todoapp90@gmail.com',
    pass: process.env.EMAIL_PASSWORD
  }
});

let mySendMail = (reciver, verificationLink) => {
  let mailOptions = {
    from: 'TodoApp.Aayush@gmail.com',
    to: reciver,
    subject: 'Email verification link for TodoApp',
    html: `
    <h1 style="text-align: center;">Email verification for ${reciver}</h1>
    <span style="text-align: center;">To verify your email address please visit <a href="${verificationLink}" target="_blank">${verificationLink}</a></span><br>
    <p>If you didn't requested for an Email Verification link then you can safely ignore this link and no further action will be taken.</p>
    `
  };
  transporter.sendMail(mailOptions, function(err, info) {
    if (err) {
      console.error(err);
    } else {
      console.log(`Email sent: ${info.response}`);
    }
  });
}

module.exports = { mySendMail }