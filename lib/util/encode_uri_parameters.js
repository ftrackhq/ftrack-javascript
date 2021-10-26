"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/keys"));

// :copyright: Copyright (c) 2018 ftrack
function encodeUriParameters(data) {
  var _context;

  return (0, _map["default"])(_context = (0, _keys["default"])(data)).call(_context, function (key) {
    var _context2;

    return (0, _map["default"])(_context2 = [key, data[key]]).call(_context2, encodeURIComponent).join("=");
  }).join("&");
}

var _default = encodeUriParameters;
exports["default"] = _default;