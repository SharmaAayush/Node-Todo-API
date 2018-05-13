const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_PASSWORD
  }
});

let mySendMail = (reciver, verificationLink) => {
  let mailOptions = {
    from: 'TodoApp.Aayush@gmail.com',
    to: reciver,
    subject: 'Email verification link for TodoApp',
    html: `
    <div style="width: 90%; margin: auto; box-shadow: 0 10px 20px 0 rgba(204,204,204,.8); margin-top: 4%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">
  <div style="padding: 2em; background: linear-gradient(to top, rgba(234, 67, 53, 1), rgba(234, 67, 53, 0.75)); color: #ffffff;">
    <h1 style="text-align: center; font-size: 2em;">
      Email verification for ${reciver}</h1>
  </div>
  <div style="padding: 2em">
    <p>This is an automatically generated email in response to your request to verify your email address:
      ${reciver}. Please do not reply to this email.</p>
    <span style="text-align: center;">To verify your email address please visit
      <a href="${verificationLink}" target="_blank">
        ${verificationLink}
      </a>
    </span>
    <br>
    <p>If you didn't requested for an Email Verification link then you can safely ignore this link and no further action will
      be taken.
    </p>
  </div>
</div>
    `
  };
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.warn(err);
    }
  });
}

let sendReminderMail = function (reciver, title, description) {
  let mailOptions = {
    from: 'TodoApp.Aayush@gmail.com',
    to: reciver,
    subject: `Reminder for your ${title} Todo`,
    html: `
    <div style="width: 90%; margin: auto; box-shadow: 0 10px 20px 0 rgba(204,204,204,.8); margin-top: 4%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">
    <div style="padding: 2em; background: linear-gradient(to top, rgba(234, 67, 53, 1), rgba(234, 67, 53, 0.75)); color: #ffffff;">
      <h1 style="text-align: center; font-size: 2em;">
        Email Reminder for ${title} todo.</h1>
    </div>
    <div style="padding: 2em">
      <p>This is an automatically generated email in response to your request to remind you about: <span style="
        background-color: #dfdcde;
        padding-left: 0.5em;
        padding-right: 0.5em;
        padding-bottom: 0.25em;
        border-radius: 5px;
      ">${title}</span> todo. Please do not
        reply to this email.</p>
      <span style="text-align: center;">This mail was scheduled by you to remind yourself to complete the ${title} todo.
      </span>
      <br>
      <div style="width: 90%; margin: auto; background-color: #dfdcde; padding: 1.5em; margin-top: 2em; padding-top: 0;">
        <h2 style="text-align: center;">${title}</h2>
        <p style="text-align: center; width: 90%; margin: auto; background-color: #fff; padding: 1em;">${description}</p>
      </div>
    </div>
  </div>
    `
  };
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.warn(err);
    }
  });
}

module.exports = { mySendMail, sendReminderMail }