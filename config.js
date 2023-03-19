/**
 * Create and export configuration variables
 */

// Staging environment (default)
const staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "staging",
  hashingSecret: "t3st1Ng",
  maxChecks: 5,
  twilio: {
    fromPhone: 'Twilio Phone Number',
    accountSid: "Twilio SID",
    authToken: "Twilio Token Id",
  }
};

// Testing
const testing = {
  httpPort: 4000,
  httpsPort: 4001,
  envName: "staging",
  hashingSecret: "t3st1Ng",
  maxChecks: 5,
  twilio: {
    fromPhone: 'Twilio Phone Number',
    accountSid: "Twilio SID",
    authToken: "Twilio Token Id",
  }
};

// Production environment
const production = {
  httpPort: 4000,
  httpsPort: 4001,
  envName: "production",
  hashingSecret: "T3sT1Ng",
  maxChecks: 5,
  twilio: {
    fromPhone: 'Twilio Phone Number',
    accountSid: "Twilio SID",
    authToken: "Twilio Token Id",
  }
};

const environments = {
  staging,
  production,
  testing,
};

const currentEnvironment =
  typeof process.env.NODE_ENV === "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

const environmentToExport =
  typeof environments[currentEnvironment] === "object"
    ? environments[currentEnvironment]
    : environments["staging"];

module.exports = {
  ...environmentToExport,
};
