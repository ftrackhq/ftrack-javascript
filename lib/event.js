"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.Event = void 0;

var _v = _interopRequireDefault(require("uuid/v4"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

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

    _classCallCheck(this, Event);

    this._data = Object.assign({
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


  _createClass(Event, [{
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