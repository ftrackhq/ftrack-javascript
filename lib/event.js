'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Event = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // :copyright: Copyright (c) 2016 ftrack


var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * ftrack API Event class.
 */
var Event = exports.Event = function () {
    /**
     * Construct Event instance with *topic*, *data* and additional *options*.
     *
     * *topic* should be a string representing the event.
     *
     * *data* should be an object with the event payload.
     */
    function Event(topic, data) {
        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

        _classCallCheck(this, Event);

        this._data = Object.assign({
            topic: topic,
            data: data,
            target: '',
            inReplyToEvent: null
        }, options, {
            id: _uuid2.default.v4(),
            sent: null
        });
    }

    /** Return event data. */


    _createClass(Event, [{
        key: 'getData',
        value: function getData() {
            return this._data;
        }

        /** Add source to event data. */

    }, {
        key: 'addSource',
        value: function addSource(source) {
            this._data.source = source;
        }
    }]);

    return Event;
}();

exports.default = Event;