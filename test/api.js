/**
 * API Tests
 */

const app = require('../index');
const assert = require('assert');
const http = require('http');
const config = require('../config');

const helpers = {
  makeGetRequest: (path, callback) => {
    const requestDetails = {
      protocol: 'http:',
      hostname: 'localhost',
      port: config.httpPort,
      method: 'GET',
      path: path,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const request = http.request(requestDetails, (res) => {
      callback(res);
    });

    request.end();
  }
}

// Holder for the tests
const api = {
  //The main init() function should be able to run without throwing
  'app.init should start without throwing': (done) => {
    assert.doesNotThrow(() => {
      app.init(() => {
        done()
      });
    }, TypeError)
  },
  '/ping should respond to GET with 200': (done) => {
    helpers.makeGetRequest('/ping', (res) => {
      assert.equal(res.statusCode, 200);
      done();
    });
  },
  '/api/users should respond to GET with 400': (done) => {
    helpers.makeGetRequest('/api/users', (res) => {
      assert.equal(res.statusCode, 200);
      done();
    });
  },
  'Random path should respond to GET with 404': (done) => {
    helpers.makeGetRequest('/api/should-not-exists', (res) => {
      assert.equal(res.statusCode, 400);
      done();
    });
  },
}

module.exports = api;