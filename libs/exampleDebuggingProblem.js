/**
 * Library that demostrates something throwing when it's init() is called
 */

const example = {
  init: () => {
    //This is an error created intentionally
    const foo = bar;
  }
}

module.exports = example;