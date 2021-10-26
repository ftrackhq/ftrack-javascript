"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = exports.Event = void 0;

var _assign = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/assign"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _v = _interopRequireDefault(require("uuid/v4"));

// :copyright: Copyright (c) 2016 ftrack

/**
 * ftrack API Event class.
 */
var Event = /*#__PURE__*/function () {
  /**
   * Construct Event instance with *topic*, *data* and additional *options*.
   *
   * *topic* should be a string representing the event.
   *
   * *data* should be an object with the event payload.
   */
  function Event(topic, data) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    (0, _classCallCheck2["default"])(this, Event);
    this._data = (0, _assign["default"])({
      topic: topic,
      data: data,
      target: "",
      inReplyToEvent: null
    }, options, {
      id: (0, _v["default"])(),
      sent: null
    });
  }
  /** Return event data. */


  (0, _createClass2["default"])(Event, [{
    key: "getData",
    value: function getData() {
      return this._data;
    }
    /** Add source to event data. */

  }, {
    key: "addSource",
    value: function addSource(source) {
      this._data.source = source;
    }
  }]);
  return Event;
}();

exports.Event = Event;
var _default = Event;
exports["default"] = _default;