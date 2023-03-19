/**
 * Requested check handlers
 */

// Dependencies
const _url = require('url');
const dns = require('dns');
const config = require("../config");
const _data = require("../libs/data");
const { createRandomString, verifyToken } = require("../libs/helpers");

module.exports = {
  post: function (data, callback) {
    /**
     * Checks - post
     * Required data: protocol, url, method, sucessCodes, timeoutSeconds
     * Optional data: none
     */

    const fieldValidations = [];

    // Check inputs
    const protocol =
      typeof data.payload.protocol === "string" &&
      ["http", "https"].indexOf(data.payload.protocol) > -1
        ? data.payload.protocol
        : false;

    fieldValidations.push(protocol);

    const url =
      typeof data.payload.url === "string" && data.payload.url.trim().length > 0
        ? data.payload.url.trim()
        : false;

    fieldValidations.push(url);

    const method =
      typeof data.payload.method === "string" &&
      ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
        ? data.payload.method
        : false;

    fieldValidations.push(method);

    const sucessCodes =
      typeof data.payload.sucessCodes === "object" &&
      data.payload.sucessCodes instanceof Array &&
      data.payload.sucessCodes.length > 0
        ? data.payload.sucessCodes
        : false;

    fieldValidations.push(sucessCodes);

    const timeoutSeconds =
      typeof data.payload.timeoutSeconds === "number" &&
      data.payload.timeoutSeconds % 1 === 0 &&
      data.payload.timeoutSeconds > 0 &&
      data.payload.timeoutSeconds <= 5
        ? data.payload.timeoutSeconds
        : false;

    fieldValidations.push(timeoutSeconds);

    if (fieldValidations.some((field) => field === false)) {
      callback(400, { error: "Missing required fields" });
    } else {
      // Get the token from the headers
      const token =
        typeof data.headers.token === "string" ? data.headers.token : false;

      if (!token) {
        callback(403, {
          error: "Missing required token in header or token is invalid",
        });
      } else {
        _data.read("tokens", token, (error, tokenData) => {
          if (error || !tokenData) {
            callback(403);
          } else {
            verifyToken(token, tokenData.phone, (valid) => {
              if (!valid) {
                callback(403, {
                  error: "Missing required token in header or token is invalid",
                });
              } else {
                const userPhone = tokenData.phone;

                _data.read("users", userPhone, (error, userData) => {
                  if (error || !userData) {
                    callback(403);
                  } else {
                    const userChecks =
                      typeof userData.checks === "object" &&
                      userData.checks instanceof Array
                        ? userData.checks
                        : [];

                    if (userChecks.length >= config.maxChecks) {
                      callback(400, {
                        error: `The user already has the maximum number of check (${config.maxChecks})`,
                      });
                    } else {
                      // Verify that the URL given has DNS entries
                      const parsedURL = _url.parse(`${protocol}://${url}`, true);
                      const hostname = typeof(parsedURL.hostname) === 'string' && parsedURL.hostname.length ? parsedURL.hostname : false;

                      dns.resolve(hostname, (error, records) => {
                        if (error || !records) {
                          // error validation
                          callback(400, { 'Error': 'The hostname of the URL entered did not resolve to any DNS' });
                        } else {
                          // rest of the code
                          // Create a random id for the check
                          const checkId = createRandomString(20);

                          // Create the check object and include the user's phone
                          const checkObject = {
                            id: checkId,
                            userPhone,
                            protocol,
                            url,
                            method,
                            sucessCodes,
                            timeoutSeconds,
                          };

                          _data.create("checks", checkId, checkObject, (error) => {
                            if (error) {
                              callback(500, {
                                error: "Could not create the new check",
                              });
                            } else {
                              // Add the check id to the user's object
                              userData.checks = userChecks;
                              userData.checks.push(checkId);

                              _data.update(
                                "users",
                                userPhone,
                                userData,
                                (error) => {
                                  if (error) {
                                    callback(500, {
                                      error:
                                        "Could not update the user with the new check",
                                    });
                                  } else {
                                    // Return the data about the new check
                                    callback(200, checkObject);
                                  }
                                }
                              );
                            }
                          });
                        }
                      });
                    }
                  }
                });
              }
            });
          }
        });
      }
    }
  },
  get: function (data, callback) {
    /**
     * Check - get
     * Required data: id
     * Optional data: none
     */

    // Check that the id number is valid
    const id =
      data.queryStringObject.id &&
      typeof data.queryStringObject.id === "string" &&
      data.queryStringObject.phone.trim().length === 20
        ? data.queryStringObject.id.trim()
        : false;

    if (!id) {
      callback(400, { error: "Missing required field" });
    } else {
      _data.read("checks", id, (error, checkData) => {
        if (error || !checkData) {
          callback(404);
        } else {
          // Get the token from the headers
          const token =
            typeof data.headers.token === "string" ? data.headers.token : false;

          if (!token) {
            callback(403, {
              error: "Missing required token in header or token is invalid",
            });
          } else {
            // Verify authenticity for the token
            verifyToken(token, checkData.userPhone, (valid) => {
              if (!valid) {
                callback(403, {
                  error: "Missing required token in header or token is invalid",
                });
              } else {
                callback(200, checkData);
              }
            });
          }
        }
      });
    }
  },
  put: function (data, callback) {
    /**
     * Checks - put
     * Required data: id
     * Optional data: protocol, url, method, sucessCodes, timeoutSeconds
     */

    const updateCheck = {};

    // Check required data
    const id =
      typeof data.payload.id === "string" &&
      data.payload.id.trim().length === 20
        ? data.payload.id
        : false;

    // Check optional inputs
    typeof data.payload.protocol === "string" &&
    ["http", "https"].indexOf(data.payload.protocol) > -1
      ? (updateCheck.protocol = data.payload.protocol)
      : false;

    typeof data.payload.url === "string" && data.payload.url.trim().length > 0
      ? (updateCheck.url = data.payload.url.trim())
      : false;

    typeof data.payload.method &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
      ? (updateCheck.method = data.payload.method)
      : false;

    typeof data.payload.sucessCodes === "object" &&
    data.payload.sucessCodes instanceof Array &&
    data.payload.sucessCodes.length > 0
      ? (updateCheck.sucessCodes = data.payload.sucessCodes)
      : false;

    typeof data.payload.timeoutSeconds === "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds > 0 &&
    data.payload.timeoutSeconds <= 5
      ? (updateCheck.timeoutSeconds = data.payload.timeoutSeconds)
      : false;

    if (!id) {
      callback(400, { error: "Missing required id field" });
    } else {
      updateCheck.id = id;

      // Check that optional fields are filled out
      if (Object.keys(updateCheck).length < 2) {
        callback(400, { error: "Missing fields to update" });
      } else {
        const token =
          typeof data.headers.token === "string" ? data.headers.token : false;

        if (!token) {
          callback(403, {
            error: "Missing required token in header or token is invalid",
          });
        } else {
          _data.read("checks", id, (error, checkData) => {
            if (error || !checkData) {
              callback(400, { error: "Check ID did not exists" });
            } else {
              verifyToken(token, checkData.userPhone, (valid) => {
                if (!valid) {
                  callback(403, {
                    error:
                      "Missing required token in header or token is invalid",
                  });
                } else {
                  Object.keys(updateCheck).map((key) => {
                    checkData[key] = updateCheck[key];
                  });

                  _data.update("checks", id, checkData, (error) => {
                    if (error) {
                      console.log(error);
                      callback(500, { error: "Could not update the check" });
                    } else {
                      callback(200);
                    }
                  });
                }
              });
            }
          });
        }
      }
    }
  },
  delete: function (data, callback) {
    /**
     * Checks - delete
     * Required data: id
     * Optional data: none
     */

    // Check that the id number is valid
    const id =
      data.queryStringObject.id &&
      typeof data.queryStringObject.id === "string" &&
      data.queryStringObject.id.trim().length === 20
        ? data.queryStringObject.id.trim()
        : false;

    if (!id) {
      callback(400, { error: "Missing required field" });
    } else {
      _data.read("checks", id, (error, checkData) => {
        if (error || !checkData) {
          callback(400, { error: "Could not found check" });
        } else {
          // Get the token from the headers
          const token =
            typeof data.headers.token === "string" ? data.headers.token : false;

          if (!token) {
            callback(403, {
              error: "Missing required token in header or token is invalid",
            });
          } else {
            verifyToken(token, checkData.userPhone, (valid) => {
              if (!valid) {
                callback(403, {
                  error: "Missing required token in header or token is invalid",
                });
              } else {
                // Delete the file associated to this check
                _data.delete("checks", id, (error) => {
                  if (error) {
                    callback(500, {
                      error: "Could not delete the specified check",
                    });
                  } else {
                    _data.read(
                      "users",
                      checkData.userPhone,
                      (error, userData) => {
                        if (error || !userData) {
                          callback(500, {
                            error:
                              "Could not find the specified user to update the checks associated with this one",
                          });
                        } else {
                          const userChecks =
                            typeof userData.checks === "object" &&
                            userData.checks instanceof Array
                              ? userData.checks
                              : [];

                          const checkPosition = userChecks.indexOf(id);

                          if (checkPosition < 0) {
                            callback(500, {
                              error:
                                "Could not find the check on the users object",
                            });
                          } else {
                            userData.checks = userChecks.splice(
                              checkPosition,
                              1
                            );

                            // Re-save the user's data
                            _data.update(
                              "users",
                              checkData.userPhone,
                              userData,
                              (error) => {
                                if (error) {
                                  callback(500, {
                                    error: "Could not update the user",
                                  });
                                } else {
                                  callback(200);
                                }
                              }
                            );
                          }
                        }
                      }
                    );
                    callback(200);
                  }
                });
              }
            });
          }
        }
      });
    }
  },
};
