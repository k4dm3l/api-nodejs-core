/**
 * Requested token handlers
 */

// Dependencies
const _data = require("../libs/data");
const { hash, createRandomString } = require("../libs/helpers");
const {performance, PerformanceObserver} = require('perf_hooks');
const util = require('util');

const debug = util.debuglog('performance');

module.exports = {
  post: function (data, callback) {
    /**
     * Tokens - post
     * Required data: phone, password
     * Optional data: none
     */
    // Log out all the measurements
    const performanceObserver = new PerformanceObserver((list, observer) => {
      const measurements = list.getEntriesByType('measure');

      measurements.forEach((measurement) => {
        debug(
          "\x1b[33m%s\x1b[0m", `${measurement.name} - ${measurement.duration}`
        );
      });

      observer.disconnect();
    });

    performanceObserver.observe({ entryTypes: ['measure'], buffered: true });
    performance.mark('entered function');

    const phone =
      typeof data.payload.phone === "string" &&
      data.payload.phone.trim().length === 10
        ? data.payload.phone.trim()
        : false;

    const password =
      typeof data.payload.password === "string" &&
      data.payload.password.trim().length > 0
        ? data.payload.password.trim()
        : false;

    performance.mark('inputs validated');

    if (!phone || !password) {
      callback(400, { error: 'Missing required fields' })
    } else {
      // Lookup the user whot matches that phone number
      performance.mark('beginning user lookup');
      _data.read('users', phone, (error, userData) => {
        performance.mark('user lookup complete');
        if (error || !userData) {
          callback(400, { error: 'Could not find user' });
        } else {
          performance.mark('beginning password hasing');
          const hashedIncomingPassword = hash(password);
          performance.mark('password hasing complete');

          if (hashedIncomingPassword !== userData.hashPassword) {
            callback(400, { error: 'Password did not match' });
          } else {
            performance.mark('creating data for token');
            // If valid, create a new token with expiration time 60 minutes in the future
            const tokenId = createRandomString(20);
            const expirationTime = Date.now() + 1000 * 60 * 60;
            
            const tokenObject = {
              phone,
              id: tokenId,
              expires: expirationTime,
            };

            performance.mark('beginning storing token');
            // Store the token
            _data.create('tokens', tokenId, tokenObject, (error) => {
              performance.mark('storing token complete');

              // Gather all the measurements
              performance.measure('Beginning to end', 'entered function', 'storing token complete');
              performance.measure('Validating user input', 'entered function', 'inputs validated');
              performance.measure('User lookup', 'beginning user lookup', 'user lookup complete');
              performance.measure('Password hashing', 'beginning password hasing', 'password hasing complete');
              performance.measure('Token data creation', 'creating data for token', 'beginning storing token');
              performance.measure('Token storing', 'beginning storing token', 'storing token complete');

              if (error) {
                callback(500, { error: 'Could not create the new token' });
              } else {
                callback(200, tokenObject);
              }
            });
          }
        }
      });
    }
  },
  get: function (data, callback) {
    /**
     * Tokens - get
     * Required data: id
     * Optional data: none
     */

    // Check that the id is valid
    const id =
      typeof data.queryStringObject.id === "string" &&
      data.queryStringObject.id.trim().length === 20
        ? data.queryStringObject.id.trim()
        : false;

    if (!id) {
      callback(400, { error: 'Missing required data' });
    } else {
      _data.read('tokens', id, (error, tokenData) => {
        if (error || !tokenData) {
          callback(404);
        } else {
          callback(200, tokenData);
        }
      });
    }
  },
  put: function (data, callback) {
    /**
     * Tokens - put
     * Required data: id, extend (boolean to indicate if the token expiration time should be extended)
     * Option data: none
     */

     const id =
     typeof data.payload.id === "string" &&
     data.payload.id.trim().length === 20
       ? data.payload.id.trim()
       : false;
    
    const extended =
    typeof(data.payload.extended) === 'boolean' &&
    data.payload.extended
      ? data.payload.extended
      : false;

    if (!id || !extended) {
      callback(400, { error: 'Missing required field(s)' });
    } else {
      // Look up the token
      _data.read('tokens', id, (error, tokenData) => {
        if (error || !tokenData) {
          callback(400, { error: 'Specified token does not exists' });
        } else {
          // Check to make sure the token is not already expired
          if (tokenData.expires < Date.now()) {
            callback(400, { error: 'The token has already expired and cannot be extended' });
          } else {
            // Set the expiration and hour from noew
            tokenData.expires = Date.now() + 1000 * 60 * 60;

            _data.update('tokens', id, tokenData, (error) => {
              if (error) {
                callback(500, { error: 'Could not be able to update the token expiration time' });
              } else {
                callback(200);
              }
            });
          }
        }
      });
    }
  },
  delete: function (data, callback) {
    /**
     * Tokens - delete
     * Required data: id
     * Optional data: none
     */

    // Check that the id is valid
    const id =
      data.queryStringObject.id &&
      typeof data.queryStringObject.id === "string" &&
      data.queryStringObject.id.trim().length === 20
        ? data.queryStringObject.id.trim()
        : false;

    if (!id) {
      callback(400, { error: "Missing required field" });
    } else {
      _data.read("tokens", id, (error, data) => {
        if (error || !data) {
          callback(400, { error: 'Could not found token' });
        } else {
          // Delete the file associated to this user
          _data.delete('tokens', id, (error) => {
            if (error) {
              callback(500, { error: 'Could not delete the specified token' });
            } else {
              callback(200);
            }
          });
        }
      }); 
    }
  },
};
