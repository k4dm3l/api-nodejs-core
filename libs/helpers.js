/**
 * Helpers for various tasks
 */

// Dependencies
const crypto = require("crypto");
const config = require("../config");
const _data = require("../libs/data");

/**
 * Create a SHA256 hash
 * @param {*} string
 */
const hash = function (str) {
  if (typeof str !== "string" || !str.length) {
    return false;
  } else {
    const hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  }
};

/**
 * Parse JSON string to an object without throwing
 * @param {*} bufferStr
 */
const parseJsonToObject = function (bufferStr) {
  try {
    return JSON.parse(bufferStr);
  } catch (error) {
    return {};
  }
};

/**
 * Create a string with randome characteres
 * @param {*} characters
 */
const createRandomString = function (strLength) {
  strLength =
    typeof strLength === "number" && strLength > 0 ? strLength : false;

  if (!strLength) {
    return false;
  } else {
    const possibleCharacters = "abcdefghijklmnopqrstuvwxyz";
    let tokenId = "";

    for (let i = 1; i <= strLength; i++) {
      const randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );
      tokenId += randomCharacter;
    }

    return tokenId;
  }
};

const verifyToken = function (tokenId, phone, callback) {
  require("../libs/data").read("tokens", tokenId, (error, tokenData) => {
    if (error || !tokenData) {
      callback(false);
    } else {
      if (tokenData.phone !== phone || tokenData.expires < Date.now()) {
        callback(false);
      } else {
        callback(true);
      }
    }
  });
};

const getANumber = () => 1;

module.exports = {
  hash,
  parseJsonToObject,
  createRandomString,
  verifyToken,
  getANumber,
};
