/**
 * Requested user handlers
 */

// Dependencies
const _data = require("../libs/data");
const { hash, verifyToken } = require("../libs/helpers");

module.exports = {
  post: function (data, callback) {
    /**
     * User - post
     * Required data: firstName, lastName, phone, password, tosAgreement
     * Optional data: none
     */

    const fieldValidations = [];

    // Check that all required fields are filled out
    const firstName =
      typeof data.payload.firstName === "string" &&
      data.payload.firstName.trim().length > 0
        ? data.payload.firstName.trim()
        : false;

    fieldValidations.push(firstName);

    const lastName =
      typeof data.payload.lastName === "string" &&
      data.payload.lastName.trim().length > 0
        ? data.payload.lastName.trim()
        : false;

    fieldValidations.push(lastName);

    const phone =
      typeof data.payload.phone === "string" &&
      data.payload.phone.trim().length === 10
        ? data.payload.phone.trim()
        : false;

    fieldValidations.push(phone);

    const password =
      typeof data.payload.password === "string" &&
      data.payload.password.trim().length > 0
        ? data.payload.password.trim()
        : false;

    fieldValidations.push(password);

    const tosAgreement =
      typeof data.payload.tosAgreement === "boolean" &&
      data.payload.tosAgreement
        ? data.payload.tosAgreement
        : false;

    fieldValidations.push(tosAgreement);

    if (fieldValidations.some((field) => field === false)) {
      callback(400, { error: "Missing required fields" });
    } else {
      // Make sure that the user does not already exists
      _data.read("users", phone, (error, data) => {
        if (error) {
          // Hash the password
          const hashedPassword = hash(password);

          if (hashedPassword) {
            // Create new user object
            const user = {
              firstName,
              lastName,
              phone,
              hashPassword: hashedPassword,
              tosAgreement,
            };

            // Store the user
            _data.create("users", `${phone}`, user, (error) => {
              console.log(error);
              if (!error) {
                callback(200);
              } else {
                console.log(error);
                callback(500, { error: "Could not create the new user" });
              }
            });
          } else {
            callback(500, { error: "Could not hash the user password" });
          }
        } else {
          callback(400, {
            error: "A user with that phone number already exists",
          });
        }
      });
    }
  },
  get: function (data, callback) {
    /**
     * User - get
     * Required data: phone
     * Optional data: none
     */

    // Check that the phone number is valid
    const phone =
      data.queryStringObject.phone &&
      typeof data.queryStringObject.phone === "string" &&
      data.queryStringObject.phone.trim().length === 10
        ? data.queryStringObject.phone.trim()
        : false;

    if (!phone) {
      callback(400, { error: "Missing required field" });
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
        verifyToken(token, phone, (valid) => {
          if (!valid) {
            callback(403, {
              error: "Missing required token in header or token is invalid",
            });
          } else {
            _data.read("users", phone, (error, data) => {
              if (error || !data) {
                callback(404);
              } else {
                // Remove the hashed password from the user before returning
                delete data.hashedPassword;
                callback(200, data);
              }
            });
          }
        });
      }
    }
  },
  put: function (data, callback) {
    /**
     * User - put
     * Required data: phone
     * Optional data: firstName, lastName, password (at least one must be there)
     */

    // Check for the required field
    const phone =
      data.payload.phone &&
      typeof data.payload.phone === "string" &&
      data.payload.phone.trim().length === 10
        ? data.payload.phone.trim()
        : false;

    if (!phone) {
      callback(400, { error: "Missing required phone field" });
    } else {
      // Check that optional fields are filled out
      const updateUser = {};

      updateUser.phone = phone;

      typeof data.payload.firstName === "string" &&
      data.payload.firstName.trim().length > 0
        ? (updateUser.firstName = data.payload.firstName.trim())
        : false;

      typeof data.payload.lastName === "string" &&
      data.payload.lastName.trim().length > 0
        ? (updateUser.lastName = data.payload.lastName.trim())
        : false;

      typeof data.payload.password === "string" &&
      data.payload.password.trim().length > 0
        ? (updateUser.password = hash(data.payload.password.trim()))
        : false;

      if (Object.keys(updateUser).length < 2) {
        callback(400, { error: "Missing fields to update" });
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
          verifyToken(token, phone, (valid) => {
            if (!valid) {
              callback(403, {
                error: "Missing required token in header or token is invalid",
              });
            } else {
              // Lookup the user
              _data.read("users", phone, (error, userData) => {
                if (error || !userData) {
                  callback(400, { error: "The specified user does not exist" });
                } else {
                  // Update the fields
                  Object.keys(updateUser).map((key) => {
                    userData[key] = updateUser[key];
                  });

                  _data.update("users", phone, userData, (error) => {
                    if (error) {
                      console.log(error);
                      callback(500, { error: "Could not update the user" });
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
     * Users - delete
     * Required field: phone
     * @TODO Cleanup (delete) any other data files associated with this user
     */

    // Check that the phone number is valid
    const phone =
      data.queryStringObject.phone &&
      typeof data.queryStringObject.phone === "string" &&
      data.queryStringObject.phone.trim().length === 10
        ? data.queryStringObject.phone.trim()
        : false;

    if (!phone) {
      callback(400, { error: "Missing required field" });
    } else {
      _data.read("users", phone, (error, userData) => {
        if (error || !userData) {
          callback(400, { error: "Could not found user" });
        } else {
          // Get the token from the headers
          const token =
            typeof data.headers.token === "string" ? data.headers.token : false;

          if (!token) {
            callback(403, {
              error: "Missing required token in header or token is invalid",
            });
          } else {
            verifyToken(token, phone, (valid) => {
              if (!valid) {
                callback(403, {
                  error: "Missing required token in header or token is invalid",
                });
              } else {
                // Delete the file associated to this user
                _data.delete("users", phone, (error) => {
                  if (error) {
                    callback(500, {
                      error: "Could not delete the specified user",
                    });
                  } else {
                    const userChecks =
                      typeof userData.checks === "object" &&
                      userData.checks instanceof Array
                        ? userData.checks
                        : [];

                    if (userChecks.length) {
                      let checksDeleted = 0;
                      let deletionErrors = false;

                      userChecks.forEach((checkId) => {
                        _data.delete("checks", checkId, (error) => {
                          if (error) {
                            deletionErrors = true;
                          }

                          checksDeleted++;

                          if (checksDeleted === userChecks.length) {
                            if (!deletionErrors) {
                              callback(200);
                            } else {
                              callback(500, {
                                error:
                                  "Error encountered trying to delete checks for this user",
                              });
                            }
                          }
                        });
                      });
                    } else {
                      callback(200);
                    }
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
