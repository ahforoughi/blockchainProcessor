const crypto = require("crypto");

const hash = (x) =>
  crypto
    .createHash("sha512")
    .update(x)
    .digest("hex")
    .toLowerCase()
    .substring(0, 64);

const NAMESPACE = "59b423";

const createPatAddress = (accountId) => {
  return NAMESPACE + "ab" + hash(accountId).substr(0, 60) + "ab";
};

const createDocAddress = (accountId) => {
  return NAMESPACE + "ac" + hash(accountId).substr(0, 60) + "ac";
};

const createDRUGAddress = (accountId) => {
  return NAMESPACE + "ad" + hash(accountId).substr(0, 60) + "ad";
};

module.exports = {
  createPatAddress,
  createDocAddress,
  createDRUGAddress,
};
