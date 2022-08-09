require("isomorphic-fetch");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

module.exports = {
  require: [
    "@babel/register",
    "chai/register-expect.js",
    "chai/register-should.js",
    "jsdom-global/register",
  ],
};