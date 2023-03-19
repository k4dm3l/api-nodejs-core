/**
 * Unit tests
 */
const helpers = require('../libs/helpers');
const logs = require('../libs/logger');
const exampleDebbuggingProblem = require('../libs/exampleDebuggingProblem');
const assert = require('assert');
const unit = {};

// Assert that the getANumber function is returning a number
unit['helpers.getANumber should return a number'] = (done) => {
  const val = helpers.getANumber();

  assert.equal(typeof(val), 'number');
  done();
};

// Assert that the getANumber function is returning a 1
unit['helpers.getANumber should return 1'] = (done) => {
  const val = helpers.getANumber();

  assert.equal(val, 1);
  done();
};

// Assert that the getANumber function is returning a 2
unit['helpers.getANumber should return 2'] = (done) => {
  const val = helpers.getANumber();

  assert.equal(val, 2);
  done();
};

// Logs.list should callback an array and a false error
unit['logs.list should callback a false error and an array of log names'] = (done) => {
  logs.list(true, (error, logFileNames) => {
    assert.equal(error, false);
    assert.ok(logFileNames instanceof Array);
    assert.ok(logFileNames.length);
    
    done();
  });
};

// Logs.truncate should not throw if the logId does not exists
unit['logs.truncate should not throw if the logId does not exist. It should callback an error instead'] = (done) => {
    assert.doesNotThrow(() => {
    logs.truncate('DO NOT EXISTS', (error) => {      
      done();
    }, TypeError);
  });
};

// exampleDebugginProblem.init should not throw (but it does)
unit['exampleDebugginProblem.init should not throw but it does'] = (done) => {
  assert.doesNotThrow(() => {
    exampleDebbuggingProblem.init();
    done();
  }, TypeError);
};

module.exports = unit;