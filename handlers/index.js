/**
 * Request handlers
 */

// Dependencies
const userHandlers = require("./users");
const tokenHandlers = require("./tokens");
const checkHandlers = require("./checks");
const exampleError = require('./exampleError');

module.exports = {
  sample: function (data, callback) {
    // Callback a http status code and a payload that should be an object
    callback(406, { status: 406, response: "health handler" });
  },
  notFound: function (data, callback) {
    // Callback a http status code 404
    callback(404);
  },
  ping: function (data, callback) {
    callback(200);
  },
  users: function (data, callback) {
    const acceptableMethods = ["post", "get", "put", "delete"];

    if (acceptableMethods.indexOf(data.method) < 0) {
      callback(405);
    } else {
      userHandlers[data.method](data, callback);
    }
  },
  tokens: function (data, callback) {
    const acceptableMethods = ["post", "get", "put", "delete"];

    if (acceptableMethods.indexOf(data.method) < 0) {
      callback(405);
    } else {
      tokenHandlers[data.method](data, callback);
    }
  },
  checks: function (data, callback) {
    const acceptableMethods = ["post", "get", "put", "delete"];

    if (acceptableMethods.indexOf(data.method) < 0) {
      callback(405);
    } else {
      checkHandlers[data.method](data, callback);
    }
  },
  exampleError,
};
