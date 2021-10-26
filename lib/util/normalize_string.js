"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _loglevel = _interopRequireDefault(require("loglevel"));

// :copyright: Copyright (c) 2019 ftrack
function normalizeString(value) {
  var result = value;

  try {
    result = value.normalize();
  } catch (error) {
    _loglevel["default"].warn("Failed to normalize string", value, error);
  }

  return result;
}

var _default = normalizeString;
exports["default"] = _default;