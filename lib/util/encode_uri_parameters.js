"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
// :copyright: Copyright (c) 2018 ftrack

function encodeUriParameters(data) {
  return Object.keys(data).map(function (key) {
    return [key, data[key]].map(encodeURIComponent).join("=");
  }).join("&");
}

exports.default = encodeUriParameters;
module.exports = exports['default'];