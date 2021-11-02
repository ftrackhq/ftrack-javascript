"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _loglevel = require("loglevel");

var _loglevel2 = _interopRequireDefault(_loglevel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function normalizeString(value) {
  var result = value;
  try {
    result = value.normalize();
  } catch (error) {
    _loglevel2.default.warn("Failed to normalize string", value, error);
  }

  return result;
} // :copyright: Copyright (c) 2019 ftrack
exports.default = normalizeString;
module.exports = exports['default'];