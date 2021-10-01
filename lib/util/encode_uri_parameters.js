"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

// :copyright: Copyright (c) 2018 ftrack
function encodeUriParameters(data) {
  return Object.keys(data).map(function (key) {
    return [key, data[key]].map(encodeURIComponent).join("=");
  }).join("&");
}

var _default = encodeUriParameters;
exports["default"] = _default;