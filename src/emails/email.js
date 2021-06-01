const nodemailer = require("nodemailer");
const result = require("dotenv");

result.config();
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.OAUTH_CLIENTID,
  process.env.OAUTH_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH_PLAYGROUND
);

oauth2Client.setCredentials({
  refresh_token: process.env.OAUTH_REFRESH_TOKEN,
});

const smtpTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_ADDRESS,
    clientId: process.env.OAUTH_CLIENTID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendWelcomeMail = async (email, name) => {
  const mailOptions = {
    from: `Nirmalya's Task Manager API 🔥🔥 testmailnodejs532@gmail.com`,
    to: email,
    subject: "Welcome to our Task Manager Application",
    text: `Hello ${name}! Welcome. Have a good day.`,
  };

  smtpTransport.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
    smtpTransport.close();
  });
};

const sendCancellationEmail = async (email, name) => {
  const mailOptions = {
    from: `Sad to see you go 😢😢😢 testmailnodejs532@gmail.com`,
    to: email,
    subject: "Goodbye from our Task Manager Application",
    text: `We would like to know from you ${name} about the possible reasons for which you chose to say Goodbye to us.This may help us to improve our services even more.Have a good day.`,
  };

  smtpTransport.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
    smtpTransport.close();
  });
};

module.exports = {
  sendWelcomeMail,
  sendCancellationEmail,
};
