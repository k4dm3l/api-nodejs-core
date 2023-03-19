const config = require("../config");
const https = require("https");

module.exports = {
  sendSms: function (phone, message, callback) {
    phone =
      typeof phone === "string" && phone.trim().length === 10
        ? phone.trim()
        : false;
    message =
      typeof message === "string" &&
      message.trim().length > 1 &&
      message.trim().length <= 1600
        ? message.trim()
        : false;

    console.log(phone, message);

    if (!phone || !message) {
      callback('Given parameters were missing or invalid');
    } else {
      // Configure the request payload
      const payload = {
        From: config.twilio.fromPhone,
        To: `+57${phone}`,
        Body: message,
      };

      // Stringify the payload
      const stringifyPayload = new URLSearchParams(payload).toString();

      // Configure the request details
      const requestConfig = {
        protocol: 'https:',
        hostname: 'api.twilio.com',
        method: 'POST',
        path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
        auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(stringifyPayload),
        }
      };

      const request = https.request(requestConfig, (res) => {

        // Callback succress if goes well
        if (res.statusCode > 201) {
          callback(`Status code returned was ${res.statusCode}`);
        } else {
          callback(false);
        }
      });

      // Bind to the error event
      request.on("error", (error) => {
        callback(error);
      });

      // Add the payload
      request.write(stringifyPayload);

      // End the request
      request.end();
    }
  },
};
